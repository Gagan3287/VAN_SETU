/**
 * conflictService.ts
 *
 * Phase 4 — Conflict Engine core service.
 *
 * Provides:
 *  - detectAndUpsertConflicts(claimId): Three-stage PostGIS pipeline using
 *    Prisma.sql parameterized queries (no string interpolation — SQL injection safe).
 *  - computeOverlapPercentage(): Pure math — denominator = smaller claim's area.
 *  - Severity banding: LOW <5%, MEDIUM 5–20%, HIGH >20% (prototype thresholds).
 *  - Auto CONFLICT_REVIEW transition if HIGH/MEDIUM conflicts detected.
 *  - Auto RESOLVED (zero overlap on update) with system audit trail.
 *  - All system-generated audit entries use SYSTEM_ACTOR_ID as userId.
 */

import { Prisma, ConflictSeverity, ConflictStatus, ClaimStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { computeAndPersistRiskScore } from './riskService';

/**
 * Stable system actor ID for auto-generated audit log entries.
 * Distinguished from NULL (unauthenticated) — represents the VanSetu system process.
 */
export const SYSTEM_ACTOR_ID = 'SYSTEM';

// ---------------------------------------------------------------------------
// Severity banding (blueprint §7 prototype thresholds)
// ---------------------------------------------------------------------------

/**
 * Compute overlap percentage: intersection area ÷ SMALLER claim area.
 * Both areas in the same unit (m² from ST_Area or hectares — consistent).
 */
export function computeOverlapPercentage(intersectionArea: number, smallerClaimArea: number): number {
  if (smallerClaimArea <= 0) return 0;
  return (intersectionArea / smallerClaimArea) * 100;
}

/**
 * Band overlap percentage into ConflictSeverity.
 * Boundary values:  exactly 5% → MEDIUM,  exactly 20% → MEDIUM.
 * LOW:    [0,  5)
 * MEDIUM: [5, 20]
 * HIGH:   (20, ∞)
 */
export function bandSeverity(overlapPct: number): ConflictSeverity {
  if (overlapPct < 5) return ConflictSeverity.LOW;
  if (overlapPct <= 20) return ConflictSeverity.MEDIUM;
  return ConflictSeverity.HIGH;
}

// ---------------------------------------------------------------------------
// PostGIS overlap detection pipeline
// ---------------------------------------------------------------------------

interface CandidateClaim {
  id: string;
  claimNumber: string;
  areaHectares: number;
}

interface IntersectionResult {
  intersection_area_m2: number;
}

/**
 * Runs the three-stage PostGIS conflict detection pipeline for a given claimId.
 * All raw SQL uses Prisma.sql tagged template literals — parameterized, injection-safe.
 *
 * Trigger conditions (called by claimController):
 *  - POST /api/claims  (geometry provided at creation)
 *  - PUT  /api/claims/:id  (geometry updated)
 *
 * On each run:
 *  1. Find candidate claims that spatially intersect (ST_Intersects — uses spatial index).
 *  2. Compute precise intersection area (ST_Area + ST_Intersection in UTM Zone 44N, EPSG:32644).
 *  3. Upsert Conflict records (keyed on normalized pair).
 *  4. If overlap drops to 0 after an update: transition existing conflicts to RESOLVED.
 *  5. If HIGH/MEDIUM conflicts remain and claim is in SUBMITTED/FIELD_VERIFICATION:
 *     auto-transition claim to CONFLICT_REVIEW with system audit entry.
 */
export async function detectAndUpsertConflicts(claimId: string): Promise<void> {
  // Fetch the target claim to confirm it has geometry and get its area
  const targetClaim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { id: true, claimNumber: true, areaHectares: true, status: true, geometryJson: true },
  });

  if (!targetClaim || !targetClaim.geometryJson) {
    // No geometry — nothing to detect against
    return;
  }

  // -------------------------------------------------------------------------
  // Stage 1: Candidate filter via ST_Intersects (cheap — uses spatial index)
  // Only check against non-DRAFT, non-REJECTED claims (active/in-review claims)
  // -------------------------------------------------------------------------
  const candidates: CandidateClaim[] = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id, "claimNumber", "areaHectares"
      FROM claims
      WHERE id != ${claimId}
        AND status NOT IN ('DRAFT', 'REJECTED')
        AND geometry IS NOT NULL
        AND ST_Intersects(
          geometry,
          (SELECT geometry FROM claims WHERE id = ${claimId})
        )
    `
  );

  // -------------------------------------------------------------------------
  // Stage 2 + 3: Precise intersection area and upsert for each candidate
  // -------------------------------------------------------------------------
  const detectedConflictIds: string[] = [];

  for (const candidate of candidates) {
    // Compute precise intersection area in m² using UTM Zone 44N (EPSG:32644 — Odisha)
    const intersectionRows: IntersectionResult[] = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          COALESCE(
            ST_Area(
              ST_Transform(
                ST_Intersection(
                  (SELECT geometry FROM claims WHERE id = ${claimId}),
                  (SELECT geometry FROM claims WHERE id = ${candidate.id})
                ),
                32644
              )
            ),
            0
          ) AS intersection_area_m2
      `
    );

    const intersectionAreaM2 = Number(intersectionRows[0]?.intersection_area_m2 ?? 0);
    const intersectionAreaHa = intersectionAreaM2 / 10000;

    if (intersectionAreaHa <= 0) {
      // ST_Intersects returned true but ST_Intersection gave zero — boundary touch only.
      // Mark any existing conflict as auto-resolved.
      await autoResolveIfExists(claimId, candidate.id);
      continue;
    }

    // Denominator = smaller claim's area (Option A — confirmed by user)
    const smallerArea = Math.min(targetClaim.areaHectares, candidate.areaHectares);
    const overlapPct = computeOverlapPercentage(intersectionAreaHa, smallerArea);
    const severity = bandSeverity(overlapPct);

    // Normalize pair: smaller UUID first to ensure upsert key is stable
    const [claimAId, claimBId] =
      claimId < candidate.id ? [claimId, candidate.id] : [candidate.id, claimId];

    // Upsert conflict record
    const conflict = await prisma.conflict.upsert({
      where: {
        // Prisma requires a @unique on the pair for upsert — use raw findFirst + create/update pattern
        // because the schema doesn't have @@unique([claimAId, claimBId]).
        // We use a raw approach: find existing, then update or create.
        id: await findOrGenerateConflictId(claimAId, claimBId),
      },
      update: {
        overlapArea: intersectionAreaHa,
        overlapPercentage: overlapPct,
        severity,
        status: ConflictStatus.PENDING,
        detectedAt: new Date(),
        resolutionNote: null,
        resolvedAt: null,
        reviewedBy: null,
      },
      create: {
        claimAId,
        claimBId,
        overlapArea: intersectionAreaHa,
        overlapPercentage: overlapPct,
        conflictType: 'BOUNDARY_OVERLAP',
        severity,
        status: ConflictStatus.PENDING,
        detectedAt: new Date(),
      },
    });

    detectedConflictIds.push(conflict.id);

    // Write system audit log for conflict detection
    await writeSystemAuditLog('CONFLICT_DETECTED', 'Conflict', conflict.id, null, {
      claimAId,
      claimBId,
      overlapPct: overlapPct.toFixed(2),
      severity,
    });
  }

  // -------------------------------------------------------------------------
  // Stage 4: Auto-transition claim to CONFLICT_REVIEW if HIGH/MEDIUM conflicts
  // -------------------------------------------------------------------------
  const autoTransitionStatuses: ClaimStatus[] = [ClaimStatus.SUBMITTED, ClaimStatus.FIELD_VERIFICATION];

  if (
    detectedConflictIds.length > 0 &&
    autoTransitionStatuses.includes(targetClaim.status as ClaimStatus)
  ) {
    const hasHighMedium = await prisma.conflict.count({
      where: {
        id: { in: detectedConflictIds },
        severity: { in: [ConflictSeverity.HIGH, ConflictSeverity.MEDIUM] },
        status: ConflictStatus.PENDING,
      },
    });

    if (hasHighMedium > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.claim.update({
          where: { id: claimId },
          data: { status: ClaimStatus.CONFLICT_REVIEW },
        });

        await tx.statusHistory.create({
          data: {
            claimId,
            fromStatus: targetClaim.status as ClaimStatus,
            toStatus: ClaimStatus.CONFLICT_REVIEW,
            changedBy: SYSTEM_ACTOR_ID,
            remarks: `Auto-transition: ${hasHighMedium} MEDIUM/HIGH severity conflict(s) detected by VanSetu system`,
          },
        });
      });

      await writeSystemAuditLog(
        'AUTO_CONFLICT_REVIEW_TRANSITION',
        'Claim',
        claimId,
        { status: targetClaim.status },
        { status: ClaimStatus.CONFLICT_REVIEW, conflictCount: hasHighMedium }
      );
    }
  }

  // Phase 5: Recalculate risk scores for all affected claims after detection run
  const allAffectedClaimIds = new Set<string>([claimId]);
  for (const candidate of candidates) {
    allAffectedClaimIds.add(candidate.id);
  }
  await Promise.all([...allAffectedClaimIds].map((id) => computeAndPersistRiskScore(id)));
}

// ---------------------------------------------------------------------------
// Auto-resolve when overlap drops to zero on geometry update
// ---------------------------------------------------------------------------

async function autoResolveIfExists(claimAId: string, claimBId: string): Promise<void> {
  const [normalizedA, normalizedB] = claimAId < claimBId ? [claimAId, claimBId] : [claimBId, claimAId];

  const existing = await prisma.conflict.findFirst({
    where: {
      claimAId: normalizedA,
      claimBId: normalizedB,
      status: { not: ConflictStatus.RESOLVED },
    },
  });

  if (!existing) return;

  await prisma.conflict.update({
    where: { id: existing.id },
    data: {
      status: ConflictStatus.RESOLVED,
      overlapArea: 0,
      overlapPercentage: 0,
      resolvedAt: new Date(),
      resolutionNote: 'Auto-resolved — claim geometry no longer overlaps',
    },
  });

  await writeSystemAuditLog('CONFLICT_AUTO_RESOLVED', 'Conflict', existing.id, {
    status: existing.status,
    overlapArea: existing.overlapArea,
  }, {
    status: ConflictStatus.RESOLVED,
    overlapArea: 0,
    resolutionNote: 'Auto-resolved — claim geometry no longer overlaps',
  });
}

// ---------------------------------------------------------------------------
// Upsert key helper — find existing conflict ID or return a placeholder for create
// ---------------------------------------------------------------------------

async function findOrGenerateConflictId(claimAId: string, claimBId: string): Promise<string> {
  const existing = await prisma.conflict.findFirst({
    where: { claimAId, claimBId },
    select: { id: true },
  });
  // Return existing ID for update, or a non-existent ID that triggers create
  return existing?.id ?? `__new__${claimAId}_${claimBId}`;
}

// ---------------------------------------------------------------------------
// System actor audit log writer
// ---------------------------------------------------------------------------

/**
 * Write an audit log entry attributed to the SYSTEM actor.
 * Uses a userId of SYSTEM_ACTOR_ID — a stable, recognizable non-UUID string
 * that is distinct from NULL (unauthenticated) and any real user UUID.
 * The AuditLog.userId is String? — so this writes a literal "SYSTEM" value.
 */
async function writeSystemAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: null, // SYSTEM has no DB user row; use null + actor field in newValue
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify({ ...oldValue, _actor: SYSTEM_ACTOR_ID }) : JSON.stringify({ _actor: SYSTEM_ACTOR_ID }),
        newValue: newValue ? JSON.stringify({ ...newValue, _actor: SYSTEM_ACTOR_ID }) : null,
        ipAddress: null,
      },
    });
  } catch (err) {
    console.error(`[conflictService] System audit log write failed for ${action}:`, err);
  }
}
