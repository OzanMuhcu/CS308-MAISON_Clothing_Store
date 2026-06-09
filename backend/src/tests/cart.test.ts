jest.mock("../config/db", () => ({
  __esModule: true,
  default: {
    cartItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from "../config/db";
import {
  addToCart,
  updateCartItem,
  removeCartItem,
  syncCart,
  addToCartSchema,
  syncCartSchema,
} from "../services/cartService";

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Schema tests ──────────────────────────────────────────────────────────────

describe("addToCartSchema", () => {
  test("accepts valid input", () => {
    expect(addToCartSchema.safeParse({ productId: 1, quantity: 2 }).success).toBe(true);
  });

  test("rejects quantity of zero", () => {
    expect(addToCartSchema.safeParse({ productId: 1, quantity: 0 }).success).toBe(false);
  });

  test("rejects non-positive productId", () => {
    expect(addToCartSchema.safeParse({ productId: -1, quantity: 1 }).success).toBe(false);
  });
});

describe("syncCartSchema", () => {
  test("accepts valid items array", () => {
    const result = syncCartSchema.safeParse({
      items: [{ productId: 1, quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  test("rejects items array containing zero quantity", () => {
    const result = syncCartSchema.safeParse({
      items: [{ productId: 1, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

// ── addToCart service ─────────────────────────────────────────────────────────

describe("addToCart", () => {
  const product = {
    id: 1,
    name: "Classic Shirt",
    price: 49.99,
    stockQty: 10,
    sku: "S001",
    imageUrl: "",
    category: "tops",
  };

  test("throws 404 when product does not exist", async () => {
    db.product.findUnique.mockResolvedValue(null);
    await expect(addToCart(1, 1, 1)).rejects.toThrow("Product not found");
  });

  test("throws 400 when product is out of stock", async () => {
    db.product.findUnique.mockResolvedValue({ ...product, stockQty: 0 });
    await expect(addToCart(1, 1, 1)).rejects.toThrow("out of stock");
  });

  test("throws 400 when requested quantity exceeds available stock", async () => {
    db.product.findUnique.mockResolvedValue({ ...product, stockQty: 3 });
    db.cartItem.findUnique.mockResolvedValue(null);
    await expect(addToCart(1, 1, 5)).rejects.toThrow("Only 3 units available");
  });

  test("creates a new cart item when product is not yet in cart", async () => {
    db.product.findUnique.mockResolvedValue(product);
    db.cartItem.findUnique.mockResolvedValue(null);
    db.cartItem.create.mockResolvedValue({ id: 1, userId: 1, productId: 1, quantity: 2, product });

    const result = await addToCart(1, 1, 2);

    expect(db.cartItem.create).toHaveBeenCalled();
    expect(result.quantity).toBe(2);
  });

  test("upserts quantity when product is already in cart", async () => {
    const existingItem = { id: 5, userId: 1, productId: 1, quantity: 3, product };
    db.product.findUnique.mockResolvedValue(product);
    db.cartItem.findUnique.mockResolvedValue(existingItem);
    db.cartItem.update.mockResolvedValue({ ...existingItem, quantity: 5, product });

    const result = await addToCart(1, 1, 2);

    expect(db.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: 5 } })
    );
    expect(result.quantity).toBe(5);
  });
});

// ── updateCartItem service ────────────────────────────────────────────────────

describe("updateCartItem", () => {
  test("throws 404 when item does not exist", async () => {
    db.cartItem.findUnique.mockResolvedValue(null);
    await expect(updateCartItem(1, 999, 2)).rejects.toThrow("Cart item not found");
  });
});

// ── removeCartItem service ────────────────────────────────────────────────────

describe("removeCartItem", () => {
  test("throws 404 when item belongs to a different user", async () => {
    db.cartItem.findUnique.mockResolvedValue({ id: 1, userId: 2 });
    await expect(removeCartItem(1, 1)).rejects.toThrow("Cart item not found");
  });
});

// ── updateCartItem service — stock guard ──────────────────────────────────────

describe("updateCartItem (stock guard)", () => {
  test("throws 400 when new quantity exceeds available stock", async () => {
    db.cartItem.findUnique.mockResolvedValue({
      id: 7, userId: 1, productId: 1, quantity: 2,
      product: { stockQty: 3 },
    });
    await expect(updateCartItem(1, 7, 5)).rejects.toThrow("Only 3 units available");
  });
});

// ── syncCart service ──────────────────────────────────────────────────────────

describe("syncCart", () => {
  test("skips out-of-stock products without creating or updating", async () => {
    db.product.findUnique.mockResolvedValue({ id: 1, stockQty: 0 });
    db.cartItem.findMany.mockResolvedValue([]);

    await syncCart(1, [{ productId: 1, quantity: 2 }]);

    expect(db.cartItem.create).not.toHaveBeenCalled();
    expect(db.cartItem.update).not.toHaveBeenCalled();
  });

  test("creates a new cart item when product is in stock and not already in cart", async () => {
    db.product.findUnique.mockResolvedValue({ id: 2, stockQty: 10, name: "Jacket", price: 120, sku: "J001", imageUrl: "" });
    db.cartItem.findUnique.mockResolvedValue(null); // not in cart yet
    db.cartItem.create.mockResolvedValue({ id: 9, userId: 1, productId: 2, quantity: 3 });
    db.cartItem.findMany.mockResolvedValue([]); // getCart stub

    await syncCart(1, [{ productId: 2, quantity: 3 }]);

    expect(db.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ productId: 2, quantity: 3 }) })
    );
  });

  test("merges into existing item and caps merged quantity at stock", async () => {
    const product = { id: 3, stockQty: 5, name: "Hat", price: 30, sku: "H001", imageUrl: "" };
    db.product.findUnique.mockResolvedValue(product);
    db.cartItem.findUnique.mockResolvedValue({ id: 11, userId: 1, productId: 3, quantity: 4 });
    db.cartItem.update.mockResolvedValue({ id: 11, userId: 1, productId: 3, quantity: 5 });
    db.cartItem.findMany.mockResolvedValue([]); // getCart stub

    // request 3 more (4 existing + 3 = 7, but stockQty = 5, so merged = 5)
    await syncCart(1, [{ productId: 3, quantity: 3 }]);

    expect(db.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: 5 } })
    );
  });
});

// ── clearCart service ─────────────────────────────────────────────────────────

describe("clearCart", () => {
  test("calls cartItem.deleteMany for the given userId", async () => {
    db.cartItem.deleteMany.mockResolvedValue({ count: 3 });
    const { clearCart } = require("../services/cartService");
    await clearCart(1);
    expect(db.cartItem.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
  });
});
