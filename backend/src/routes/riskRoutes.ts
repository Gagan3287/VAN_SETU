import { Router } from 'express';
import { getRiskScore, getRiskQueue } from '../controllers/riskController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// All risk routes require authentication
router.use(authenticateJwt);

// GET /api/risk/claim/:id — live risk score + factor breakdown for a single claim
router.get('/claim/:id', getRiskScore);

// GET /api/risk/queue — priority queue sorted by riskScore DESC (no CITIZEN access)
router.get('/queue', getRiskQueue);

export default router;
