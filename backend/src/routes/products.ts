import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listProducts, getProduct, getCategories, updateProduct, createProduct, updateProductByManager } from "../services/productService";
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

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(5000).default(""),
  stockQty: z.union([z.number(), z.string()]).pipe(z.coerce.number().int().nonnegative()).default(0),
  sku: z.string().trim().min(1, "SKU is required").max(50),
  imageUrl: z.string().trim().max(2000).default(""),
  category: z.string().trim().max(100).default(""),
  model: z.string().trim().max(100).default(""),
  serialNumber: z.string().trim().min(1, "Serial number is required").max(100),
  warrantyStatus: z.string().trim().max(50).default("None"),
  distributorInfo: z.string().trim().max(200).default(""),
});

// POST /api/products (product manager only)
router.post(
  "/",
  authenticate,
  authorize("product_manager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createSchema.parse(req.body);
      const product = await createProduct(data);
      res.status(201).json({ product });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/products/manager (product manager only — includes unpriced products)
router.get(
  "/manager",
  authenticate,
  authorize("product_manager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, sort } = req.query;
      const products = await listProducts({
        search: search as string | undefined,
        category: category as string | undefined,
        sort: sort as string | undefined,
        includeUnpriced: true,
        includeInactive: true,
      });
      res.json(products);
    } catch (err) {
      next(err);
    }
  }
);

const managerUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  stockQty: z.number().int().nonnegative().optional(),
  imageUrl: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  warrantyStatus: z.string().trim().max(50).optional(),
  distributorInfo: z.string().trim().max(200).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/products/admin (sales manager only — includes unpriced products)
router.get(
  "/admin",
  authenticate,
  authorize("sales_manager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, sort } = req.query;
      const products = await listProducts({
        search: search as string | undefined,
        category: category as string | undefined,
        sort: sort as string | undefined,
        includeUnpriced: true,
        includeInactive: true,
      });
      res.json(products);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/products/manager/:id (product manager only — non-price fields + stock)
router.patch(
  "/manager/:id",
  authenticate,
  authorize("product_manager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }
      const data = managerUpdateSchema.parse(req.body);
      const updated = await updateProductByManager(id, data);
      res.json({ product: updated });
    } catch (err) {
      next(err);
    }
  }
);

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
