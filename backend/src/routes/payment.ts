import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { paymentSchema } from "../validators/payment";

const router = Router();

// POST /api/payment/validate
router.post("/validate", async (req: Request, res: Response) => {
  try {
    paymentSchema.parse(req.body);
    return res.json({ ok: true, message: "Payment validated successfully" });
  } catch (err: any) {
    if (err instanceof ZodError) {
      const firstError = err.errors[0]?.message || "Invalid payment details";
      return res.status(400).json({ error: firstError });
    }

    return res.status(500).json({ error: "Validation failed" });
  }
});

export default router;
