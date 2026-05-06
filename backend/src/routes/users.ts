import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// All /api/users routes require authentication
router.use(authenticate);

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Email must be valid"),
});

router.put("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = profileUpdateSchema.parse(req.body);
    const userId = req.user!.userId;

    const existingEmail = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingEmail && existingEmail.id !== userId) {
      throw new AppError(409, "This email is already in use.");
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      throw new AppError(404, "User not found.");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
      },
    });

    res.json({ user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, createdAt: updated.createdAt } });
  } catch (err) {
    next(err);
  }
});

const savedCardSchema = z.object({
  label: z.string().trim().min(1).max(40),
  cardholderFullName: z.string().trim().min(2),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3-4 digits"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be MM/YY"),
});
const normalizeCard = (card: any) => ({
  id: card.id,
  label: card.label,
  cardholderFullName: card.cardholderFullName,
  cardNumber: card.cardNumber,
  cvv: card.cvv,
  last4: card.last4,
  expiry: card.expiry,
  createdAt: card.createdAt,
  updatedAt: card.updatedAt,
});
router.get("/me/cards", async (req, res, next) => {
  try {
    const cards = await prisma.savedCard.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    res.json({ cards: cards.map(normalizeCard) });
  } catch (err) {
    next(err);
  }
});
router.post("/me/cards", async (req, res, next) => {
  try {
    const data = savedCardSchema.parse(req.body);

    const existing = await prisma.savedCard.findFirst({
      where: {
        userId: req.user!.userId,
        label: { equals: data.label, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new AppError(409, "Card label must be unique.");
    }

    const created = await prisma.savedCard.create({
      data: {
        userId: req.user!.userId,
        label: data.label,
        cardholderFullName: data.cardholderFullName,
        cardNumber: data.cardNumber,
        cvv: data.cvv,
        last4: data.cardNumber.slice(-4),
        expiry: data.expiry,
      },
    });

    res.status(201).json({ card: normalizeCard(created) });
  } catch (err) {
    next(err);
  }
});
router.put("/me/cards/:id", async (req, res, next) => {
  try {
    const cardId = Number(req.params.id);
    if (!Number.isInteger(cardId)) {
      throw new AppError(400, "Invalid card id.");
    }

    const data = savedCardSchema.parse(req.body);

    const existing = await prisma.savedCard.findFirst({
      where: { id: cardId, userId: req.user!.userId },
    });

    if (!existing) {
      throw new AppError(404, "Card not found.");
    }

    const duplicate = await prisma.savedCard.findFirst({
      where: {
        userId: req.user!.userId,
        id: { not: cardId },
        label: { equals: data.label, mode: "insensitive" },
      },
    });

    if (duplicate) {
      throw new AppError(409, "Card label must be unique.");
    }

    const updated = await prisma.savedCard.update({
      where: { id: cardId },
      data: {
        label: data.label,
        cardholderFullName: data.cardholderFullName,
        cardNumber: data.cardNumber,
        cvv: data.cvv,
        last4: data.cardNumber.slice(-4),
        expiry: data.expiry,
      },
    });

    res.json({ card: normalizeCard(updated) });
  } catch (err) {
    next(err);
  }
});
router.delete("/me/cards/:id", async (req, res, next) => {
  try {
    const cardId = Number(req.params.id);
    if (!Number.isInteger(cardId)) {
      throw new AppError(400, "Invalid card id.");
    }

    const existing = await prisma.savedCard.findFirst({
      where: { id: cardId, userId: req.user!.userId },
    });

    if (!existing) {
      throw new AppError(404, "Card not found.");
    }

    await prisma.savedCard.delete({ where: { id: cardId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
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

// DELETE /api/users/me/addresses/:id
// Deletes a saved address.
router.delete(
  "/me/addresses/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) throw new AppError(400, "Invalid address ID");

      const existing = await prisma.userAddress.findFirst({
        where: { id, userId: req.user!.userId },
      });
      if (!existing) throw new AppError(404, "Address not found");

      await prisma.userAddress.delete({ where: { id } });
      res.status(204).end();
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
