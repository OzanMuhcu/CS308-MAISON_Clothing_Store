import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

const wishlistNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Wishlist name is required")
    .max(40, "Wishlist name must be under 40 characters"),
});

const normalizeItem = (item: any) => ({
  id: item.id,
  wishlistId: item.wishlistId,
  productId: item.productId,
  createdAt: item.createdAt,
  product: {
    id: item.product.id,
    name: item.product.name,
    description: item.product.description,
    price: Number(item.product.price),
    discount: Number(item.product.discount ?? 0),
    discountName: item.product.discountName,
    discountType: item.product.discountType,
    discountStartsAt: item.product.discountStartsAt ? item.product.discountStartsAt.toISOString() : null,
    discountEndsAt: item.product.discountEndsAt ? item.product.discountEndsAt.toISOString() : null,
    stockQty: item.product.stockQty,
    sku: item.product.sku,
    imageUrl: item.product.imageUrl,
    category: item.product.category,
  },
});

// GET /api/wishlists — list user's wishlists
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lists = await prisma.wishlist.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: { _count: { select: { items: true } } },
    });

    res.json(
      lists.map((l: any) => ({
        id: l.id,
        name: l.name,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        itemCount: l._count.items,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlists — create a new wishlist
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = wishlistNameSchema.parse(req.body);
    const exists = await prisma.wishlist.findFirst({
      where: {
        userId: req.user!.userId,
        name: { equals: data.name, mode: "insensitive" },
      },
    });
    if (exists) throw new AppError(409, "Wishlist name must be unique.");

    const created = await prisma.wishlist.create({
      data: { userId: req.user!.userId, name: data.name },
    });

    res.status(201).json({
      wishlist: {
        id: created.id,
        name: created.name,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        itemCount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlists/:id — delete a wishlist
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) throw new AppError(400, "Invalid wishlist ID");

    const existing = await prisma.wishlist.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!existing) throw new AppError(404, "Wishlist not found");

    await prisma.wishlist.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/wishlists/:id/items — list items in a wishlist
router.get("/:id/items", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) throw new AppError(400, "Invalid wishlist ID");

    const wishlist = await prisma.wishlist.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!wishlist) throw new AppError(404, "Wishlist not found");

    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId: id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(items.map(normalizeItem));
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlists/:id/items — add a product to wishlist
router.post("/:id/items", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) throw new AppError(400, "Invalid wishlist ID");

    const { productId } = req.body;
    if (!productId || typeof productId !== "number") {
      throw new AppError(400, "productId is required");
    }

    const wishlist = await prisma.wishlist.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!wishlist) throw new AppError(404, "Wishlist not found");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError(404, "Product not found");

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: id,
          productId,
        },
      },
    });

    if (existing) {
      res.json({ message: "Product already in wishlist", id: existing.id });
      return;
    }

    const item = await prisma.wishlistItem.create({
      data: { wishlistId: id, productId },
    });

    res.status(201).json({ message: "Added to wishlist", id: item.id });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlists/:id/items/:productId — remove a product from wishlist
router.delete("/:id/items/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const productId = parseInt(req.params.productId as string, 10);
    if (isNaN(id)) throw new AppError(400, "Invalid wishlist ID");
    if (isNaN(productId)) throw new AppError(400, "Invalid product ID");

    const wishlist = await prisma.wishlist.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!wishlist) throw new AppError(404, "Wishlist not found");

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: id,
          productId,
        },
      },
    });

    if (!existing) throw new AppError(404, "Product not in wishlist");

    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    next(err);
  }
});

export default router;
