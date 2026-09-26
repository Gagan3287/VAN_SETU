import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { claimsToFeatureCollection } from '../services/spatialService';
import { Role } from '../types/role';
import { createClaimSchema, updateClaimSchema, statusTransitionSchema } from '../validators/claimSchemas';
import { transitionClaimStatus } from '../services/workflowService';
import { generateSignedEvidenceUrl } from '../services/evidenceService';
import { logAudit } from '../middleware/audit';
import { ClaimStatus } from '@prisma/client';
import { validatePolygonGeometry } from '../services/geometryService';
import { detectAndUpsertConflicts } from '../services/conflictService';

/**
 * GET /api/claims/spatial
 * Role-scoped bulk spatial endpoint.
 * Returns PII-free GeoJSON FeatureCollection of claim polygons.
 */
export const getSpatialClaims = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { districtId, tehsilId, villageId, claimType, status, riskLevel } = req.query;

    const where: any = {};

    // Server-side RBAC query filtering
    if (req.user.role === Role.CITIZEN) {
      where.claimantId = req.user.id;
    } else if (req.user.role === Role.DISTRICT_ADMIN || req.user.role === Role.FIELD_OFFICER) {
      if (req.user.districtId) {
        where.districtId = req.user.districtId;
      }
    }

    if (districtId && req.user.role === Role.STATE_ADMIN) {
      where.districtId = districtId as string;
    }
    if (tehsilId) where.tehsilId = tehsilId as string;
    if (villageId) where.villageId = villageId as string;
    if (claimType) where.claimType = claimType as string;
    if (status) where.status = status as string;
    if (riskLevel) where.riskLevel = riskLevel as string;

    const claims = await prisma.claim.findMany({
      where,
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
        geometryJson: true,
      },
    });

    const featureCollection = claimsToFeatureCollection(claims as any[]);

    return res.json({
      success: true,
      count: featureCollection.features.length,
      data: featureCollection,
    });
  } catch (error) {
    console.error('getSpatialClaims error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/claims
 * Server-side query scoped list endpoint with PII minimization.
 */
export const getClaims = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { districtId, tehsilId, villageId, claimType, status, riskLevel, page = '1', limit = '50' } = req.query;

    const where: any = {};

    // 1. Explicit Server-Side Database Query Scoping
    if (req.user.role === Role.CITIZEN) {
      where.claimantId = req.user.id;
    } else if (req.user.role === Role.FIELD_OFFICER || req.user.role === Role.DISTRICT_ADMIN) {
      if (req.user.districtId) {
        where.districtId = req.user.districtId;
      }
    }

    if (districtId && req.user.role === Role.STATE_ADMIN) {
      where.districtId = districtId as string;
    }
    if (tehsilId) where.tehsilId = tehsilId as string;
    if (villageId) where.villageId = villageId as string;
    if (claimType) where.claimType = claimType as string;
    if (status) where.status = status as string;
    if (riskLevel) where.riskLevel = riskLevel as string;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          claimNumber: true,
          claimType: true,
          status: true,
          areaHectares: true,
          districtId: true,
          tehsilId: true,
          villageId: true,
          riskScore: true,
          riskLevel: true,
          submittedAt: true,
          createdAt: true,
          updatedAt: true,
          // PII Minimization in Bulk View: Only return name & id, mask phone & email
          claimant: {
            select: {
              id: true,
              name: true,
            },
          },
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
    console.error('getClaims error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/claims/:id
 * Full claim detail including timeline, conflicts, and signed evidence URLs.
 */
export const getClaimById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        evidence: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        conflictsA: {
          select: {
            id: true,
            claimBId: true,
            overlapArea: true,
            overlapPercentage: true,
            severity: true,
            status: true,
          },
        },
        conflictsB: {
          select: {
            id: true,
            claimAId: true,
            overlapArea: true,
            overlapPercentage: true,
            severity: true,
            status: true,
          },
        },
      },
    });

    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

    // RBAC Authorization check
    if (req.user.role === Role.CITIZEN && claim.claimantId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access limited to own claims' });
    }
    if (
      (req.user.role === Role.FIELD_OFFICER || req.user.role === Role.DISTRICT_ADMIN) &&
      req.user.districtId &&
      claim.districtId !== req.user.districtId
    ) {
      return res.status(403).json({ success: false, error: 'Forbidden: Claim is outside assigned district' });
    }

    // Attach signed download URLs for each evidence document
    const evidenceWithSignedUrls = claim.evidence.map((ev) => ({
      ...ev,
      downloadUrl: generateSignedEvidenceUrl(ev.id, claim.id, req.user!.id, 15),
    }));

    return res.json({
      success: true,
      data: {
        ...claim,
        evidence: evidenceWithSignedUrls,
      },
    });
  } catch (error) {
    console.error('getClaimById error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/claims
 * Create new claim with Zod payload & GeoJSON polygon validation.
 */
export const createClaim = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const parseResult = createClaimSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const payload = parseResult.data;

    // Geometry validation — must pass before any DB write
    const geometryObj = payload.geometry || (payload.geometryJson ? JSON.parse(payload.geometryJson) : null);
    if (geometryObj) {
      const geoCheck = validatePolygonGeometry(geometryObj);
      if (!geoCheck.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: { geometry: [geoCheck.reason] },
        });
      }
    }

    // Scope check: Citizen can only create for self
    const claimantId = req.user.role === Role.CITIZEN ? req.user.id : (req.body.claimantId || req.user.id);

    // Generate unique claim number
    const distCode = payload.districtId.includes('KANDHAMAL') ? 'KAN' : payload.districtId.includes('MAYURBHANJ') ? 'MAY' : 'GEN';
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const claimNumber = `OD-${distCode}-${payload.claimType}-${randomSeq}`;

    const geometryJson = geometryObj ? JSON.stringify(geometryObj) : null;

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        claimType: payload.claimType,
        claimantId,
        districtId: payload.districtId,
        tehsilId: payload.tehsilId,
        villageId: payload.villageId,
        areaHectares: payload.areaHectares,
        status: ClaimStatus.DRAFT,
        geometryJson,
      },
    });

    // Create initial StatusHistory entry
    await prisma.statusHistory.create({
      data: {
        claimId: claim.id,
        fromStatus: ClaimStatus.DRAFT,
        toStatus: ClaimStatus.DRAFT,
        changedBy: req.user.id,
        remarks: 'Claim draft created',
      },
    });

    await logAudit(
      req.user.id,
      'CREATE_CLAIM',
      'Claim',
      claim.id,
      null,
      { claimNumber: claim.claimNumber, claimType: claim.claimType, districtId: claim.districtId },
      req.ip || null
    );

    // Trigger conflict detection asynchronously (non-blocking — fire and forget)
    // Errors here do not fail the create response.
    if (claim.geometryJson) {
      detectAndUpsertConflicts(claim.id).catch((err) =>
        console.error(`[conflictService] Detection failed for claim ${claim.id}:`, err)
      );
    }

    return res.status(201).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    console.error('createClaim error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * PUT /api/claims/:id
 * Update existing claim in DRAFT or NEEDS_CORRECTION state.
 */
export const updateClaim = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const parseResult = updateClaimSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

    // RBAC Check
    if (req.user.role === Role.CITIZEN && claim.claimantId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: Cannot edit other users claims' });
    }

    // Workflow state check: can only update if DRAFT or NEEDS_CORRECTION
    if (claim.status !== ClaimStatus.DRAFT && claim.status !== ClaimStatus.NEEDS_CORRECTION) {
      return res.status(400).json({
        success: false,
        error: `Cannot update claim in ${claim.status} status. Only DRAFT or NEEDS_CORRECTION claims can be updated.`,
      });
    }

    const updateData: any = { ...parseResult.data, version: { increment: 1 } };
    if (parseResult.data.geometry || parseResult.data.geometryJson) {
      const geometryObj = parseResult.data.geometry || JSON.parse(parseResult.data.geometryJson!);

      // Geometry validation on update — same rules as create
      const geoCheck = validatePolygonGeometry(geometryObj);
      if (!geoCheck.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: { geometry: [geoCheck.reason] },
        });
      }

      updateData.geometryJson = JSON.stringify(geometryObj);
      delete updateData.geometry;
    }

    const updated = await prisma.claim.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      req.user.id,
      'UPDATE_CLAIM',
      'Claim',
      claim.id,
      { status: claim.status, areaHectares: claim.areaHectares },
      { status: updated.status, areaHectares: updated.areaHectares },
      req.ip || null
    );

    // Re-run conflict detection if geometry was updated
    if (updated.geometryJson && (parseResult.data.geometry || parseResult.data.geometryJson)) {
      detectAndUpsertConflicts(updated.id).catch((err) =>
        console.error(`[conflictService] Detection failed for claim ${updated.id}:`, err)
      );
    }

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('updateClaim error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/claims/:id/status
 * Validated status transition.
 */
export const updateClaimStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const parseResult = statusTransitionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { targetStatus, remarks } = parseResult.data;

    const result = await transitionClaimStatus(id, targetStatus, req.user.id, req.user.role, remarks);

    return res.json({
      success: true,
      message: `Claim status successfully updated to ${targetStatus}`,
      data: result.claim,
      statusHistory: result.statusHistory,
    });
  } catch (error: any) {
    console.error('updateClaimStatus error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to transition claim status',
    });
  }
};

/**
 * DELETE /api/claims/:id
 * Delete claim in DRAFT status.
 */
export const deleteClaim = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

    if (req.user.role === Role.CITIZEN && claim.claimantId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: Cannot delete other users claims' });
    }

    if (claim.status !== ClaimStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete claim in ${claim.status} status. Only DRAFT claims can be deleted.`,
      });
    }

    await prisma.claim.delete({ where: { id } });

    await logAudit(
      req.user.id,
      'DELETE_CLAIM',
      'Claim',
      id,
      { claimNumber: claim.claimNumber, claimantId: claim.claimantId },
      null,
      req.ip || null
    );

    return res.json({
      success: true,
      message: 'Claim successfully deleted',
    });
  } catch (error) {
    console.error('deleteClaim error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
