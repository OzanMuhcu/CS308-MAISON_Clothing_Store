import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// ── Helper: check if user has purchased the product and has a delivered order ──
async function hasDeliveredOrder(userId: number, productId: number): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: "delivered",
      items: {
        some: { productId },
      },
    },
  });
  return !!order;
}

// ── Public: GET /api/reviews/product/:productId — get approved comments & ratings for a product ──
router.get("/product/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId as string, 10);
    if (isNaN(productId)) throw new AppError(400, "Invalid product ID");

    // Get approved comments with user name
    const comments = await prisma.comment.findMany({
      where: { productId, status: "approved" },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Get all ratings with user name
    const ratings = await prisma.rating.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Get product's current average
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { avgRating: true, ratingCount: true },
    });

    res.json({
      comments: comments.map((c: any) => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        text: c.text,
        createdAt: c.createdAt,
      })),
      ratings: ratings.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        userName: r.user.name,
        value: r.value,
        createdAt: r.createdAt,
      })),
      avgRating: product?.avgRating ?? 0,
      ratingCount: product?.ratingCount ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── Auth required: POST /api/reviews/rate — submit or update a rating ──
const ratingSchema = z.object({
  productId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

router.post("/rate", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, value } = ratingSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify delivered order
    const delivered = await hasDeliveredOrder(userId, productId);
    if (!delivered) {
      throw new AppError(403, "You can only rate products from delivered orders");
    }

    // Upsert rating
    await prisma.rating.upsert({
      where: { userId_productId: { userId, productId } },
      update: { value },
      create: { userId, productId, value },
    });

    // Recalculate average rating
    const agg = await prisma.rating.aggregate({
      where: { productId },
      _avg: { value: true },
      _count: { value: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: agg._avg.value ?? 0,
        ratingCount: agg._count.value ?? 0,
      },
    });

    res.json({
      message: "Rating submitted",
      avgRating: agg._avg.value ?? 0,
      ratingCount: agg._count.value ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── Auth required: POST /api/reviews/comment — submit a comment (pending by default) ──
const commentSchema = z.object({
  productId: z.number().int().positive(),
  text: z.string().min(1, "Comment cannot be empty").max(2000),
});

router.post("/comment", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, text } = commentSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify delivered order
    const delivered = await hasDeliveredOrder(userId, productId);
    if (!delivered) {
      throw new AppError(403, "You can only comment on products from delivered orders");
    }

    const comment = await prisma.comment.create({
      data: { userId, productId, text, status: "pending" },
    });

    res.status(201).json({
      message: "Comment submitted and is pending approval",
      id: comment.id,
      status: comment.status,
    });
  } catch (err) {
    next(err);
  }
});

// ── Auth required: GET /api/reviews/my/:productId — get user's own rating & comment for a product ──
router.get("/my/:productId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId as string, 10);
    if (isNaN(productId)) throw new AppError(400, "Invalid product ID");
    const userId = req.user!.userId;

    const rating = await prisma.rating.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    const comments = await prisma.comment.findMany({
      where: { userId, productId },
      orderBy: { createdAt: "desc" },
    });

    const canReview = await hasDeliveredOrder(userId, productId);

    res.json({
      canReview,
      myRating: rating ? rating.value : null,
      myComments: comments.map((c: any) => ({
        id: c.id,
        text: c.text,
        status: c.status,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── Product Manager: GET /api/reviews/pending — list all pending comments ──
router.get("/pending", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== "product_manager") {
      throw new AppError(403, "Only product managers can manage comments");
    }

    const comments = await prisma.comment.findMany({
      where: { status: "pending" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(
      comments.map((c: any) => ({
        id: c.id,
        text: c.text,
        status: c.status,
        createdAt: c.createdAt,
        user: { id: c.user.id, name: c.user.name, email: c.user.email },
        product: { id: c.product.id, name: c.product.name },
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ── Product Manager: PATCH /api/reviews/comment/:id/status — approve or reject ──
const statusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

router.patch("/comment/:id/status", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== "product_manager") {
      throw new AppError(403, "Only product managers can manage comments");
    }

    const commentId = parseInt(req.params.id as string, 10);
    if (isNaN(commentId)) throw new AppError(400, "Invalid comment ID");

    const { status } = statusSchema.parse(req.body);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(404, "Comment not found");

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { status },
    });

    res.json({ message: `Comment ${status}`, id: updated.id, status: updated.status });
  } catch (err) {
    next(err);
  }
});

export default router;
