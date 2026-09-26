import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const isTest = process.env.NODE_ENV === 'test';

export const authRateLimiter = isTest
  ? (req: Request, res: Response, next: NextFunction) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 auth requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      },
    });

export const apiRateLimiter = isTest
  ? (req: Request, res: Response, next: NextFunction) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many requests. Please try again later.',
      },
    });
