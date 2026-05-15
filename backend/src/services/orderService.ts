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

const REFUND_WINDOW_DAYS = 30;

async function restoreStock(tx: any, items: { productId: number; quantity: number }[]) {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQty: { increment: item.quantity } },
    });
  }
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

export async function listRefundRequestsForUser(userId: number) {
  const requests = await prisma.refundRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r: any) => ({
    id: r.id,
    orderId: r.orderId,
    status: r.status,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
  }));
}

export async function listRefundRequestsForAdmin() {
  const requests = await prisma.refundRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      order: { include: { items: true } },
    },
  });

  return requests.map((r: any) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
    user: r.user,
    order: formatOrder(r.order),
  }));
}

export async function listAllOrders(range?: { startDate?: Date; endDate?: Date }) {
  const where: any = {};
  if (range?.startDate || range?.endDate) {
    where.createdAt = {};
    if (range.startDate) where.createdAt.gte = range.startDate;
    if (range.endDate) where.createdAt.lte = range.endDate;
  }

  const orders = await prisma.order.findMany({
    where,
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

export async function getOrderForAdmin(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });

  if (!order) throw new AppError(404, "Order not found");

  return formatOrder(order);
}

export async function cancelOrder(userId: number, orderId: number) {
  return prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new AppError(404, "Order not found");
    if (order.userId !== userId) throw new AppError(403, "Access denied");
    if (order.status !== "processing") throw new AppError(400, "Only processing orders can be cancelled");

    await restoreStock(tx, order.items);

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });

    return formatOrder(updated);
  });
}

export async function requestRefund(userId: number, orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new AppError(404, "Order not found");
  if (order.userId !== userId) throw new AppError(403, "Access denied");
  if (order.status !== "delivered") throw new AppError(400, "Refunds are only available for delivered orders");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REFUND_WINDOW_DAYS);
  if (order.createdAt < cutoff) throw new AppError(400, "Refund window has expired");

  const existing = await prisma.refundRequest.findUnique({ where: { orderId } });
  if (existing) throw new AppError(400, "Refund request already submitted");

  const created = await prisma.refundRequest.create({
    data: { orderId, userId, status: "pending" },
  });

  return {
    id: created.id,
    orderId: created.orderId,
    status: created.status,
    createdAt: created.createdAt,
    resolvedAt: created.resolvedAt,
  };
}

export async function reviewRefundRequest(refundId: number, status: "approved" | "rejected") {
  return prisma.$transaction(async (tx: any) => {
    const request = await tx.refundRequest.findUnique({
      where: { id: refundId },
      include: { order: { include: { items: true } }, user: { select: { id: true, name: true, email: true } } },
    });

    if (!request) throw new AppError(404, "Refund request not found");
    if (request.status !== "pending") throw new AppError(400, "Refund request already resolved");

    if (status === "approved") {
      if (request.order.status !== "delivered") {
        throw new AppError(400, "Only delivered orders can be refunded");
      }
      await restoreStock(tx, request.order.items);
      await tx.order.update({ where: { id: request.orderId }, data: { status: "refunded" } });
    }

    const updated = await tx.refundRequest.update({
      where: { id: refundId },
      data: { status, resolvedAt: new Date() },
    });

    return {
      id: updated.id,
      orderId: updated.orderId,
      status: updated.status,
      createdAt: updated.createdAt,
      resolvedAt: updated.resolvedAt,
    };
  });
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
