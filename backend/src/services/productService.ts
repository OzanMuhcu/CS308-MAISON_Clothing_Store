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

  const products = await prisma.product.findMany({ where, orderBy });

  return products.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    stockQty: p.stockQty,
    sku: p.sku,
    imageUrl: p.imageUrl,
    category: p.category,
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
    stockQty: product.stockQty,
    sku: product.sku,
    imageUrl: product.imageUrl,
    category: product.category,
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
