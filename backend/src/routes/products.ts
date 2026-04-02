import { Router, Request, Response, NextFunction } from "express";
import { listProducts, getProduct, getCategories } from "../services/productService";

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

export default router;
