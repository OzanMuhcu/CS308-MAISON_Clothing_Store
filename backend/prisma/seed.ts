import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

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
        imageUrl: "https://images.unsplash.com/photo-1638643391904-9b551ba91eaa?w=600&h=800&fit=crop",
        category: "Knitwear",
      },
      {
        name: "Denim Trucker Jacket",
        description: "Heavyweight selvedge denim jacket with copper rivets and tonal stitching. Raw unwashed finish that develops character over time.",
        price: 120.00,
        stockQty: 25,
        sku: "OC-DNM-005",
        imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=800&fit=crop",
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
      {
        name: "Cotton Pique Polo",
        description: "Classic polo shirt in heavyweight cotton pique. Mother-of-pearl buttons and ribbed collar that holds its shape wash after wash.",
        price: 55.00,
        stockQty: 0,
        sku: "SH-POL-007",
        imageUrl: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&h=800&fit=crop",
        category: "Shirts",
      },
      {
        name: "Leather Chelsea Boots",
        description: "Full-grain calf leather with a Goodyear-welted sole. Elastic side panels for easy on-off. Built to age beautifully over years of wear.",
        price: 245.00,
        stockQty: 15,
        sku: "FW-CHB-008",
        imageUrl: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&h=800&fit=crop",
        category: "Footwear",
      },
      {
        name: "Wool Blend Blazer",
        description: "Half-lined blazer in a refined wool-cotton blend. Notch lapel, patch pockets, and a natural shoulder for a modern yet timeless look.",
        price: 210.00,
        stockQty: 20,
        sku: "OC-BLZ-009",
        imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop",
        category: "Outerwear",
      },
      {
        name: "Brushed Flannel Shirt",
        description: "Double-brushed cotton flannel with a soft, substantial hand. Subtle windowpane check pattern. An essential for layered autumn looks.",
        price: 72.00,
        stockQty: 35,
        sku: "SH-FLN-010",
        imageUrl: "https://images.unsplash.com/photo-1604006852748-903fccbc4019?w=600&h=800&fit=crop",
        category: "Shirts",
      },
      {
        name: "Stretch Slim Jeans",
        description: "Japanese selvedge denim with 2% elastane for comfort. Slim through the leg with a clean dark indigo wash. Chain-stitched hem.",
        price: 89.00,
        stockQty: 50,
        sku: "TR-JNS-011",
        imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop",
        category: "Trousers",
      },
      {
        name: "Waxed Canvas Tote",
        description: "Durable waxed cotton canvas with vegetable-tanned leather handles. Brass hardware throughout. Spacious interior with internal zip pocket.",
        price: 45.00,
        stockQty: 60,
        sku: "AC-TOT-012",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop",
        category: "Accessories",
      },
    ],
  });

  const counts = await Promise.all([prisma.user.count(), prisma.product.count()]);
  console.log(`Seeded ${counts[0]} users, ${counts[1]} products.`);
  console.log("");
  console.log("Demo accounts (password: password123):");
  console.log("  customer@demo.com   (customer)");
  console.log("  sales@demo.com      (sales_manager)");
  console.log("  product@demo.com    (product_manager)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
