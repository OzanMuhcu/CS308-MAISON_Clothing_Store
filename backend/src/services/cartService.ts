import { z } from "zod";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

export const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export const syncCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })
  ),
});

function formatCartItem(item: any) {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      stockQty: item.product.stockQty,
      sku: item.product.sku,
      imageUrl: item.product.imageUrl,
      category: item.product.category,
    },
  };
}

export async function getCart(userId: number) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { id: "asc" },
  });
  return items.map(formatCartItem);
}

export async function addToCart(userId: number, productId: number, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, "Product not found");
  if (product.stockQty <= 0) throw new AppError(400, "This product is currently out of stock");

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  const newQty = (existing?.quantity || 0) + quantity;
  if (newQty > product.stockQty) {
    throw new AppError(400, `Only ${product.stockQty} units available`);
  }

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { product: true },
      })
    : await prisma.cartItem.create({
        data: { userId, productId, quantity },
        include: { product: true },
      });

  return formatCartItem(item);
}

export async function updateCartItem(userId: number, itemId: number, quantity: number) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });
  if (!item || item.userId !== userId) throw new AppError(404, "Cart item not found");
  if (quantity > item.product.stockQty) {
    throw new AppError(400, `Only ${item.product.stockQty} units available`);
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { product: true },
  });
  return formatCartItem(updated);
}

export async function removeCartItem(userId: number, itemId: number) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw new AppError(404, "Cart item not found");
  await prisma.cartItem.delete({ where: { id: itemId } });
}

export async function syncCart(userId: number, items: { productId: number; quantity: number }[]) {
  for (const { productId, quantity } of items) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.stockQty <= 0) continue;

    const qty = Math.min(quantity, product.stockQty);
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      const merged = Math.min(existing.quantity + qty, product.stockQty);
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: merged } });
    } else {
      await prisma.cartItem.create({ data: { userId, productId, quantity: qty } });
    }
  }

  return getCart(userId);
}

export async function clearCart(userId: number) {
  await prisma.cartItem.deleteMany({ where: { userId } });
}
