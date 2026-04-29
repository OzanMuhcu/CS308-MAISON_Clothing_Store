import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { paymentSchema } from "../validators/payment";
import { ZodError } from "zod";

const router = Router();

// POST /api/payment/validate
// Mock payment validation — checks card format only, never stores card data.
// Requires authentication so only logged-in users can submit.
router.post(
  "/validate",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate card fields with Zod
      paymentSchema.parse(req.body);

      // Mock: always approve if validation passes.
      // IMPORTANT: card data is intentionally NOT logged or stored.
      res.json({ ok: true, message: "Payment validated successfully" });
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.errors[0]?.message || "Invalid payment details";
        res.status(400).json({ ok: false, message: firstError });
        return;
      }
      next(err);
    }
  }
);

export default router;
