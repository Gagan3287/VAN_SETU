import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../db/prisma';

/**
 * Recursively masks sensitive PII fields (email, phone, name, password) in objects logged to audit_logs
 */
export function maskPiiInObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(maskPiiInObject);
  }

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (['password', 'passwordhash', 'token', 'secret'].includes(lowerKey)) {
      masked[key] = '[REDACTED]';
    } else if (lowerKey.includes('phone') && typeof value === 'string') {
      masked[key] = value.replace(/(\d{2})\d+(\d{4})/, '$1****$2');
    } else if (lowerKey.includes('email') && typeof value === 'string' && value.includes('@')) {
      const parts = value.split('@');
      masked[key] = `${parts[0][0]}***@${parts[1]}`;
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskPiiInObject(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

export const logAudit = async (
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValue: any = null,
  newValue: any = null,
  ipAddress: string | null = null
) => {
  try {
    const maskedOld = oldValue ? maskPiiInObject(oldValue) : null;
    const maskedNew = newValue ? maskPiiInObject(newValue) : null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: maskedOld ? JSON.stringify(maskedOld) : null,
        newValue: maskedNew ? JSON.stringify(maskedNew) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Audit log write error:', error);
  }
};

export const auditMiddleware = (action: string, entityType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const originalSend = res.send;

    res.send = function (body?: any): Response {
      res.send = originalSend;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAudit(
          req.user?.id || null,
          action,
          entityType,
          req.params.id || null,
          null,
          req.body,
          ipAddress
        );
      }
      return originalSend.call(this, body);
    };

    next();
  };
};
