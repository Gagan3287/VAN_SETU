import { Router } from 'express';
import { listConflicts, getConflictById, resolveConflict } from '../controllers/conflictController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// All conflict routes require authentication
router.use(authenticateJwt);

// GET /api/conflicts — list (role-scoped: no citizens, district-filtered for officers/admins)
router.get('/', listConflicts);

// GET /api/conflicts/:id — single conflict detail
router.get('/:id', getConflictById);

// PUT /api/conflicts/:id/resolve — resolve/review (District Admin + State Admin only)
router.put('/:id/resolve', resolveConflict);

export default router;
