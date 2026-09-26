import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { AuthenticatedRequest, AuthUserPayload } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['CITIZEN', 'FIELD_OFFICER', 'DISTRICT_ADMIN', 'STATE_ADMIN']).default('CITIZEN'),
  districtId: z.string().optional(),
  stateId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateTokens = async (user: {
  id: string;
  email: string;
  role: any;
  districtId?: string | null;
  stateId?: string | null;
}) => {
  const payload: AuthUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    districtId: user.districtId,
    stateId: user.stateId,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(
    { id: user.id, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store refresh token in database for server-side revocation
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      revoked: false,
    },
  });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.flatten() });
    }

    const { name, email, password, phone, role, districtId, stateId } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: role as any,
        districtId,
        stateId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        districtId: true,
        stateId: true,
        createdAt: true,
      },
    });

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    await logAudit(newUser.id, 'USER_REGISTER', 'User', newUser.id, null, { role: newUser.role }, ipAddress);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.flatten() });
    }

    const { email, password } = parseResult.data;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Check brute-force account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      return res.status(429).json({
        success: false,
        error: `Account is locked due to repeated failed login attempts. Try again in ${minutesRemaining} minutes.`,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil,
        },
      });

      await logAudit(user.id, 'LOGIN_FAILED', 'User', user.id, null, { failedAttempts }, ipAddress);

      if (failedAttempts >= 5) {
        return res.status(429).json({
          success: false,
          error: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
        });
      }

      return res.status(401).json({
        success: false,
        error: `Invalid email or password. ${5 - failedAttempts} attempts remaining before account lockout.`,
      });
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const tokens = await generateTokens(user);
    await logAudit(user.id, 'USER_LOGIN', 'User', user.id, null, null, ipAddress);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          districtId: user.districtId,
          stateId: user.stateId,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const parseResult = refreshSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.flatten() });
    }

    const { refreshToken } = parseResult.data;

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ success: false, error: 'Refresh token is revoked or expired' });
    }

    // Server-side Revocation of used refresh token (Token Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const newTokens = await generateTokens(user);

    return res.json({
      success: true,
      data: newTokens,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }

    const userId = (req as AuthenticatedRequest).user?.id || null;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    if (userId) {
      await logAudit(userId, 'USER_LOGOUT', 'User', userId, null, null, ipAddress);
    }

    return res.json({
      success: true,
      message: 'Logged out successfully and server-side refresh token revoked',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        districtId: true,
        stateId: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error('GetAuditLogs error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};


