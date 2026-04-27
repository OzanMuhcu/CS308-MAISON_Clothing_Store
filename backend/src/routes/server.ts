import express from "express";
import cors from "cors";
import { env } from "../config/env";
import { errorHandler } from "../middleware/errorHandler";
import authRoutes from "./auth";
import productRoutes from "./products";
import cartRoutes from "./cart";
import paymentRoutes from "./payment";
import orderRoutes from "./orders";
import userRoutes from "./users";
import wishlistRoutes from "./wishlist";
import reviewRoutes from "./reviews";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// CRITICAL: preflight fix
app.options("*", cors());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port}`);
  });
}

export default app;