import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { sendWishlistDiscountNotification } from "./discountNotificationService";
import { isDiscountActive } from "./discountUtils";

function formatProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    discount: Number(p.discount ?? 0),
    discountName: p.discountName ?? null,
    discountType: p.discountType ?? null,
    discountStartsAt: p.discountStartsAt ? p.discountStartsAt.toISOString() : null,
    discountEndsAt: p.discountEndsAt ? p.discountEndsAt.toISOString() : null,
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
  };
}


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

  return products.map(formatProduct);
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, "Product not found");

  return formatProduct(product);
}

export async function getCategories() {
  const products = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return products.map((p: any) => p.category).filter(Boolean);
}

export async function updateProduct(
  id: number,
  data: {
    price?: number;
    discount?: number;
    discountName?: string | null;
    discountType?: string | null;
    discountStartsAt?: Date | null;
    discountEndsAt?: Date | null;
  }
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, "Product not found");

  const updateData: {
    price?: number;
    discount?: number;
    discountName?: string | null;
    discountType?: string | null;
    discountStartsAt?: Date | null;
    discountEndsAt?: Date | null;
  } = {};
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
  if (data.discountName !== undefined) {
    updateData.discountName = data.discountName;
  }
  if (data.discountType !== undefined) {
    updateData.discountType = data.discountType;
  }
  if (data.discountStartsAt !== undefined) {
    updateData.discountStartsAt = data.discountStartsAt;
  }
  if (data.discountEndsAt !== undefined) {
    updateData.discountEndsAt = data.discountEndsAt;
  }

  const updated = await prisma.product.update({ where: { id }, data: updateData });

  const prevDiscount = Number(product.discount ?? 0);
  const nextDiscount = Number(updated.discount ?? 0);
  const wasActive = isDiscountActive(prevDiscount, product.discountStartsAt, product.discountEndsAt);
  const isActive = isDiscountActive(nextDiscount, updated.discountStartsAt, updated.discountEndsAt);
  const discountChanged = prevDiscount !== nextDiscount;
  const becameActive = !wasActive && isActive;

  if ((discountChanged || becameActive) && isActive && nextDiscount > 0) {
    try {
      const wishlistHits = await prisma.wishlistItem.findMany({
        where: { productId: updated.id },
        include: { wishlist: { select: { user: { select: { id: true, name: true, email: true } } } } },
      });
      const recipients = new Map<number, { name: string; email: string }>();
      wishlistHits.forEach((hit) => {
        const user = hit.wishlist.user;
        if (user && !recipients.has(user.id)) {
          recipients.set(user.id, { name: user.name, email: user.email });
        }
      });
      await sendWishlistDiscountNotification(
        Array.from(recipients.values()),
        { name: updated.name, price: Number(updated.price), discount: nextDiscount },
        {
          name: updated.discountName,
          type: updated.discountType,
          startsAt: updated.discountStartsAt,
          endsAt: updated.discountEndsAt,
        }
      );
    } catch (err) {
      console.error("[Discount] Wishlist notification failed:", err);
    }
  }

  return formatProduct(updated);
}
