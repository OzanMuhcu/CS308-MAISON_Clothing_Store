import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import paymentRoutes from "./routes/payment";
import productRoutes from "./routes/products";
import userRoutes from "./routes/users";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});