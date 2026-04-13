/**
 * ORDER SERVICE — Sprint 3 (Checkout Flow)
 *
 * DEV-22: Create order from cart
 * DEV-23: Reuse cart data for order summary
 * DEV-24: Cart stays intact until order is confirmed (transaction)
 *
 * Flow:
 *   1. Fetch user's server cart
 *   2. Validate stock for every item
 *   3. Create Order + OrderItems in a single transaction
 *   4. Decrement product stock
 *   5. Clear cart ONLY after successful order creation
 */

import { z } from "zod";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { Decimal } from "@prisma/client/runtime/library";

const paymentSchema = z
  .object({
    cardNumber: z.string().regex(/^\d{16}$/, "Card number must be exactly 16 digits"),
    expiryDate: z.string().regex(/^(\d{2})\/(\d{2})$/, "Expiry date must be in MM/YY format"),
    cvv: z.string().regex(/^\d{3}$/, "CVV must be exactly 3 digits"),
  })
  .refine(({ expiryDate }) => {
    const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const month = Number(match[1]);
    const year = Number(`20${match[2]}`);
    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return year > currentYear || (year === currentYear && month >= currentMonth);
  }, "Card has expired");

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, "Shipping address is required (min 5 characters)"),
  payment: paymentSchema,
});

export async function createOrder(userId: number, shippingAddress: string) {
  // Step 1: Fetch user's cart with product info
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new AppError(400, "Cart is empty — add items before checking out");
  }

  // Step 2: Validate stock for every item
  for (const item of cartItems) {
    if (item.quantity > item.product.stockQty) {
      throw new AppError(
        400,
        `Insufficient stock for "${item.product.name}". Available: ${item.product.stockQty}`
      );
    }
  }

  // Step 3: Calculate total
  const totalAmount = cartItems.reduce((sum, item) => {
    const lineTotal = new Decimal(item.product.price.toString()).mul(item.quantity);
    return sum.add(lineTotal);
  }, new Decimal(0));

  // Step 4: Transaction — create order, decrement stock, clear cart
  // DEV-24: Cart is only cleared AFTER the order is confirmed
  const order = await prisma.$transaction(async (tx) => {
    // Create order with items
    const newOrder = await tx.order.create({
      data: {
        userId,
        shippingAddress,
        totalAmount,
        status: "processing",
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, sku: true },
            },
          },
        },
      },
    });

    // Decrement stock for each product
    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    // Clear cart only after order is safely created
    await tx.cartItem.deleteMany({ where: { userId } });

    return newOrder;
  });

  // Format response
  return {
    id: order.id,
    status: order.status,
    shippingAddress: order.shippingAddress,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      product: item.product,
    })),
  };
}

export async function getOrders(userId: number) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true, sku: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    shippingAddress: order.shippingAddress,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      product: item.product,
    })),
  }));
}
