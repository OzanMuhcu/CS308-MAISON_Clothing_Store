import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Per-product ratings — each SKU gets a distinct average (all above 4)
const PRODUCT_RATINGS: Record<string, number[]> = {
  "JC-001": [5, 5, 5, 5, 5, 5, 5, 5, 5, 5], // avg 5.0
  "SH-001": [5, 5, 5, 5, 4, 5, 5, 5, 4, 5], // avg 4.8
  "TR-002": [5, 4, 5, 4, 5, 4, 5, 4, 5, 4], // avg 4.5
  "KN-001": [4, 4, 5, 4, 4, 5, 4, 4, 5, 4], // avg 4.3
  "FW-003": [4, 4, 4, 5, 4, 4, 4, 5, 4, 4], // avg 4.2
};

const TARGET_SKUS = Object.keys(PRODUCT_RATINGS);

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  // Create 10 rater users (upsert so safe to re-run)
  console.log("Upserting 10 rater users...");
  const raters = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return prisma.user.upsert({
        where: { email: `rater${n}@demo.com` },
        update: {},
        create: {
          name: `Rater ${n}`,
          email: `rater${n}@demo.com`,
          passwordHash: hash,
          role: "customer",
        },
      });
    })
  );

  // Fetch target products
  const products = await prisma.product.findMany({
    where: { sku: { in: TARGET_SKUS } },
  });

  if (products.length !== TARGET_SKUS.length) {
    console.error("Some products not found. Run the main seed first.");
    process.exit(1);
  }

  console.log("Creating ratings...");
  for (const product of products) {
    for (let i = 0; i < raters.length; i++) {
      const value = PRODUCT_RATINGS[product.sku][i];
      await prisma.rating.upsert({
        where: { userId_productId: { userId: raters[i].id, productId: product.id } },
        update: { value },
        create: { userId: raters[i].id, productId: product.id, value },
      });
    }

    // Recalculate and update product avg/count
    const agg = await prisma.rating.aggregate({
      where: { productId: product.id },
      _avg: { value: true },
      _count: { value: true },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        avgRating: agg._avg.value ?? 0,
        ratingCount: agg._count.value,
      },
    });

    console.log(
      `  ${product.name}: ${agg._count.value} ratings, avg ${agg._avg.value?.toFixed(1)}`
    );
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
