import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import {
  getCart, addToCart, updateCartItem, removeCartItem, syncCart,
  addToCartSchema, updateCartItemSchema, syncCartSchema,
} from "../services/cartService";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// GET /api/cart
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await getCart(req.user!.userId);
    res.json(items);
  } catch (err) { next(err); }
});

// POST /api/cart/items
router.post("/items", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = addToCartSchema.parse(req.body);
    const item = await addToCart(req.user!.userId, productId, quantity);
    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PATCH /api/cart/items/:id
router.patch("/items/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = parseInt(req.params.id as string, 10);
    const { quantity } = updateCartItemSchema.parse(req.body);
    const item = await updateCartItem(req.user!.userId, itemId, quantity);
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /api/cart/items/:id
router.delete("/items/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = parseInt(req.params.id as string, 10);
    await removeCartItem(req.user!.userId, itemId);
    res.json({ message: "Item removed" });
  } catch (err) { next(err); }
});

// POST /api/cart/sync  — merge guest cart into server cart after login
router.post("/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = syncCartSchema.parse(req.body);
    const cart = await syncCart(req.user!.userId, items);
    res.json(cart);
  } catch (err) { next(err); }
});

export default router;
