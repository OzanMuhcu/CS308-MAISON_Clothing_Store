import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { getEffectivePrice } from "./discountUtils";

interface AddressSnapshot {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

/**
 * Story 16: Create order from the user's current cart.
 * Runs inside a transaction to guarantee:
 *  1. All cart items have sufficient stock
 *  2. Stock is decremented atomically
 *  3. Order + items are created
 *  4. Cart is cleared
 * If any step fails, everything rolls back.
 */
export async function createOrder(userId: number, address: AddressSnapshot) {
  return prisma.$transaction(async (tx: any) => {
    // 1. Load cart items with product data
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new AppError(400, "Cart is empty");
    }

    // 2. Verify stock and build order items
    let totalAmount = 0;
    const orderItemsData: {
      productId: number;
      productName: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const ci of cartItems) {
      const product = await tx.product.findUnique({ where: { id: ci.productId } });
      if (!product) throw new AppError(400, `Product ${ci.productId} no longer exists`);
      if (product.stockQty < ci.quantity) {
        throw new AppError(400, `Insufficient stock for "${product.name}". Available: ${product.stockQty}`);
      }

      const unitPrice = getEffectivePrice(product);
      const lineTotal = Math.round(unitPrice * ci.quantity * 100) / 100;
      totalAmount += lineTotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: ci.quantity,
        lineTotal,
      });

      // 3. Decrement stock
      await tx.product.update({
        where: { id: product.id },
        data: { stockQty: { decrement: ci.quantity } },
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    // 4. Generate invoice number
    const invoiceNo = `INV-${Date.now()}-${userId}`;

    // 5. Create order with snapshot data
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: "processing",
        address: address as any,
        invoiceNo,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    // 6. Clear cart only after successful order creation
    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  });
}

export async function listOrders(userId: number) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return orders.map(formatOrder);
}

export async function listAllOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });

  return orders.map(formatOrder);
}

export async function getOrder(userId: number, orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });

  if (!order) throw new AppError(404, "Order not found");
  if (order.userId !== userId) throw new AppError(403, "Access denied");

  return formatOrder(order);
}

function formatOrder(order: any) {
  return {
    id: order.id,
    totalAmount: Number(order.totalAmount),
    status: order.status,
    address: order.address,
    invoiceNo: order.invoiceNo,
    createdAt: order.createdAt,
    user: order.user || undefined,
    items: order.items.map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
    })),
  };
}
