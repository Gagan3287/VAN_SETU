import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../types/role';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  districtId?: string | null;
  stateId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[authenticateJwt] Missing or malformed Auth header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    return next();
  } catch (err: any) {
    console.warn(`[authenticateJwt] JWT Verification failed for ${req.method} ${req.originalUrl}: ${err.name} - ${err.message}`);
    return res.status(401).json({ success: false, error: 'Invalid or expired access token' });
  }
};

export const authorizeRoles = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: User role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    return next();
  };
};

export const enforceDistrictScope = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // STATE_ADMIN has global visibility
  if (req.user.role === Role.STATE_ADMIN) {
    return next();
  }

  // DISTRICT_ADMIN & FIELD_OFFICER must match district parameter or query
  const requestedDistrictId = req.params.districtId || req.query.districtId || req.body.districtId;
  if (req.user.districtId && requestedDistrictId && req.user.districtId !== requestedDistrictId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Access limited to user assigned district',
    });
  }

  return next();
};
