jest.mock("../config/db", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refundRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
  },
}));

// Mock invoice email so tests never open real SMTP connections.
jest.mock("../services/invoiceService", () => ({
  sendRefundDecisionEmail: jest.fn().mockResolvedValue(undefined),
  generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from("pdf")),
  sendInvoiceEmail: jest.fn().mockResolvedValue({}),
}));

import { z } from "zod";
import prisma from "../config/db";
import {
  createOrder,
  getOrder,
  listOrders,
  cancelOrder,
  requestRefund,
  reviewRefundRequest,
  updateOrderStatusByManager,
  listAllOrders,
} from "../services/orderService";

const db = prisma as any;

const addressSchema = z.object({
  fullName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional().default(""),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{5}$/, "Postal code must be exactly 5 digits"),
  country: z.string().min(1),
});

const validAddress = {
  fullName: "Alice Smith",
  line1: "123 Main St",
  city: "New York",
  postalCode: "10001",
  country: "US",
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Address schema ────────────────────────────────────────────────────────────

describe("addressSchema", () => {
  test("accepts a valid address with a 5-digit postal code", () => {
    expect(addressSchema.safeParse(validAddress).success).toBe(true);
  });

  test("rejects a postal code that is not exactly 5 digits", () => {
    expect(
      addressSchema.safeParse({ ...validAddress, postalCode: "1234" }).success
    ).toBe(false);
  });

  test("rejects a postal code with letters", () => {
    expect(
      addressSchema.safeParse({ ...validAddress, postalCode: "1234A" }).success
    ).toBe(false);
  });

  test("rejects an empty fullName", () => {
    expect(
      addressSchema.safeParse({ ...validAddress, fullName: "" }).success
    ).toBe(false);
  });
});

// ── createOrder service ───────────────────────────────────────────────────────

describe("createOrder", () => {
  test("throws AppError 400 when cart is empty", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = { cartItem: { findMany: jest.fn().mockResolvedValue([]) } };
      return fn(tx);
    });
    await expect(createOrder(1, validAddress)).rejects.toThrow("Cart is empty");
  });

  test("throws AppError 400 when a product has insufficient stock", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        cartItem: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, productId: 1, quantity: 5 }]),
        },
        product: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            name: "Slim Trousers",
            price: 79.99,
            stockQty: 3,
            discount: 0,
          }),
        },
      };
      return fn(tx);
    });
    await expect(createOrder(1, validAddress)).rejects.toThrow("Insufficient stock");
  });

  test("created order has an invoiceNo matching INV-<timestamp>-<userId>", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        cartItem: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, productId: 1, quantity: 2 }]),
          deleteMany: jest.fn().mockResolvedValue({}),
        },
        product: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1, name: "Classic Shirt", price: 49.99, stockQty: 10, discount: 0,
          }),
          update: jest.fn().mockResolvedValue({}),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        order: {
          create: jest.fn().mockImplementation(({ data }: any) => ({
            id: 1,
            invoiceNo: data.invoiceNo,
            totalAmount: data.totalAmount,
            status: "processing",
            address: data.address,
            userId: 1,
            createdAt: new Date(),
            items: [],
          })),
        },
      };
      return fn(tx);
    });

    const order = await createOrder(1, validAddress);
    expect(order.invoiceNo).toMatch(/^INV-\d+-1$/);
  });

  test("total amount uses effective discounted price, not original", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        cartItem: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, productId: 1, quantity: 1 }]),
          deleteMany: jest.fn().mockResolvedValue({}),
        },
        product: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1, name: "Coat", price: 200, stockQty: 5,
            discount: 50,
            discountStartsAt: null,
            discountEndsAt: null,
          }),
          update: jest.fn().mockResolvedValue({}),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        order: {
          create: jest.fn().mockImplementation(({ data }: any) => ({
            id: 2, invoiceNo: data.invoiceNo, totalAmount: data.totalAmount,
            status: "processing", address: validAddress, userId: 1,
            createdAt: new Date(), items: [],
          })),
        },
      };
      return fn(tx);
    });

    const order = await createOrder(1, validAddress);
    // 50% off $200 = $100
    expect(order.totalAmount).toBe(100);
  });
});

// ── getOrder service ──────────────────────────────────────────────────────────

describe("getOrder", () => {
  test("throws AppError 404 when order does not exist", async () => {
    db.order.findUnique.mockResolvedValue(null);
    await expect(getOrder(1, 999)).rejects.toThrow("Order not found");
  });

  test("throws AppError 403 when order belongs to a different user", async () => {
    db.order.findUnique.mockResolvedValue({
      id: 1, userId: 2, totalAmount: 100, status: "processing",
      address: {}, invoiceNo: "INV-001", createdAt: new Date(),
      items: [], user: null,
    });
    await expect(getOrder(1, 1)).rejects.toThrow("Access denied");
  });
});

// ── listOrders service ────────────────────────────────────────────────────────

describe("listOrders", () => {
  test("returns an empty array when the user has no orders", async () => {
    db.order.findMany.mockResolvedValue([]);
    const result = await listOrders(1);
    expect(result).toEqual([]);
  });
});

// ── listAllOrders (sales manager) ─────────────────────────────────────────────

describe("listAllOrders", () => {
  test("fetches all orders without date filter when no range is passed", async () => {
    db.order.findMany.mockResolvedValue([]);
    await listAllOrders();

    const call = db.order.findMany.mock.calls[0][0];
    expect(call.where).toEqual({});
  });

  test("applies gte/lte when a date range is provided", async () => {
    db.order.findMany.mockResolvedValue([]);
    const start = new Date("2025-01-01");
    const end = new Date("2025-12-31");

    await listAllOrders({ startDate: start, endDate: end });

    const call = db.order.findMany.mock.calls[0][0];
    expect(call.where.createdAt.gte).toEqual(start);
    expect(call.where.createdAt.lte).toEqual(end);
  });
});

// ── cancelOrder service ───────────────────────────────────────────────────────

describe("cancelOrder", () => {
  test("throws 404 when order does not exist", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = { order: { findUnique: jest.fn().mockResolvedValue(null) } };
      return fn(tx);
    });
    await expect(cancelOrder(1, 999)).rejects.toThrow("Order not found");
  });

  test("throws 403 when order belongs to a different user", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1, userId: 2, status: "processing", items: [],
          }),
        },
      };
      return fn(tx);
    });
    await expect(cancelOrder(1, 1)).rejects.toThrow("Access denied");
  });

  test("throws 400 when order status is not 'processing'", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1, userId: 1, status: "delivered", items: [],
          }),
        },
      };
      return fn(tx);
    });
    await expect(cancelOrder(1, 1)).rejects.toThrow("Only processing orders can be cancelled");
  });

  test("cancels the order and restores stock for each item", async () => {
    const productUpdateMock = jest.fn().mockResolvedValue({});
    const orderUpdateMock = jest.fn().mockResolvedValue({
      id: 1, userId: 1, totalAmount: 150, status: "cancelled",
      address: validAddress, invoiceNo: "INV-1", createdAt: new Date(),
      items: [{ id: 1, productId: 10, productName: "Shirt", unitPrice: 50, quantity: 3, lineTotal: 150 }],
      user: { id: 1, name: "Alice", email: "alice@test.com" },
    });

    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1, userId: 1, status: "processing",
            items: [{ productId: 10, quantity: 3 }],
          }),
          update: orderUpdateMock,
        },
        product: { update: productUpdateMock },
      };
      return fn(tx);
    });

    const result = await cancelOrder(1, 1);

    expect(productUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: { stockQty: { increment: 3 } },
      })
    );
    expect(result.status).toBe("cancelled");
  });
});

// ── requestRefund service ─────────────────────────────────────────────────────

describe("requestRefund", () => {
  const deliveredOrder = {
    id: 10, userId: 1, status: "delivered",
    createdAt: new Date(), // within 30-day window
  };

  test("throws 404 when order does not exist", async () => {
    db.order.findUnique.mockResolvedValue(null);
    await expect(requestRefund(1, 99)).rejects.toThrow("Order not found");
  });

  test("throws 403 when order belongs to a different user", async () => {
    db.order.findUnique.mockResolvedValue({ ...deliveredOrder, userId: 2 });
    await expect(requestRefund(1, 10)).rejects.toThrow("Access denied");
  });

  test("throws 400 when order status is not 'delivered'", async () => {
    db.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: "processing" });
    await expect(requestRefund(1, 10)).rejects.toThrow("Refunds are only available for delivered orders");
  });

  test("throws 400 when refund window has expired (order > 30 days old)", async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    db.order.findUnique.mockResolvedValue({ ...deliveredOrder, createdAt: oldDate });
    await expect(requestRefund(1, 10)).rejects.toThrow("Refund window has expired");
  });

  test("throws 400 when a refund request already exists for the order", async () => {
    db.order.findUnique.mockResolvedValue(deliveredOrder);
    db.refundRequest.findUnique.mockResolvedValue({
      id: 5, orderId: 10, status: "pending",
    });
    await expect(requestRefund(1, 10)).rejects.toThrow("Refund request already submitted");
  });

  test("creates and returns a pending refund request for a valid delivered order", async () => {
    db.order.findUnique.mockResolvedValue(deliveredOrder);
    db.refundRequest.findUnique.mockResolvedValue(null);
    db.refundRequest.create.mockResolvedValue({
      id: 7, orderId: 10, userId: 1, status: "pending",
      createdAt: new Date(), resolvedAt: null,
    });

    const result = await requestRefund(1, 10);

    expect(result.status).toBe("pending");
    expect(result.orderId).toBe(10);
    expect(db.refundRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orderId: 10, userId: 1, status: "pending" }),
      })
    );
  });
});

// ── reviewRefundRequest service ───────────────────────────────────────────────

describe("reviewRefundRequest", () => {
  const pendingRequest = {
    id: 1,
    orderId: 10,
    status: "pending",
    order: {
      id: 10, status: "delivered", totalAmount: 150, invoiceNo: "INV-10",
      items: [{ productId: 3, quantity: 2, productName: "Shirt", unitPrice: 75, lineTotal: 150 }],
    },
    user: { id: 1, name: "Alice", email: "alice@test.com" },
  };

  function makeRefundTx(request = pendingRequest) {
    const refundUpdateMock = jest.fn().mockResolvedValue({
      id: 1, orderId: 10, status: "approved",
      createdAt: new Date(), resolvedAt: new Date(),
    });
    const orderUpdateMock = jest.fn().mockResolvedValue({});
    const productUpdateMock = jest.fn().mockResolvedValue({});

    const tx = {
      refundRequest: {
        findUnique: jest.fn().mockResolvedValue(request),
        update: refundUpdateMock,
      },
      order: { update: orderUpdateMock },
      product: { update: productUpdateMock },
    };

    return { tx, refundUpdateMock, orderUpdateMock, productUpdateMock };
  }

  test("throws 404 when refund request does not exist", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = { refundRequest: { findUnique: jest.fn().mockResolvedValue(null) } };
      return fn(tx);
    });
    await expect(reviewRefundRequest(999, "approved")).rejects.toThrow("Refund request not found");
  });

  test("throws 400 when refund request is already resolved", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        refundRequest: {
          findUnique: jest.fn().mockResolvedValue({ ...pendingRequest, status: "approved" }),
        },
      };
      return fn(tx);
    });
    await expect(reviewRefundRequest(1, "rejected")).rejects.toThrow("Refund request already resolved");
  });

  test("approved: restores stock and marks order as 'refunded'", async () => {
    const { tx, orderUpdateMock, productUpdateMock } = makeRefundTx();

    db.$transaction.mockImplementation(async (fn: Function) => fn(tx));

    await reviewRefundRequest(1, "approved");

    // stock restored for each item
    expect(productUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3 },
        data: { stockQty: { increment: 2 } },
      })
    );
    // order marked refunded
    expect(orderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "refunded" } })
    );
  });

  test("rejected: does not restore stock or update order status", async () => {
    const rejectedUpdate = jest.fn().mockResolvedValue({
      id: 1, orderId: 10, status: "rejected",
      createdAt: new Date(), resolvedAt: new Date(),
    });

    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        refundRequest: {
          findUnique: jest.fn().mockResolvedValue(pendingRequest),
          update: rejectedUpdate,
        },
        order: { update: jest.fn() },
        product: { update: jest.fn() },
      };
      const result = await fn(tx);
      // For rejected, order.update should not be called
      expect(tx.order.update).not.toHaveBeenCalled();
      expect(tx.product.update).not.toHaveBeenCalled();
      return result;
    });

    await reviewRefundRequest(1, "rejected");
  });

  test("returns refundAmount equal to the order totalAmount", async () => {
    const { tx } = makeRefundTx();
    db.$transaction.mockImplementation(async (fn: Function) => fn(tx));

    const result = await reviewRefundRequest(1, "approved");

    expect(result.refundAmount).toBe(150);
  });
});

// ── updateOrderStatusByManager ────────────────────────────────────────────────

describe("updateOrderStatusByManager", () => {
  const processingOrder = {
    id: 5, userId: 1, status: "processing",
    totalAmount: 99, address: validAddress,
    invoiceNo: "INV-5", createdAt: new Date(),
    items: [], user: null,
  };

  test("throws 404 when order does not exist", async () => {
    db.order.findUnique.mockResolvedValue(null);
    await expect(updateOrderStatusByManager(999, "in_transit")).rejects.toThrow("Order not found");
  });

  test("transitions 'processing' → 'in_transit' successfully", async () => {
    db.order.findUnique.mockResolvedValue(processingOrder);
    db.order.update.mockResolvedValue({
      ...processingOrder, status: "in_transit", items: [],
    });

    const result = await updateOrderStatusByManager(5, "in_transit");
    expect(result.status).toBe("in_transit");
  });

  test("transitions 'in_transit' → 'delivered' successfully", async () => {
    const inTransitOrder = { ...processingOrder, status: "in_transit" };
    db.order.findUnique.mockResolvedValue(inTransitOrder);
    db.order.update.mockResolvedValue({
      ...inTransitOrder, status: "delivered", items: [],
    });

    const result = await updateOrderStatusByManager(5, "delivered");
    expect(result.status).toBe("delivered");
  });

  test("throws 400 for invalid transition: processing → delivered (skipping in_transit)", async () => {
    db.order.findUnique.mockResolvedValue(processingOrder);
    await expect(updateOrderStatusByManager(5, "delivered")).rejects.toThrow(
      "Cannot transition from 'processing' to 'delivered'"
    );
  });

  test("throws 400 for invalid transition: delivered → in_transit (backwards)", async () => {
    db.order.findUnique.mockResolvedValue({ ...processingOrder, status: "delivered" });
    await expect(updateOrderStatusByManager(5, "in_transit")).rejects.toThrow(
      "Cannot transition from 'delivered'"
    );
  });

  test("throws 400 for invalid transition: cancelled → in_transit", async () => {
    db.order.findUnique.mockResolvedValue({ ...processingOrder, status: "cancelled" });
    await expect(updateOrderStatusByManager(5, "in_transit")).rejects.toThrow(
      "Cannot transition"
    );
  });
});
