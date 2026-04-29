import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

// GET /api/wishlist — list user's wishlist items
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: Number(item.product.price),
          stockQty: item.product.stockQty,
          sku: item.product.sku,
          imageUrl: item.product.imageUrl,
          category: item.product.category,
        },
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlist — add a product to wishlist (even if out of stock)
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;
    if (!productId || typeof productId !== "number") {
      throw new AppError(400, "productId is required");
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError(404, "Product not found");

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user!.userId,
          productId,
        },
      },
    });

    if (existing) {
      res.json({ message: "Product already in wishlist", id: existing.id });
      return;
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId: req.user!.userId,
        productId,
      },
    });

    res.status(201).json({ message: "Added to wishlist", id: item.id });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlist/:productId — remove a product from wishlist
router.delete("/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId as string, 10);
    if (isNaN(productId)) throw new AppError(400, "Invalid product ID");

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user!.userId,
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
