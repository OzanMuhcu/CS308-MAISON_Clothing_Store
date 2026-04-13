/**
 * ORDER ROUTES — Sprint 3 (Checkout Flow)
 *
 * POST /api/orders      → Create order from cart (checkout)
 * GET  /api/orders      → List user's orders
 */

import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { createOrder, getOrders, createOrderSchema } from "../services/orderService";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// POST /api/orders — create order from cart
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingAddress } = createOrderSchema.parse(req.body);
    const order = await createOrder(req.user!.userId, shippingAddress);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders — list user's orders
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await getOrders(req.user!.userId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

export default router;
