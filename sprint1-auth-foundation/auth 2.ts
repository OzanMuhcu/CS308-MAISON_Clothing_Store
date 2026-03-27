import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { authenticate, JwtPayload } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  taxId: z.string().optional(),
  homeAddress: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiry });
  return { accessToken, refreshToken };
}

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: 'customer', taxId: data.taxId, homeAddress: data.homeAddress },
    });

    await prisma.cart.create({ data: { userId: user.id } });
    await prisma.wishlist.create({ data: { userId: user.id } });

    const tokens = generateTokens({ userId: user.id, role: user.role });
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, taxId: user.taxId, homeAddress: user.homeAddress },
      ...tokens,
    });
  } catch (err) { next(err); }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError(401, 'Invalid credentials');
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const tokens = generateTokens({ userId: user.id, role: user.role });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, taxId: user.taxId, homeAddress: user.homeAddress },
      ...tokens,
    });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError(400, 'Refresh token required');
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError(401, 'User not found');
    const tokens = generateTokens({ userId: user.id, role: user.role });
    res.json(tokens);
  } catch { res.status(401).json({ error: 'Invalid refresh token' }); }
});

router.post('/logout', authenticate, (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, taxId: true, homeAddress: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (err) { next(err); }
});

// Update profile (customer can update their address, taxId)
router.patch('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      name: z.string().min(1).optional(),
      taxId: z.string().optional(),
      homeAddress: z.string().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: { id: true, name: true, email: true, role: true, taxId: true, homeAddress: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

export default router;
