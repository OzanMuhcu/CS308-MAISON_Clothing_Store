import { Router, Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema, registerUser, loginUser, getMe } from "../services/authService";
import { authenticate } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  (protected)
router.get("/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getMe(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
