import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  EVIDENCE_UPLOAD_DIR,
  verifyMagicBytes,
  processImageExif,
  computeFileHash,
  generateSignedEvidenceUrl,
  verifySignedEvidenceToken,
} from '../services/evidenceService';
import { logAudit } from '../middleware/audit';
import { Role } from '../types/role';
import { computeAndPersistRiskScore } from '../services/riskService';

/**
 * POST /api/claims/:id/evidence
 * Uploads evidence document with 5MB cap, magic-number MIME sniffing, EXIF processing, and SHA-256 hash.
 */
export const uploadEvidence = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const { documentType } = req.body;

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

    // RBAC check
    if (req.user.role === Role.CITIZEN && claim.claimantId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: Cannot upload evidence to other users claims' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file payload attached' });
    }

    const buffer = req.file.buffer;

    // 1. Magic byte content sniffing
    const magicCheck = verifyMagicBytes(buffer);
    if (!magicCheck.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file content. Header magic bytes do not match allowed formats (PDF, JPEG, PNG).',
      });
    }

    // 2. EXIF metadata extraction & stripping
    const exifProcessed = processImageExif(buffer, req.file.mimetype);

    // 3. Compute SHA-256 integrity hash
    const fileHash = computeFileHash(exifProcessed.cleanBuffer);

    // Check for duplicate evidence hash on same claim
    const existingHash = await prisma.evidence.findFirst({
      where: { claimId: id, fileHash },
    });
    if (existingHash) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate document detected. An identical evidence file has already been uploaded for this claim.',
      });
    }

    // 4. Save file payload to private storage directory
    const fileExt = path.extname(req.file.originalname) || '.bin';
    const filename = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;
    const filePath = path.join(EVIDENCE_UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, exifProcessed.cleanBuffer);

    // 5. Save Evidence record in database
    const evidence = await prisma.evidence.create({
      data: {
        claimId: id,
        type: documentType || req.file.mimetype,
        fileUrl: filename,
        latitude: exifProcessed.latitude || null,
        longitude: exifProcessed.longitude || null,
        capturedBy: req.user.id,
        fileHash,
        mimeTypeVerified: true,
      },
    });

    await logAudit(
      req.user.id,
      'EVIDENCE_UPLOAD',
      'Evidence',
      evidence.id,
      null,
      { claimId: id, fileHash, documentType: evidence.type },
      req.ip || null
    );

    const downloadUrl = generateSignedEvidenceUrl(evidence.id, id, req.user.id, 15);

    // Phase 5: Recalculate risk score — missing evidence factor may have changed
    await computeAndPersistRiskScore(id);

    return res.status(201).json({
      success: true,
      data: {
        ...evidence,
        downloadUrl,
      },
    });
  } catch (error: any) {
    console.error('uploadEvidence error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/claims/:id/evidence/:evidenceId/download
 * Verifies signed HMAC token against EVIDENCE_URL_SECRET & RBAC scope before streaming file.
 */
export const downloadEvidence = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id, evidenceId } = req.params;
    const { token, expires, user } = req.query;

    if (!token || !expires || !user) {
      return res.status(400).json({ success: false, error: 'Missing required signed token parameters' });
    }

    // 1. Verify signed token against EVIDENCE_URL_SECRET
    const isValidToken = verifySignedEvidenceToken(
      evidenceId,
      id,
      user as string,
      token as string,
      expires as string
    );

    if (!isValidToken) {
      return res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired download token' });
    }

    // 2. Verify claim authorization
    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

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

    const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence || evidence.claimId !== id) {
      return res.status(404).json({ success: false, error: 'Evidence record not found' });
    }

    const absoluteFilePath = path.join(EVIDENCE_UPLOAD_DIR, evidence.fileUrl);

    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ success: false, error: 'Evidence file binary not found on disk' });
    }

    return res.sendFile(absoluteFilePath);
  } catch (error) {
    console.error('downloadEvidence error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
