import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// All /api/users routes require authentication
router.use(authenticate);

const addressSchema = z.object({
  fullName:   z.string().min(1, "Full name is required"),
  line1:      z.string().min(1, "Address line 1 is required"),
  line2:      z.string().optional().default(""),
  city:       z.string().min(1, "City is required"),
  postalCode: z.string().regex(/^\d{5}$/, "Postal code must be exactly 5 digits"),
  country:    z.string().min(1, "Country is required"),
});

const savedAddressSchema = addressSchema.extend({
  label: z
    .string()
    .trim()
    .min(1, "Address label is required")
    .max(40, "Address label must be under 40 characters"),
});

const normalizeAddress = (a: any) => ({
  id: a.id,
  label: a.label,
  fullName: a.fullName,
  line1: a.line1,
  line2: a.line2 || "",
  city: a.city,
  postalCode: a.postalCode,
  country: a.country,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

// GET /api/users/me/addresses
// Returns all saved addresses for the authenticated user.
router.get(
  "/me/addresses",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addresses = await prisma.userAddress.findMany({
        where: { userId: req.user!.userId },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });
      res.json({ addresses: addresses.map(normalizeAddress) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/users/me/addresses
// Creates a new saved address with a unique label per user.
router.post(
  "/me/addresses",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = savedAddressSchema.parse(req.body);
      const exists = await prisma.userAddress.findFirst({
        where: {
          userId: req.user!.userId,
          label: { equals: data.label, mode: "insensitive" },
        },
      });
      if (exists) {
        throw new AppError(409, "Address label must be unique.");
      }

      const created = await prisma.userAddress.create({
        data: { userId: req.user!.userId, ...data },
      });

      // Keep legacy field available for older consumers.
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          defaultAddress: {
            fullName: data.fullName,
            line1: data.line1,
            line2: data.line2,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country,
          } as any,
        },
      });

      res.status(201).json({ address: normalizeAddress(created) });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/me/addresses/:id
// Updates an existing saved address.
router.put(
  "/me/addresses/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) throw new AppError(400, "Invalid address ID");

      const existing = await prisma.userAddress.findFirst({
        where: { id, userId: req.user!.userId },
      });
      if (!existing) throw new AppError(404, "Address not found");

      const data = savedAddressSchema.parse(req.body);
      const duplicate = await prisma.userAddress.findFirst({
        where: {
          userId: req.user!.userId,
          id: { not: id },
          label: { equals: data.label, mode: "insensitive" },
        },
      });
      if (duplicate) {
        throw new AppError(409, "Address label must be unique.");
      }

      const updated = await prisma.userAddress.update({
        where: { id },
        data,
      });

      // Keep legacy field in sync with latest edited address.
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          defaultAddress: {
            fullName: data.fullName,
            line1: data.line1,
            line2: data.line2,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country,
          } as any,
        },
      });

      res.json({ address: normalizeAddress(updated) });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/me/address
// Returns the authenticated user's saved default delivery address (or null).
router.get(
  "/me/address",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const firstAddress = await prisma.userAddress.findFirst({
        where: { userId: req.user!.userId },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });
      if (!firstAddress) {
        res.json({ defaultAddress: null });
        return;
      }
      res.json({
        defaultAddress: {
          fullName: firstAddress.fullName,
          line1: firstAddress.line1,
          line2: firstAddress.line2,
          city: firstAddress.city,
          postalCode: firstAddress.postalCode,
          country: firstAddress.country,
        },
      });
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
      const defaultLabel = "Home 1";

      const existing = await prisma.userAddress.findFirst({
        where: {
          userId: req.user!.userId,
          label: { equals: defaultLabel, mode: "insensitive" },
        },
      });

      if (existing) {
        await prisma.userAddress.update({ where: { id: existing.id }, data: { ...address, label: defaultLabel } });
      } else {
        await prisma.userAddress.create({
          data: { userId: req.user!.userId, label: defaultLabel, ...address },
        });
      }

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { defaultAddress: address as any },
        select: { defaultAddress: true },
      });

      res.json({ defaultAddress: user.defaultAddress });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
