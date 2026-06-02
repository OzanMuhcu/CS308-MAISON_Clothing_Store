jest.mock("../config/db", () => ({
  __esModule: true,
  default: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import prisma from "../config/db";
import { listAllCategories, createCategory, hideCategory } from "../services/categoryService";

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createCategory", () => {
  test("restores a previously hidden category instead of creating a duplicate", async () => {
    db.category.findUnique.mockResolvedValue({
      id: 2,
      name: "Shoes",
      hidden: true,
    });
    db.category.update.mockResolvedValue({
      id: 2,
      name: "Shoes",
      hidden: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createCategory("Shoes");

    expect(db.category.findUnique).toHaveBeenCalledWith({ where: { name: "Shoes" } });
    expect(db.category.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { hidden: false },
    });
    expect(result).toEqual({
      id: 2,
      name: "Shoes",
      hidden: false,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});

describe("listAllCategories", () => {
  test("syncs existing product category names into the category table and returns them for management", async () => {
    const existingCategories = [
      { id: 1, name: "Shoes", hidden: false, createdAt: new Date(), updatedAt: new Date() },
    ];
    const productCategories = [
      { category: "Shoes" },
      { category: "Bags" },
    ];
    const syncedCategories = [
      { id: 1, name: "Shoes", hidden: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "Bags", hidden: false, createdAt: new Date(), updatedAt: new Date() },
    ];

    db.category.findMany
      .mockResolvedValueOnce(existingCategories)
      .mockResolvedValueOnce(syncedCategories);
    db.product.findMany.mockResolvedValue(productCategories);
    db.category.createMany.mockResolvedValue({ count: 1 });

    const result = await listAllCategories();

    expect(db.product.findMany).toHaveBeenCalledWith({
      where: { category: { not: "" } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    expect(db.category.createMany).toHaveBeenCalledWith({
      data: [{ name: "Bags" }],
      skipDuplicates: true,
    });
    expect(result).toEqual([
      { id: 1, name: "Shoes", hidden: false, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      { id: 2, name: "Bags", hidden: false, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
    ]);
  });
});

describe("hideCategory", () => {
  test("marks the category hidden and removes active products in that category", async () => {
    db.category.findUnique.mockResolvedValue({
      id: 1,
      name: "Shoes",
      hidden: false,
    });
    db.category.update.mockResolvedValue({
      id: 1,
      name: "Shoes",
      hidden: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    db.product.updateMany.mockResolvedValue({ count: 2 });

    await hideCategory(1);

    expect(db.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { hidden: true },
    });
    expect(db.product.updateMany).toHaveBeenCalledWith({
      where: { category: "Shoes", isActive: true },
      data: { isActive: false },
    });
  });
});
