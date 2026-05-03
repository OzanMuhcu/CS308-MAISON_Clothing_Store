jest.mock("../config/db", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { z } from "zod";
import prisma from "../config/db";
import { createOrder, getOrder, listOrders } from "../services/orderService";

const db = prisma as any;

// Address schema is defined inline in the orders route — recreated here to test it.
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
});

// ── createOrder service ───────────────────────────────────────────────────────

describe("createOrder", () => {
  test("throws AppError 400 when cart is empty", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        cartItem: { findMany: jest.fn().mockResolvedValue([]) },
      };
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
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 1, name: "Slim Trousers", price: 79.99, stockQty: 3 }),
        },
      };
      return fn(tx);
    });

    await expect(createOrder(1, validAddress)).rejects.toThrow("Insufficient stock");
  });

  test("created order has invoiceNo starting with INV-", async () => {
    db.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        cartItem: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, productId: 1, quantity: 2 }]),
          deleteMany: jest.fn().mockResolvedValue({}),
        },
        product: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 1, name: "Classic Shirt", price: 49.99, stockQty: 10 }),
          update: jest.fn().mockResolvedValue({}),
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
});

// ── getOrder service ──────────────────────────────────────────────────────────

describe("getOrder", () => {
  test("throws AppError 404 when order does not exist", async () => {
    db.order.findUnique.mockResolvedValue(null);
    await expect(getOrder(1, 999)).rejects.toThrow("Order not found");
  });

  test("throws AppError 403 when order belongs to a different user", async () => {
    db.order.findUnique.mockResolvedValue({
      id: 1,
      userId: 2,
      totalAmount: 100,
      status: "processing",
      address: {},
      invoiceNo: "INV-001",
      createdAt: new Date(),
      items: [],
      user: null,
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
