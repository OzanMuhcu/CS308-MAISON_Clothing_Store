import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

export async function listProducts(query: {
  search?: string;
  category?: string;
  sort?: string;
}) {
  const where: any = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.category) {
    where.category = query.category;
  }

  let orderBy: any = { createdAt: "desc" };
  if (query.sort === "price_asc") orderBy = { price: "asc" };
  else if (query.sort === "price_desc") orderBy = { price: "desc" };
  else if (query.sort === "name_asc") orderBy = { name: "asc" };
  else if (query.sort === "rating_desc") orderBy = { avgRating: "desc" };

  const products = await prisma.product.findMany({ where, orderBy });

  return products.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    discount: Number(p.discount ?? 0),
    stockQty: p.stockQty,
    sku: p.sku,
    imageUrl: p.imageUrl,
    category: p.category,
    model: p.model,
    serialNumber: p.serialNumber,
    warrantyStatus: p.warrantyStatus,
    distributorInfo: p.distributorInfo,
    avgRating: p.avgRating,
    ratingCount: p.ratingCount,
  }));
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, "Product not found");

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    discount: Number(product.discount ?? 0),
    stockQty: product.stockQty,
    sku: product.sku,
    imageUrl: product.imageUrl,
    category: product.category,
    model: product.model,
    serialNumber: product.serialNumber,
    warrantyStatus: product.warrantyStatus,
    distributorInfo: product.distributorInfo,
    avgRating: product.avgRating,
    ratingCount: product.ratingCount,
  };
}

export async function getCategories() {
  const products = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return products.map((p: any) => p.category).filter(Boolean);
}

export async function updateProduct(id: number, data: { price?: number; discount?: number }) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, "Product not found");

  const updateData: { price?: number; discount?: number } = {};
  if (typeof data.price === "number") {
    if (Number.isNaN(data.price) || data.price < 0) {
      throw new AppError(400, "Invalid price");
    }
    updateData.price = data.price;
  }
  if (typeof data.discount === "number") {
    if (Number.isNaN(data.discount) || data.discount < 0) {
      throw new AppError(400, "Invalid discount");
    }
    updateData.discount = data.discount;
  }

  const updated = await prisma.product.update({ where: { id }, data: updateData });
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    price: Number(updated.price),
    discount: Number(updated.discount ?? 0),
    stockQty: updated.stockQty,
    sku: updated.sku,
    imageUrl: updated.imageUrl,
    category: updated.category,
    model: updated.model,
    serialNumber: updated.serialNumber,
    warrantyStatus: updated.warrantyStatus,
    distributorInfo: updated.distributorInfo,
    avgRating: updated.avgRating,
    ratingCount: updated.ratingCount,
  };
}
