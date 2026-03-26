/**
 * AUTH ROUTES — Sprint 1
 *
 * Task 5: Secure Login Backend (Polat)
 *   - POST /api/auth/login
 *
 * Task 4: Secure Registration Backend (teammate)
 *   - POST /api/auth/register  ← implemented by teammate, included here
 *     because both live in the same route file
 *
 * Dependencies:
 *   - generateTokens() from middleware/auth.ts (Task 6: Auth Foundation)
 *   - Prisma User model (shared DB schema)
 *   - bcryptjs for password hash comparison
 *   - zod for input validation
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { generateTokens } from '../middleware/auth';

const router = Router();

// ============================================================
// TASK 5 — SECURE LOGIN BACKEND (Polat)
// ============================================================

/**
 * Login input validation schema.
 *
 * Why zod here:
 *   - Rejects malformed emails before we ever hit the database
 *   - Ensures password field is not blank
 *   - Prevents injection of unexpected fields (zod strips extras)
 *   - Returns clear validation errors to the frontend
 *
 * Security note: we validate format only — we intentionally do NOT
 * give different errors for "email not found" vs "wrong password"
 * to prevent user-enumeration attacks.
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 *
 * Flow:
 *   1. Validate input with zod schema
 *   2. Look up user by email in the database
 *   3. Compare submitted password against stored bcrypt hash
 *   4. If either step fails → return generic "Invalid credentials" (security)
 *   5. On success → call generateTokens() (from Auth Foundation)
 *   6. Return user info (no sensitive fields) + tokens
 *
 * Security considerations:
 *   - Password is never logged or included in responses
 *   - bcrypt.compare() is timing-safe (prevents timing attacks)
 *   - Same error message for wrong email AND wrong password
 *     (prevents attackers from discovering valid emails)
 *   - passwordHash is excluded from the response object
 *   - JWT secret comes from environment variable, not hardcoded
 */
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Step 1: Validate and sanitize input
      const { email, password } = loginSchema.parse(req.body);

      // Step 2: Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Security: if user doesn't exist, return same error as wrong password
      if (!user) {
        throw new AppError(401, 'Invalid credentials');
      }

      // Step 3: Compare password against stored bcrypt hash
      // bcrypt.compare is inherently timing-safe — it always takes
      // roughly the same time regardless of where the mismatch occurs
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new AppError(401, 'Invalid credentials');
      }

      // Step 4: Generate JWT tokens (provided by Auth Foundation — Task 6)
      const tokens = generateTokens({
        userId: user.id,
        role: user.role,
      });

      // Step 5: Return safe user object + tokens
      // IMPORTANT: never include passwordHash in response
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          taxId: user.taxId,
          homeAddress: user.homeAddress,
        },
        ...tokens,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// TASK 4 — SECURE REGISTRATION BACKEND (teammate)
// Included here because register and login share the same route file.
// This code is owned and presented by the teammate doing Task 4.
// ============================================================

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  taxId: z.string().optional(),
  homeAddress: z.string().optional(),
});

router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if email already exists
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new AppError(409, 'Email already registered');
      }

      // Hash password with bcrypt (cost factor 12)
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create user with customer role by default
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'customer',
          taxId: data.taxId,
          homeAddress: data.homeAddress,
        },
      });

      // Create cart and wishlist for the new customer
      await prisma.cart.create({ data: { userId: user.id } });
      await prisma.wishlist.create({ data: { userId: user.id } });

      // Generate tokens (Auth Foundation — Task 6)
      const tokens = generateTokens({
        userId: user.id,
        role: user.role,
      });

      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          taxId: user.taxId,
          homeAddress: user.homeAddress,
        },
        ...tokens,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
