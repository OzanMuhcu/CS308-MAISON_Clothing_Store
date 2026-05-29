import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

function formatCategory(c: any) {
  return {
    id: c.id,
    name: c.name,
    hidden: c.hidden,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// List visible (non-hidden) categories for storefront filters.
export async function listVisibleCategories() {
  const categories = await prisma.category.findMany({
    where: { hidden: false },
    orderBy: { name: "asc" },
  });
  return categories.map(formatCategory);
}

// List all categories, including hidden ones, for product manager management.
// Seed any category names already used by products so existing categories are
// visible in the PM list and duplicate adds are rejected.
export async function listAllCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  const existingNames = new Set(categories.map((c: any) => c.name.trim()));
  const productCategories = await prisma.product.findMany({
    where: { category: { not: "" } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  const missing = productCategories
    .map((p: any) => p.category?.trim())
    .filter((category: string | undefined) => Boolean(category) && !existingNames.has(category))
    .map((category: string) => ({ name: category }));

  if (missing.length > 0) {
    await prisma.category.createMany({
      data: missing,
      skipDuplicates: true,
    });
  }

  const syncedCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return syncedCategories.map(formatCategory);
}

export async function createCategory(rawName: string) {
  const name = rawName.trim();
  if (!name) throw new AppError(400, "Category name is required");
  if (name.length > 60) throw new AppError(400, "Category name is too long");

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    // If the same name was previously soft-removed, un-hide it instead of
    // erroring — PMs frequently want to re-introduce a removed category.
    if (existing.hidden) {
      const restored = await prisma.category.update({
        where: { id: existing.id },
        data: { hidden: false },
      });
      return formatCategory(restored);
    }
    throw new AppError(409, "Category with that name already exists");
  }

  const created = await prisma.category.create({ data: { name } });
  return formatCategory(created);
}

// Soft-remove: mark hidden=true and hide all products in that category from
// the storefront so the product manager can restore them individually.
export async function hideCategory(id: number) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Category not found");
  const updated = await prisma.category.update({
    where: { id },
    data: { hidden: true },
  });
  await prisma.product.updateMany({
    where: { category: existing.name, isActive: true },
    data: { isActive: false },
  });
  return formatCategory(updated);
}
