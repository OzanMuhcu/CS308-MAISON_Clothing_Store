/**
 * AUTH MIDDLEWARE — Sprint 1
 *
 * Task 6: Authentication Foundation (teammate)
 *
 * Provides:
 *   - JwtPayload type definition
 *   - generateTokens() — creates access + refresh JWTs
 *   - authenticate() — Express middleware that verifies the access token
 *
 * Used by:
 *   - Task 5 (Secure Login Backend) calls generateTokens() on successful login
 *   - Task 4 (Registration Backend) calls generateTokens() after creating a user
 *   - Future routes will use authenticate() middleware to protect endpoints
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

/** Payload encoded inside every JWT */
export interface JwtPayload {
  userId: number;
  role: string;
}

/** Extend Express Request so protected routes can access req.user */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Generate an access token and a refresh token for the given user.
 *
 * - Access token: short-lived (15 min), used for API requests
 * - Refresh token: longer-lived (7 days), used to get a new access token
 *
 * Both tokens are signed with secrets from environment variables
 * (never hardcoded in source code).
 */
export function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiry,        // '15m'
  });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,  // '7d'
  });
  return { accessToken, refreshToken };
}

/**
 * Express middleware that checks for a valid Bearer token.
 *
 * Usage (later sprints): router.get('/protected', authenticate, handler)
 *
 * In Sprint 1 this is defined but only lightly used —
 * it will protect cart/order/profile routes in later sprints.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
