import { Router } from 'express';
import { register, login, refresh, logout, getMe, getAuditLogs } from '../controllers/authController';
import { authenticateJwt, authorizeRoles } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { Role } from '../types/role';

const router = Router();

// Public auth endpoints protected by authRateLimiter
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/refresh', authRateLimiter, refresh);
router.post('/logout', logout);

// Protected endpoint
router.get('/me', authenticateJwt, getMe);
router.get('/audit-logs', authenticateJwt, authorizeRoles(Role.DISTRICT_ADMIN, Role.STATE_ADMIN), getAuditLogs);

// Role test endpoints for verification
router.get('/test/citizen', authenticateJwt, authorizeRoles(Role.CITIZEN, Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN), (req, res) => {
  res.json({ success: true, message: 'Citizen access confirmed', user: (req as any).user });
});

router.get('/test/officer', authenticateJwt, authorizeRoles(Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN), (req, res) => {
  res.json({ success: true, message: 'Field Officer access confirmed', user: (req as any).user });
});

router.get('/test/admin', authenticateJwt, authorizeRoles(Role.DISTRICT_ADMIN, Role.STATE_ADMIN), (req, res) => {
  res.json({ success: true, message: 'District Admin access confirmed', user: (req as any).user });
});

export default router;
