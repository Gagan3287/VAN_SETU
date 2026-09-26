/**
 * riskController.ts
 *
 * Phase 5 — Risk Engine REST API
 *
 * GET /api/risk/claim/:id  — live risk score + per-factor breakdown for one claim
 * GET /api/risk/queue      — priority queue of claims sorted by riskScore DESC
 *
 * Role scoping:
 *   CITIZEN       → own claims only on /claim/:id; 403 on /queue
 *   FIELD_OFFICER → district-scoped (read-only)
 *   DISTRICT_ADMIN → district-scoped
 *   STATE_ADMIN   → all districts (optional ?districtId= filter)
 */

import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { Role } from '../types/role';
import { getLiveRiskScore, computeAndPersistRiskScore } from '../services/riskService';

// ---------------------------------------------------------------------------
// GET /api/risk/claim/:id
// ---------------------------------------------------------------------------

export const getRiskScore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { id } = req.params;
    const { role, districtId } = req.user;

    // Fetch claim for scoping check
    const claim = await prisma.claim.findUnique({
      where: { id },
      select: { id: true, claimantId: true, districtId: true, riskScore: true, riskLevel: true },
    });

    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

    // RBAC scoping
    if (role === Role.CITIZEN && claim.claimantId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access limited to own claims' });
    }
    if (
      (role === Role.FIELD_OFFICER || role === Role.DISTRICT_ADMIN) &&
      districtId &&
      claim.districtId !== districtId
    ) {
      return res.status(403).json({ success: false, error: 'Forbidden: Claim is outside assigned district' });
    }

    // Compute live breakdown and optionally persist if score changed
    const liveScore = await getLiveRiskScore(id);
    if (!liveScore) return res.status(404).json({ success: false, error: 'Could not compute risk score' });

    // Persist if score differs from stored (on-demand refresh)
    if (liveScore.riskScore !== claim.riskScore || liveScore.riskLevel !== claim.riskLevel) {
      await computeAndPersistRiskScore(id);
    }

    return res.json({ success: true, data: liveScore });
  } catch (error) {
    console.error('getRiskScore error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/risk/queue
// ---------------------------------------------------------------------------

export const getRiskQueue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { role, districtId } = req.user;

    // Citizens have no access to the risk priority queue
    if (role === Role.CITIZEN) {
      return res.status(403).json({ success: false, error: 'Forbidden: Citizens do not have access to the risk queue' });
    }

    const {
      districtId: queryDistrictId,
      riskLevel,
      status,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // District scoping — matches getClaims and listConflicts pattern exactly
    if (role === Role.FIELD_OFFICER || role === Role.DISTRICT_ADMIN) {
      if (!districtId) {
        return res.status(403).json({ success: false, error: 'No district assignment found for user' });
      }
      where.districtId = districtId;
    }
    if (role === Role.STATE_ADMIN && queryDistrictId) {
      where.districtId = queryDistrictId as string;
    }

    // Optional filters
    if (riskLevel) where.riskLevel = riskLevel as string;
    if (status) where.status = status as string;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ riskScore: 'desc' }, { submittedAt: 'asc' }],
        select: {
          id: true,
          claimNumber: true,
          claimType: true,
          status: true,
          riskScore: true,
          riskLevel: true,
          areaHectares: true,
          districtId: true,
          tehsilId: true,
          villageId: true,
          submittedAt: true,
          updatedAt: true,
          claimant: { select: { id: true, name: true } }, // PII-minimized: no phone/email
        },
      }),
      prisma.claim.count({ where }),
    ]);

    return res.json({
      success: true,
      data: claims,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getRiskQueue error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
