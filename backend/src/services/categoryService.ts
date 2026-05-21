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

// List visible categories (storefront + PM admin shared view).
export async function listVisibleCategories() {
  const categories = await prisma.category.findMany({
    where: { hidden: false },
    orderBy: { name: "asc" },
  });
  return categories.map(formatCategory);
}

export async function createCategory(rawName: string) {
  const name = rawName.trim();
  if (!name) throw new AppError(400, "Category name is required");
  if (name.length > 60) throw new AppError(400, "Category name is too long");

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    // If it had been hidden, un-hide so PM can re-introduce a removed category.
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

// Soft-remove: mark hidden=true so products that still reference the name by
// string keep their data but disappear from the storefront.
export async function hideCategory(id: number) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Category not found");
  const updated = await prisma.category.update({
    where: { id },
    data: { hidden: true },
  });
  return formatCategory(updated);
}
