import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listProducts, getProduct, getCategories, updateProduct } from "../services/productService";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// GET /api/products
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, sort } = req.query;
    const products = await listProducts({
      search: search as string | undefined,
      category: category as string | undefined,
      sort: sort as string | undefined,
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/categories
router.get("/categories", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }
    const product = await getProduct(id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  price: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  discountName: z.string().trim().max(60).optional().nullable(),
  discountType: z.string().trim().max(40).optional().nullable(),
  discountStartsAt: z.string().datetime().optional().nullable(),
  discountEndsAt: z.string().datetime().optional().nullable(),
});

// PATCH /api/products/:id (sales manager only)
router.patch(
  "/:id",
  authenticate,
  authorize("sales_manager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }
      const data = updateSchema.parse(req.body);
      const updated = await updateProduct(id, {
        price: data.price,
        discount: data.discount,
        discountName: data.discountName === "" ? null : data.discountName,
        discountType: data.discountType === "" ? null : data.discountType,
        discountStartsAt: data.discountStartsAt ? new Date(data.discountStartsAt) : data.discountStartsAt === null ? null : undefined,
        discountEndsAt: data.discountEndsAt ? new Date(data.discountEndsAt) : data.discountEndsAt === null ? null : undefined,
      });
      res.json({ product: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
