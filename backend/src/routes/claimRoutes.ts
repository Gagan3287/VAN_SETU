import { Router } from 'express';
import {
  getSpatialClaims,
  getClaims,
  getClaimById,
  createClaim,
  updateClaim,
  updateClaimStatus,
  deleteClaim,
} from '../controllers/claimController';
import { uploadEvidence, downloadEvidence } from '../controllers/evidenceController';
import { authenticateJwt } from '../middleware/auth';
import { uploadMiddleware } from '../services/evidenceService';

const router = Router();

// Apply JWT authentication to all claim routes
router.use(authenticateJwt);

// Spatial GeoJSON route
router.get('/spatial', getSpatialClaims);

// Scoped Claims List & Detail routes
router.get('/', getClaims);
router.get('/:id', getClaimById);

// Claim CRUD & Status Transition routes
router.post('/', createClaim);
router.put('/:id', updateClaim);
router.post('/:id/status', updateClaimStatus);
router.delete('/:id', deleteClaim);

// Evidence upload & signed download routes
router.post('/:id/evidence', uploadMiddleware.single('file'), uploadEvidence);
router.get('/:id/evidence/:evidenceId/download', downloadEvidence);

export default router;
