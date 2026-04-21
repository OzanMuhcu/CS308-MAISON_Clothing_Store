import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// All /api/users routes require authentication
router.use(authenticate);

/**
 * Story 14: Address shape shared with orders.ts addressSchema.
 * line2 is optional and defaults to empty string to keep the JSON uniform.
 */
const addressSchema = z.object({
  fullName:   z.string().min(1, "Full name is required"),
  line1:      z.string().min(1, "Address line 1 is required"),
  line2:      z.string().optional().default(""),
  city:       z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country:    z.string().min(1, "Country is required"),
});

// GET /api/users/me/address
// Returns the authenticated user's saved default delivery address (or null).
router.get(
  "/me/address",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where:  { id: req.user!.userId },
        select: { defaultAddress: true },
      });
      if (!user) throw new AppError(404, "User not found");
      res.json({ defaultAddress: user.defaultAddress ?? null });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/me/address
// Creates or replaces the authenticated user's default delivery address.
router.put(
  "/me/address",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = addressSchema.parse(req.body);
      const user = await prisma.user.update({
        where:  { id: req.user!.userId },
        data:   { defaultAddress: address },
        select: { defaultAddress: true },
      });
      res.json({ defaultAddress: user.defaultAddress });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
