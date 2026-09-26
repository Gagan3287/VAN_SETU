/**
 * riskService.ts
 *
 * Phase 5 — Risk Engine (Blueprint §8)
 *
 * Computes a weighted, explainable 0–100 risk score from five factors:
 *   1. Boundary Conflict    (30%) — active PENDING/UNDER_REVIEW conflict severity (max, not sum)
 *   2. Processing Delay     (25%) — days since submittedAt, banded at SLA thresholds
 *   3. Missing Evidence     (20%) — absent required document categories
 *   4. Correction History   (15%) — NEEDS_CORRECTION StatusHistory transitions
 *   5. Geographic Risk      (10%) — active conflict density in claim's village (Q1 confirmed)
 *
 * All sub-scores are 0–100 before weighting.
 *
 * Severity bands (Q2 confirmed):
 *   LOW 0–39 / MEDIUM 40–64 / HIGH 65–89 / CRITICAL 90–100
 *   Boundary: exactly 40 → MEDIUM, exactly 65 → HIGH, exactly 90 → CRITICAL.
 *
 * NOTE — Evidence categories (Phase 5 prototype simplification):
 *   Three flat categories are checked: LAND_DOCUMENT, GRAM_SABHA_RESOLUTION, PHOTO_EVIDENCE.
 *   The seed data currently uses freeform strings ('Gram Sabha Resolution & Boundary Map',
 *   'Gram Sabha Resolution'). In this phase those are mapped to GRAM_SABHA_RESOLUTION.
 *   Blueprint §14 specifies per-claim-type (IFR/CR/CFR) evidence checklists with richer
 *   quality validation — that is intentionally deferred to Phase 7's Evidence Completeness
 *   Checker. This flat 3-category check is a known, intentional prototype simplification.
 */

import { ConflictSeverity, ConflictStatus, ClaimStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

// ---------------------------------------------------------------------------
// Required evidence categories (Phase 5 prototype — see NOTE above)
// ---------------------------------------------------------------------------

/**
 * The three canonical evidence categories expected for every claim.
 * Aliases map freeform seed strings to canonical category keys.
 *
 * Phase 7 §14: replace with per-claimType (IFR/CR/CFR) requirement tables.
 */
export const REQUIRED_EVIDENCE_CATEGORIES = [
  'LAND_DOCUMENT',
  'GRAM_SABHA_RESOLUTION',
  'PHOTO_EVIDENCE',
] as const;

/**
 * Freeform type strings (from seed and uploads) that count as fulfilling each category.
 * Matching is case-insensitive substring.
 */
export const EVIDENCE_CATEGORY_ALIASES: Record<string, string[]> = {
  LAND_DOCUMENT: ['land_document', 'land document', 'title deed', 'revenue record', 'patta', 'pdf'],
  GRAM_SABHA_RESOLUTION: [
    'gram_sabha_resolution',
    'gram sabha resolution',
    'gram sabha',
    'boundary map',
    'resolution',
  ],
  PHOTO_EVIDENCE: ['photo_evidence', 'photo evidence', 'photograph', 'photo', 'image', 'jpeg', 'png'],
};

// ---------------------------------------------------------------------------
// Sub-score pure functions — all return 0–100, individually testable
// ---------------------------------------------------------------------------

/**
 * Factor 1: Boundary Conflict sub-score.
 * Inputs: array of active conflict severities (PENDING or UNDER_REVIEW only).
 * Strategy: max (not sum) — one HIGH conflict is as bad as ten LOW ones.
 */
export function computeConflictSubScore(
  activeSeverities: ConflictSeverity[]
): { subScore: number; detail: string } {
  if (activeSeverities.length === 0) {
    return { subScore: 0, detail: 'No active conflicts detected' };
  }

  const severityMap: Record<ConflictSeverity, number> = {
    [ConflictSeverity.LOW]: 20,
    [ConflictSeverity.MEDIUM]: 60,
    [ConflictSeverity.HIGH]: 100,
  };

  const maxScore = Math.max(...activeSeverities.map((s) => severityMap[s]));
  const highestSeverity = activeSeverities.find((s) => severityMap[s] === maxScore)!;

  return {
    subScore: maxScore,
    detail: `${activeSeverities.length} active conflict(s) — highest severity: ${highestSeverity}`,
  };
}

/**
 * Factor 2: Processing Delay sub-score.
 * Banded on days since submittedAt. Null submittedAt (DRAFT) → 0.
 */
export function computeDelaySubScore(
  submittedAt: Date | null
): { subScore: number; detail: string } {
  if (!submittedAt) {
    return { subScore: 0, detail: 'Claim not yet submitted (no SLA clock)' };
  }

  const daysSince = Math.floor(
    (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  let subScore: number;
  if (daysSince < 30) subScore = 0;
  else if (daysSince < 60) subScore = 25;
  else if (daysSince < 90) subScore = 50;
  else if (daysSince < 120) subScore = 75;
  else subScore = 100;

  const slaNote = daysSince >= 90 ? ' (exceeds 90-day SLA)' : '';
  return {
    subScore,
    detail: `${daysSince} days since submission${slaNote}`,
  };
}

/**
 * Factor 3: Missing Evidence sub-score.
 * Counts absent canonical categories. Category is "present" if at least one
 * evidence row's type field matches any alias for that category.
 *
 * NOTE: Phase 5 prototype simplification — flat 3-category check.
 * Blueprint §14 per-claimType evidence checklists deferred to Phase 7.
 */
export function computeEvidenceSubScore(
  evidenceTypes: string[]
): { subScore: number; detail: string; missingCategories: string[] } {
  const lowercaseTypes = evidenceTypes.map((t) => t.toLowerCase());

  const missingCategories: string[] = [];

  for (const category of REQUIRED_EVIDENCE_CATEGORIES) {
    const aliases = EVIDENCE_CATEGORY_ALIASES[category];
    const found = lowercaseTypes.some((t) =>
      aliases.some((alias) => t.includes(alias))
    );
    if (!found) {
      missingCategories.push(category);
    }
  }

  const missingCount = missingCategories.length;
  const subScore = Math.round((missingCount / REQUIRED_EVIDENCE_CATEGORIES.length) * 100);

  const detail =
    missingCount === 0
      ? 'All required document categories present'
      : `${missingCount} of ${REQUIRED_EVIDENCE_CATEGORIES.length} required categories absent: ${missingCategories.join(', ')}`;

  return { subScore, detail, missingCategories };
}

/**
 * Factor 4: Correction History sub-score.
 * Banded on count of NEEDS_CORRECTION StatusHistory transitions.
 */
export function computeCorrectionSubScore(
  correctionCount: number
): { subScore: number; detail: string } {
  let subScore: number;
  if (correctionCount === 0) subScore = 0;
  else if (correctionCount === 1) subScore = 40;
  else if (correctionCount === 2) subScore = 75;
  else subScore = 100;

  const detail =
    correctionCount === 0
      ? 'No corrections requested'
      : `${correctionCount} NEEDS_CORRECTION transition(s) in status history`;

  return { subScore, detail };
}

/**
 * Factor 5: Geographic Risk sub-score.
 * Village-level conflict density: active PENDING/UNDER_REVIEW conflicts in same village.
 * Cap at 5 conflicts → sub-score 100.
 * Pure Prisma — no PostGIS. (Q1 confirmed definition.)
 */
export function computeGeoRiskSubScore(
  activeConflictsInVillage: number
): { subScore: number; detail: string } {
  const subScore = Math.min(Math.round((activeConflictsInVillage / 5) * 100), 100);
  const detail =
    activeConflictsInVillage === 0
      ? 'No active conflicts in this village'
      : `${activeConflictsInVillage} active conflict(s) in same village`;

  return { subScore, detail };
}

// ---------------------------------------------------------------------------
// Weighted scorer — produces final 0–100 score + level
// ---------------------------------------------------------------------------

export interface RiskFactorInputs {
  activeSeverities: ConflictSeverity[];
  submittedAt: Date | null;
  evidenceTypes: string[];
  correctionCount: number;
  activeConflictsInVillage: number;
}

export interface RiskBreakdown {
  boundaryConflict: { weight: number; subScore: number; contribution: number; detail: string };
  processingDelay: { weight: number; subScore: number; contribution: number; detail: string };
  missingEvidence: {
    weight: number;
    subScore: number;
    contribution: number;
    detail: string;
    missingCategories: string[];
  };
  correctionHistory: { weight: number; subScore: number; contribution: number; detail: string };
  geographicRisk: { weight: number; subScore: number; contribution: number; detail: string };
}

export interface RiskResult {
  riskScore: number;
  riskLevel: string;
  breakdown: RiskBreakdown;
}

const WEIGHTS = {
  boundaryConflict: 0.30,
  processingDelay: 0.25,
  missingEvidence: 0.20,
  correctionHistory: 0.15,
  geographicRisk: 0.10,
} as const;

/**
 * Compute weighted risk score from pre-fetched inputs.
 * All sub-scores 0–100; weighted contributions sum to 0–100.
 */
export function computeRiskScore(inputs: RiskFactorInputs): RiskResult {
  const conflict = computeConflictSubScore(inputs.activeSeverities);
  const delay = computeDelaySubScore(inputs.submittedAt);
  const evidence = computeEvidenceSubScore(inputs.evidenceTypes);
  const correction = computeCorrectionSubScore(inputs.correctionCount);
  const geo = computeGeoRiskSubScore(inputs.activeConflictsInVillage);

  const total =
    conflict.subScore * WEIGHTS.boundaryConflict +
    delay.subScore * WEIGHTS.processingDelay +
    evidence.subScore * WEIGHTS.missingEvidence +
    correction.subScore * WEIGHTS.correctionHistory +
    geo.subScore * WEIGHTS.geographicRisk;

  const riskScore = Math.round(total);
  const riskLevel = bandRiskLevel(riskScore);

  return {
    riskScore,
    riskLevel,
    breakdown: {
      boundaryConflict: {
        weight: WEIGHTS.boundaryConflict,
        subScore: conflict.subScore,
        contribution: Math.round(conflict.subScore * WEIGHTS.boundaryConflict * 100) / 100,
        detail: conflict.detail,
      },
      processingDelay: {
        weight: WEIGHTS.processingDelay,
        subScore: delay.subScore,
        contribution: Math.round(delay.subScore * WEIGHTS.processingDelay * 100) / 100,
        detail: delay.detail,
      },
      missingEvidence: {
        weight: WEIGHTS.missingEvidence,
        subScore: evidence.subScore,
        contribution: Math.round(evidence.subScore * WEIGHTS.missingEvidence * 100) / 100,
        detail: evidence.detail,
        missingCategories: evidence.missingCategories,
      },
      correctionHistory: {
        weight: WEIGHTS.correctionHistory,
        subScore: correction.subScore,
        contribution: Math.round(correction.subScore * WEIGHTS.correctionHistory * 100) / 100,
        detail: correction.detail,
      },
      geographicRisk: {
        weight: WEIGHTS.geographicRisk,
        subScore: geo.subScore,
        contribution: Math.round(geo.subScore * WEIGHTS.geographicRisk * 100) / 100,
        detail: geo.detail,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Severity banding (Q2 confirmed)
// LOW 0–39 / MEDIUM 40–64 / HIGH 65–89 / CRITICAL 90–100
// Boundary: exactly 40 → MEDIUM, exactly 65 → HIGH, exactly 90 → CRITICAL
// Blueprint example: 87 → HIGH ✓
// ---------------------------------------------------------------------------

export function bandRiskLevel(score: number): string {
  if (score < 40) return 'LOW';
  if (score < 65) return 'MEDIUM';
  if (score < 90) return 'HIGH';
  return 'CRITICAL';
}

// ---------------------------------------------------------------------------
// DB input gatherer — fetches all five factor inputs for a claim
// ---------------------------------------------------------------------------

async function gatherRiskInputs(claimId: string): Promise<RiskFactorInputs | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { id: true, submittedAt: true, villageId: true },
  });
  if (!claim) return null;

  // Factor 1: active conflict severities (PENDING or UNDER_REVIEW, not RESOLVED/REJECTED)
  const activeConflicts = await prisma.conflict.findMany({
    where: {
      OR: [{ claimAId: claimId }, { claimBId: claimId }],
      status: { in: [ConflictStatus.PENDING, ConflictStatus.UNDER_REVIEW] },
    },
    select: { severity: true },
  });
  const activeSeverities = activeConflicts.map((c) => c.severity);

  // Factor 3: evidence types present for this claim
  const evidenceRows = await prisma.evidence.findMany({
    where: { claimId },
    select: { type: true },
  });
  const evidenceTypes = evidenceRows.map((e) => e.type);

  // Factor 4: NEEDS_CORRECTION status history count
  const correctionCount = await prisma.statusHistory.count({
    where: { claimId, toStatus: ClaimStatus.NEEDS_CORRECTION },
  });

  // Factor 5: active conflicts in same village (conflict density)
  const activeConflictsInVillage = await prisma.conflict.count({
    where: {
      status: { in: [ConflictStatus.PENDING, ConflictStatus.UNDER_REVIEW] },
      OR: [
        { claimA: { villageId: claim.villageId } },
        { claimB: { villageId: claim.villageId } },
      ],
    },
  });

  return {
    activeSeverities,
    submittedAt: claim.submittedAt,
    evidenceTypes,
    correctionCount,
    activeConflictsInVillage,
  };
}

// ---------------------------------------------------------------------------
// computeAndPersistRiskScore — the main event-driven trigger function
// Called by: workflowService, conflictService, evidenceController, conflictController
// ---------------------------------------------------------------------------

/**
 * Recomputes risk score for a claim from live DB data and persists to Claim row.
 * Only writes if score or level changed — prevents spurious updated_at churn.
 * Safe to call from any trigger context; logs errors but does not throw.
 */
export async function computeAndPersistRiskScore(claimId: string): Promise<void> {
  try {
    const inputs = await gatherRiskInputs(claimId);
    if (!inputs) {
      console.warn(`[riskService] computeAndPersistRiskScore: claim ${claimId} not found — skipping`);
      return;
    }

    const result = computeRiskScore(inputs);

    const current = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { riskScore: true, riskLevel: true },
    });

    if (current && current.riskScore === result.riskScore && current.riskLevel === result.riskLevel) {
      return; // No change — skip write
    }

    await prisma.claim.update({
      where: { id: claimId },
      data: { riskScore: result.riskScore, riskLevel: result.riskLevel },
    });
  } catch (err) {
    // Fail-safe: never throw from a trigger — risk recalculation must not break primary operations
    console.error(`[riskService] computeAndPersistRiskScore failed for claim ${claimId}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Live score getter (for GET /api/risk/claim/:id — returns fresh breakdown)
// ---------------------------------------------------------------------------

export interface LiveRiskScore extends RiskResult {
  claimId: string;
  claimNumber: string;
  calculatedAt: string;
}

export async function getLiveRiskScore(claimId: string): Promise<LiveRiskScore | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { id: true, claimNumber: true },
  });
  if (!claim) return null;

  const inputs = await gatherRiskInputs(claimId);
  if (!inputs) return null;

  const result = computeRiskScore(inputs);

  return {
    claimId: claim.id,
    claimNumber: claim.claimNumber,
    calculatedAt: new Date().toISOString(),
    ...result,
  };
}
