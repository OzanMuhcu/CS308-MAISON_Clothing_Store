import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  // OrderItem ve Order tablolarını da temizleyelim ki hata vermesin
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.cartItem.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  console.log("Creating demo users...");
  const hash = await bcrypt.hash("password123", 12);

  await prisma.user.createMany({
    data: [
      { name: "Demo Customer", email: "customer@demo.com", passwordHash: hash, role: "customer" },
      { name: "Sales Manager", email: "sales@demo.com", passwordHash: hash, role: "sales_manager" },
      { name: "Product Manager", email: "product@demo.com", passwordHash: hash, role: "product_manager" },
    ],
  });

  console.log("Creating products...");
  await prisma.product.createMany({
    data: [
      {
        name: "Merino Wool Overcoat",
        description: "A timeless double-breasted overcoat crafted from Italian merino wool. Fully lined with a tailored silhouette that pairs effortlessly with both formal and casual looks.",
        price: 289.00,
        stockQty: 12,
        sku: "OC-MRN-001",
        imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=800&fit=crop",
        category: "Outerwear",
      },
      {
        name: "Slim Fit Oxford Shirt",
        description: "Crisp cotton oxford with a clean button-down collar. Garment-washed for a soft hand feel. A wardrobe essential that transitions from office to weekend.",
        price: 68.00,
        stockQty: 45,
        sku: "SH-OXF-002",
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop",
        category: "Shirts",
      },
      {
        name: "Relaxed Linen Trousers",
        description: "Breathable pure-linen trousers with a relaxed drape. Elasticated waistband with drawstring for comfort. Ideal for warmer months.",
        price: 95.00,
        stockQty: 30,
        sku: "TR-LIN-003",
        imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop",
        category: "Trousers",
      },
      {
        name: "Cashmere Crew Sweater",
        description: "Pure Mongolian cashmere knitted into a classic crew-neck silhouette. Ribbed cuffs and hem. The definitive luxury layering piece.",
        price: 195.00,
        stockQty: 18,
        sku: "KN-CSH-004",
        // ESKİ LİNKİ SİL, BUNU YAPIŞTIR:
        imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop",
        category: "Knitwear",
      },
// ... diğer kodlar
      {
        name: "Denim Trucker Jacket",
        description: "Heavyweight selvedge denim jacket with copper rivets and tonal stitching. Raw unwashed finish that develops character over time.",
        price: 120.00,
        stockQty: 25,
        sku: "OC-DNM-005",
        imageUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=600&h=800&fit=crop",
        category: "Outerwear",
      },
      {
        name: "Tailored Chino Trousers",
        description: "Structured cotton twill chinos with a tailored fit through the thigh and a clean taper to the ankle. Versatile enough for any occasion.",
        price: 85.00,
        stockQty: 40,
        sku: "TR-CHN-006",
        imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop",
        category: "Trousers",
      },
    ],
  });

  const counts = await Promise.all([prisma.user.count(), prisma.product.count()]);
  console.log(`Seeded ${counts[0]} users, ${counts[1]} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    // process hatasını engellemek için doğrudan 1 ile çıkış yapıyoruz
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
