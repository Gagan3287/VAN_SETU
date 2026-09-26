import { Router } from 'express';
import { getDistricts, getTehsils, getVillages } from '../controllers/geoController';

const router = Router();

// Public geometry boundary endpoints (no auth required for base atlas vector layers)
router.get('/districts', getDistricts);
router.get('/tehsils', getTehsils);
router.get('/villages', getVillages);

export default router;
