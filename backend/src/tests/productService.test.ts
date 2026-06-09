jest.mock("../config/db", () => ({
  __esModule: true,
  default: {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    wishlistItem: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../services/discountNotificationService", () => ({
  sendWishlistDiscountNotification: jest.fn().mockResolvedValue(null),
}));

import prisma from "../config/db";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateProductByManager,
} from "../services/productService";
import { sendWishlistDiscountNotification } from "../services/discountNotificationService";

const db = prisma as any;

const baseProduct = {
  id: 1,
  name: "Classic Shirt",
  description: "A nice shirt",
  price: 59.99,
  discount: 0,
  discountName: null,
  discountType: null,
  discountStartsAt: null,
  discountEndsAt: null,
  stockQty: 10,
  sku: "SHIRT-001",
  imageUrl: "",
  category: "Tops",
  model: "Classic",
  serialNumber: "SN-001",
  warrantyStatus: "1 year",
  distributorInfo: "Brand X",
  avgRating: 4.2,
  ratingCount: 5,
  isActive: true,
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── listProducts ──────────────────────────────────────────────────────────────

describe("listProducts", () => {
  test("excludes unpriced products by default (where.price.gt = 0)", async () => {
    db.category.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([baseProduct]);

    await listProducts({});

    const call = db.product.findMany.mock.calls[0][0];
    expect(call.where).toHaveProperty("price", { gt: 0 });
  });

  test("does not filter by price when includeUnpriced=true", async () => {
    db.product.findMany.mockResolvedValue([]);
    await listProducts({ includeUnpriced: true, includeInactive: true });

    const call = db.product.findMany.mock.calls[0][0];
    expect(call.where).not.toHaveProperty("price");
  });

  test("limits to isActive=true by default", async () => {
    db.category.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([]);

    await listProducts({});

    const call = db.product.findMany.mock.calls[0][0];
    expect(call.where).toHaveProperty("isActive", true);
  });

  test("returns empty array immediately when the requested category is hidden", async () => {
    db.category.findMany.mockResolvedValue([{ name: "Tops" }]);

    const result = await listProducts({ category: "Tops" });

    expect(result).toEqual([]);
    expect(db.product.findMany).not.toHaveBeenCalled();
  });

  test("excludes products in hidden categories via notIn when no category filter", async () => {
    db.category.findMany.mockResolvedValue([{ name: "Tops" }]);
    db.product.findMany.mockResolvedValue([]);

    await listProducts({});

    const call = db.product.findMany.mock.calls[0][0];
    expect(call.where.category).toMatchObject({ notIn: ["Tops"] });
  });

  test("sorts by price ascending when sort=price_asc", async () => {
    db.category.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([]);

    await listProducts({ sort: "price_asc" });

    const call = db.product.findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ price: "asc" });
  });

  test("sorts by price descending when sort=price_desc", async () => {
    db.category.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([]);

    await listProducts({ sort: "price_desc" });

    const call = db.product.findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ price: "desc" });
  });

  test("sorts by avgRating desc (then ratingCount, then createdAt) when sort=rating_desc", async () => {
    db.category.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([]);

    await listProducts({ sort: "rating_desc" });

    const call = db.product.findMany.mock.calls[0][0];
    expect(Array.isArray(call.orderBy)).toBe(true);
    expect(call.orderBy[0]).toEqual({ avgRating: "desc" });
    expect(call.orderBy[1]).toEqual({ ratingCount: "desc" });
  });

  test("filters by category when category query param is provided and not hidden", async () => {
    db.category.findMany.mockResolvedValue([]); // no hidden categories
    db.product.findMany.mockResolvedValue([]);

    await listProducts({ category: "Accessories" });

    const call = db.product.findMany.mock.calls[0][0];
    expect(call.where.category).toBe("Accessories");
  });

  test("formats returned products as plain numbers", async () => {
    db.category.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([{ ...baseProduct, price: "59.99", discount: "0" }]);

    const result = await listProducts({});

    expect(typeof result[0].price).toBe("number");
    expect(typeof result[0].discount).toBe("number");
  });
});

// ── getProduct ────────────────────────────────────────────────────────────────

describe("getProduct", () => {
  test("throws 404 when product does not exist", async () => {
    db.product.findUnique.mockResolvedValue(null);
    await expect(getProduct(999)).rejects.toThrow("Product not found");
  });

  test("returns a formatted product when found", async () => {
    db.product.findUnique.mockResolvedValue(baseProduct);
    const result = await getProduct(1);

    expect(result.id).toBe(1);
    expect(result.name).toBe("Classic Shirt");
    expect(result.serialNumber).toBe("SN-001");
    expect(result.sku).toBe("SHIRT-001");
    expect(result.warrantyStatus).toBe("1 year");
    expect(result.distributorInfo).toBe("Brand X");
  });
});

// ── createProduct ─────────────────────────────────────────────────────────────

describe("createProduct", () => {
  test("throws 409 when SKU already exists", async () => {
    db.product.findUnique
      .mockResolvedValueOnce(baseProduct) // sku lookup → found
      .mockResolvedValueOnce(null);        // serialNumber lookup → not found

    await expect(
      createProduct({ name: "New Shirt", sku: "SHIRT-001", serialNumber: "SN-999" })
    ).rejects.toThrow("SKU already exists");
  });

  test("throws 409 when serial number already exists", async () => {
    db.product.findUnique
      .mockResolvedValueOnce(null)          // sku lookup → not found
      .mockResolvedValueOnce(baseProduct);  // serialNumber lookup → found

    await expect(
      createProduct({ name: "New Shirt", sku: "SHIRT-NEW", serialNumber: "SN-001" })
    ).rejects.toThrow("Serial number already exists");
  });

  test("creates product with default warranty 'None' when not provided", async () => {
    db.product.findUnique.mockResolvedValue(null); // both checks pass
    const created = { ...baseProduct, warrantyStatus: "None" };
    db.product.create.mockResolvedValue(created);

    const result = await createProduct({ name: "Tee", sku: "TEE-001", serialNumber: "SN-100" });

    expect(db.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ warrantyStatus: "None" }),
      })
    );
    expect(result.warrantyStatus).toBe("None");
  });
});

// ── updateProduct (sales manager price / discount) ────────────────────────────

describe("updateProduct", () => {
  test("throws 404 when product does not exist", async () => {
    db.product.findUnique.mockResolvedValue(null);
    await expect(updateProduct(999, { price: 100 })).rejects.toThrow("Product not found");
  });

  test("throws 400 when price is negative", async () => {
    db.product.findUnique.mockResolvedValue(baseProduct);
    await expect(updateProduct(1, { price: -5 })).rejects.toThrow("Invalid price");
  });

  test("throws 400 when discount is negative", async () => {
    db.product.findUnique.mockResolvedValue(baseProduct);
    await expect(updateProduct(1, { discount: -10 })).rejects.toThrow("Invalid discount");
  });

  test("sends wishlist discount notification when discount first becomes active", async () => {
    db.product.findUnique.mockResolvedValue({ ...baseProduct, discount: 0 });
    db.product.update.mockResolvedValue({
      ...baseProduct,
      discount: 20,
      discountStartsAt: null,
      discountEndsAt: null,
    });
    db.wishlistItem.findMany.mockResolvedValue([
      {
        productId: 1,
        wishlist: { user: { id: 5, name: "Bob", email: "bob@test.com" } },
      },
    ]);

    await updateProduct(1, { discount: 20 });

    expect(sendWishlistDiscountNotification).toHaveBeenCalled();
  });

  test("does not send notification when updated discount is 0", async () => {
    db.product.findUnique.mockResolvedValue({ ...baseProduct, discount: 10 });
    db.product.update.mockResolvedValue({ ...baseProduct, discount: 0 });

    await updateProduct(1, { discount: 0 });

    expect(db.wishlistItem.findMany).not.toHaveBeenCalled();
    expect(sendWishlistDiscountNotification).not.toHaveBeenCalled();
  });
});

// ── updateProductByManager (product manager stock / metadata) ─────────────────

describe("updateProductByManager", () => {
  test("throws 404 when product does not exist", async () => {
    db.product.findUnique.mockResolvedValue(null);
    await expect(updateProductByManager(999, { stockQty: 5 })).rejects.toThrow("Product not found");
  });

  test("applies only the provided fields to the update", async () => {
    db.product.findUnique.mockResolvedValue(baseProduct);
    db.product.update.mockResolvedValue({ ...baseProduct, stockQty: 50 });

    const result = await updateProductByManager(1, { stockQty: 50 });

    expect(db.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stockQty: 50 } })
    );
    expect(result.stockQty).toBe(50);
  });

  test("can toggle isActive to false (soft-hide a product)", async () => {
    db.product.findUnique.mockResolvedValue(baseProduct);
    db.product.update.mockResolvedValue({ ...baseProduct, isActive: false });

    const result = await updateProductByManager(1, { isActive: false });

    expect(db.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
    expect(result.isActive).toBe(false);
  });
});
