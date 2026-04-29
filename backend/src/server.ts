import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/cart";
import paymentRoutes from "./routes/payment";
import orderRoutes from "./routes/orders";
import userRoutes from "./routes/users";
import wishlistRoutes from "./routes/wishlist";
import reviewRoutes from "./routes/reviews";

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow same-origin/non-browser requests (no Origin header) and known dev frontends.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
    console.log("Server running at http://localhost:" + env.port);
  });
}

export default app;
