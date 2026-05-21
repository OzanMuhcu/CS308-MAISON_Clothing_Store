import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";
import { listVisibleCategories, createCategory, hideCategory } from "../services/categoryService";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// GET /api/categories — public list of visible categories.
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await listVisibleCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories — product manager creates a new category.
const createSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(60),
});

router.post(
  "/",
  authenticate,
  authorize("product_manager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = createSchema.parse(req.body);
      const created = await createCategory(name);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/categories/:id — soft-remove (hidden=true).
router.delete(
  "/:id",
  authenticate,
  authorize("product_manager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) throw new AppError(400, "Invalid category id");
      const hidden = await hideCategory(id);
      res.json(hidden);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
