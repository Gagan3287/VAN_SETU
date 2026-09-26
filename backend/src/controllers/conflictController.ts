/**
 * conflictController.ts
 *
 * Phase 4 — Conflict Engine REST API
 *
 * GET  /api/conflicts             — list conflicts (role-scoped)
 * GET  /api/conflicts/:id        — single conflict detail
 * PUT  /api/conflicts/:id/resolve — resolve/review a conflict (District/State Admin only)
 *
 * Role scoping:
 *   CITIZEN       → 403 (no conflict queue access)
 *   FIELD_OFFICER → read-only, district-scoped
 *   DISTRICT_ADMIN → read + resolve, district-scoped
 *   STATE_ADMIN   → read + resolve, all districts (incl. cross-district conflicts)
 */

import { Response } from 'express';
import { ConflictStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { Role } from '../types/role';
import { logAudit } from '../middleware/audit';
import { resolveConflictSchema } from '../validators/conflictSchemas';
import { computeAndPersistRiskScore } from '../services/riskService';

// ---------------------------------------------------------------------------
// GET /api/conflicts
// ---------------------------------------------------------------------------
export const listConflicts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { role, districtId } = req.user;

    // Citizens have no access to the conflict queue
    if (role === Role.CITIZEN) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Citizens do not have access to the conflict queue',
      });
    }

    const { status, severity, claimId, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build district-aware where clause
    // A conflict spans two claims. For district scoping, EITHER claim must be in the user's district.
    // Cross-district conflicts (claims in different districts) are visible ONLY to STATE_ADMIN.
    const where: any = {};

    if (status) where.status = status as string;
    if (severity) where.severity = severity as string;

    // Filter by specific claimId if requested
    if (claimId) {
      where.OR = [{ claimAId: claimId as string }, { claimBId: claimId as string }];
    }

    if (role === Role.FIELD_OFFICER || role === Role.DISTRICT_ADMIN) {
      if (!districtId) {
        return res.status(403).json({ success: false, error: 'No district assignment found for user' });
      }
      // Only include conflicts where BOTH claims are in this district
      // (cross-district conflicts are STATE_ADMIN only — per approved plan)
      where.claimA = { districtId };
      where.claimB = { districtId };
    }
    // STATE_ADMIN: no district filter — sees all conflicts including cross-district

    const [conflicts, total] = await Promise.all([
      prisma.conflict.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ severity: 'desc' }, { detectedAt: 'desc' }],
        include: {
          claimA: {
            select: {
              id: true,
              claimNumber: true,
              claimType: true,
              status: true,
              areaHectares: true,
              districtId: true,
              tehsilId: true,
              villageId: true,
            },
          },
          claimB: {
            select: {
              id: true,
              claimNumber: true,
              claimType: true,
              status: true,
              areaHectares: true,
              districtId: true,
              tehsilId: true,
              villageId: true,
            },
          },
        },
      }),
      prisma.conflict.count({ where }),
    ]);

    return res.json({
      success: true,
      data: conflicts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('listConflicts error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/conflicts/:id
// ---------------------------------------------------------------------------
export const getConflictById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { role, districtId } = req.user;

    if (role === Role.CITIZEN) {
      return res.status(403).json({ success: false, error: 'Forbidden: Citizens do not have access to conflict details' });
    }

    const conflict = await prisma.conflict.findUnique({
      where: { id: req.params.id },
      include: {
        claimA: {
          select: {
            id: true,
            claimNumber: true,
            claimType: true,
            status: true,
            areaHectares: true,
            districtId: true,
            tehsilId: true,
            villageId: true,
            geometryJson: true,
            // PII-free: no claimant phone/email
            claimant: { select: { id: true, name: true, role: true } },
          },
        },
        claimB: {
          select: {
            id: true,
            claimNumber: true,
            claimType: true,
            status: true,
            areaHectares: true,
            districtId: true,
            tehsilId: true,
            villageId: true,
            geometryJson: true,
            claimant: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!conflict) {
      return res.status(404).json({ success: false, error: 'Conflict not found' });
    }

    // District scope check: Officer/DistrictAdmin must share a district with at least one claim
    if (role === Role.FIELD_OFFICER || role === Role.DISTRICT_ADMIN) {
      const claimADistrict = conflict.claimA.districtId;
      const claimBDistrict = conflict.claimB.districtId;
      if (districtId !== claimADistrict && districtId !== claimBDistrict) {
        return res.status(403).json({ success: false, error: 'Forbidden: Conflict is outside your assigned district' });
      }
      // Cross-district conflict where only one claim is in their district: they can view but not resolve
    }

    return res.json({ success: true, data: conflict });
  } catch (error) {
    console.error('getConflictById error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/conflicts/:id/resolve
// ---------------------------------------------------------------------------
export const resolveConflict = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { role, districtId, id: userId } = req.user;

    // Only District Admin and State Admin can resolve conflicts
    if (role === Role.CITIZEN || role === Role.FIELD_OFFICER) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only District Admin or State Admin can resolve conflicts',
      });
    }

    const parseResult = resolveConflictSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { status: newStatus, resolutionNote } = parseResult.data;

    const conflict = await prisma.conflict.findUnique({
      where: { id: req.params.id },
      include: {
        claimA: { select: { districtId: true } },
        claimB: { select: { districtId: true } },
      },
    });

    if (!conflict) {
      return res.status(404).json({ success: false, error: 'Conflict not found' });
    }

    // District Admin: can only resolve conflicts where BOTH claims are in their district.
    // Cross-district conflicts are STATE_ADMIN only.
    if (role === Role.DISTRICT_ADMIN) {
      if (conflict.claimA.districtId !== districtId || conflict.claimB.districtId !== districtId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-district conflicts can only be resolved by State Admin',
        });
      }
    }

    const oldConflict = { status: conflict.status, resolutionNote: conflict.resolutionNote };

    const updated = await prisma.conflict.update({
      where: { id: conflict.id },
      data: {
        status: newStatus as ConflictStatus,
        resolutionNote,
        reviewedBy: userId,
        resolvedAt: newStatus === 'RESOLVED' ? new Date() : conflict.resolvedAt,
      },
    });

    await logAudit(
      userId,
      'CONFLICT_RESOLUTION_UPDATE',
      'Conflict',
      conflict.id,
      oldConflict,
      { status: newStatus, resolutionNote, reviewedBy: userId },
      req.ip || null
    );

    // Phase 5: Recalculate risk scores for both claims affected by conflict status change
    await Promise.all([
      computeAndPersistRiskScore(conflict.claimAId),
      computeAndPersistRiskScore(conflict.claimBId),
    ]);

    return res.json({
      success: true,
      message: `Conflict status updated to ${newStatus}`,
      data: updated,
    });
  } catch (error) {
    console.error('resolveConflict error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
