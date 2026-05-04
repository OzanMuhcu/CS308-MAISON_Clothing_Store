import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Stable Unsplash photo IDs — each verified to exist and match its product type.
// Format: https://images.unsplash.com/photo-{ID}?w=600&h=800&fit=crop&q=80
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&h=800&fit=crop&q=80`;

// Distributor strings per category
const DIST = {
  jackets:     "EuroFashion Imports Ltd. | trade@eurofashion.eu",
  shirts:      "Heritage Textile Co. | orders@heritagetextile.com",
  trousers:    "ModaLine Supply Group | wholesale@modaline.com",
  knitwear:    "Alpine Knitwear Distributors | sales@alpineknitwear.eu",
  footwear:    "SoleArt Europe B.V. | info@soleart.eu",
  accessories: "Finecraft Accessories Ltd. | orders@finecraft.co.uk",
};

// Warranty based on price tier: ≥$200 → 2 Years, ≥$100 → 1 Year, else None
const warranty = (price: number): string =>
  price >= 200 ? "2 Years" : price >= 100 ? "1 Year" : "None";

async function main() {
  console.log("Clearing existing data...");
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const hash = await bcrypt.hash("password123", 12);
  const customer = await prisma.user.create({
    data: { name: "Polat Canpolat", email: "customer@demo.com", passwordHash: hash, role: "customer" },
  });
  await prisma.user.createMany({
    data: [
      { name: "Sarah Keller",  email: "sales@demo.com",   passwordHash: hash, role: "sales_manager" },
      { name: "Peter Durand",  email: "product@demo.com", passwordHash: hash, role: "product_manager" },
    ],
  });

  console.log("Creating 42 products (6 categories × 7)...");
  await prisma.product.createMany({
    data: [
      // ── Jackets & Coats (7) ──
      {
        name: "Merino Wool Overcoat", sku: "JC-001", price: 289, stockQty: 12,
        description: "Double-breasted overcoat in Italian merino wool. Fully lined, tailored silhouette.",
        imageUrl: u("1539533018447-63fcce2678e3"), category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-001",
        warrantyStatus: warranty(289), distributorInfo: DIST.jackets,
      },
      {
        name: "Denim Trucker Jacket", sku: "JC-002", price: 120, stockQty: 22,
        description: "Heavyweight selvedge denim with copper rivets. Raw finish that develops character.",
        imageUrl: u("1576995853123-5a10305d93c0"), category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-002",
        warrantyStatus: warranty(120), distributorInfo: DIST.jackets,
      },
      {
        name: "Wool Blend Blazer", sku: "JC-003", price: 210, stockQty: 15,
        description: "Half-lined blazer in wool-cotton blend. Notch lapel, patch pockets, natural shoulder.",
        imageUrl: u("1507679799987-c73779587ccf"), category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-003",
        warrantyStatus: warranty(210), distributorInfo: DIST.jackets,
      },
      {
        name: "Quilted Field Jacket", sku: "JC-004", price: 175, stockQty: 3,
        description: "Diamond-quilted jacket with corduroy collar and brass snaps. Insulated, no bulk.",
        imageUrl: u("1591047139829-d91aecb6caea"), category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-004",
        warrantyStatus: warranty(175), distributorInfo: DIST.jackets,
      },
      {
        name: "Leather Biker Jacket", sku: "JC-005", price: 395, stockQty: 8,
        description: "Full-grain lamb leather, asymmetric zip. Satin-lined with zippered cuffs.",
        imageUrl: u("1521223890158-f9f7c3d5d504"), category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-005",
        warrantyStatus: warranty(395), distributorInfo: DIST.jackets,
      },
      {
        name: "Cotton Harrington Jacket", sku: "JC-006", price: 95, stockQty: 0,
        description: "Zip-front Harrington in washed cotton twill. Tartan-lined, elasticated cuffs.",
        imageUrl: u("1551028719-00167b16eac5"), category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-006",
        warrantyStatus: warranty(95), distributorInfo: DIST.jackets,
      },
      {
        // JC-007: image fixed (was duplicate of JC-004)
        name: "Waterproof Parka", sku: "JC-007", price: 245, stockQty: 14,
        description: "Seam-sealed technical parka with adjustable hood and fishtail hem.",
        imageUrl: u("1544923246-b08d4a42b1e7"), category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-007",
        warrantyStatus: warranty(245), distributorInfo: DIST.jackets,
      },

      // ── Shirts (7) ──
      {
        name: "Slim Fit Oxford Shirt", sku: "SH-001", price: 68, stockQty: 40,
        description: "Crisp cotton oxford, button-down collar. Garment-washed for softness.",
        imageUrl: u("1596755094514-f87e34085b2c"), category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-001",
        warrantyStatus: warranty(68), distributorInfo: DIST.shirts,
      },
      {
        name: "Brushed Flannel Shirt", sku: "SH-002", price: 72, stockQty: 28,
        description: "Double-brushed cotton flannel with subtle check. Essential for autumn layering.",
        imageUrl: u("1604006852748-903fccbc4019"), category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-002",
        warrantyStatus: warranty(72), distributorInfo: DIST.shirts,
      },
      {
        name: "Linen Camp Collar Shirt", sku: "SH-003", price: 78, stockQty: 18,
        description: "Relaxed camp collar in pure European linen. Boxy fit, warm-weather ease.",
        imageUrl: u("1602810318383-e386cc2a3ccf"), category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-003",
        warrantyStatus: warranty(78), distributorInfo: DIST.shirts,
      },
      {
        name: "Chambray Work Shirt", sku: "SH-004", price: 65, stockQty: 5,
        description: "Indigo-dyed chambray, double chest pockets, reinforced yoke.",
        imageUrl: u("1589310243389-96a5483213a8"), category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-004",
        warrantyStatus: warranty(65), distributorInfo: DIST.shirts,
      },
      {
        name: "Striped Poplin Dress Shirt", sku: "SH-005", price: 82, stockQty: 16,
        description: "Fine cotton poplin, French placket, spread collar. Tailored fit.",
        imageUrl: u("1563630423918-b58f07336ac9"), category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-005",
        warrantyStatus: warranty(82), distributorInfo: DIST.shirts,
      },
      {
        name: "Cotton Pique Polo", sku: "SH-006", price: 55, stockQty: 0,
        description: "Classic polo in heavyweight cotton pique. Mother-of-pearl buttons.",
        imageUrl: u("1586363104862-3a5e2ab60d99"), category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-006",
        warrantyStatus: warranty(55), distributorInfo: DIST.shirts,
      },
      {
        // SH-007: image fixed (was duplicate of SH-003)
        name: "Band Collar Linen Shirt", sku: "SH-007", price: 74, stockQty: 2,
        description: "Mandarin collar, garment-dyed linen. Minimalist with chest pocket.",
        imageUrl: u("1619785374836-5d62c9b44e4c"), category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-007",
        warrantyStatus: warranty(74), distributorInfo: DIST.shirts,
      },

      // ── Trousers (7) ──
      {
        name: "Relaxed Linen Trousers", sku: "TR-001", price: 95, stockQty: 25,
        description: "Pure-linen with relaxed drape. Elasticated drawstring waistband.",
        imageUrl: u("1624378439575-d8705ad7ae80"), category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-001",
        warrantyStatus: warranty(95), distributorInfo: DIST.trousers,
      },
      {
        name: "Tailored Chino Trousers", sku: "TR-002", price: 85, stockQty: 35,
        description: "Structured cotton twill chinos, tailored fit, clean ankle taper.",
        imageUrl: u("1473966968600-fa801b869a1a"), category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-002",
        warrantyStatus: warranty(85), distributorInfo: DIST.trousers,
      },
      {
        name: "Stretch Slim Jeans", sku: "TR-003", price: 89, stockQty: 45,
        description: "Japanese selvedge denim with 2% elastane. Dark indigo wash.",
        imageUrl: u("1542272604-787c3835535d"), category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-003",
        warrantyStatus: warranty(89), distributorInfo: DIST.trousers,
      },
      {
        name: "Corduroy Wide-Leg Trousers", sku: "TR-004", price: 98, stockQty: 12,
        description: "8-wale cotton corduroy, generous wide-leg. Double pleats, high rise.",
        imageUrl: u("1594938298603-c8148c4dae35"), category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-004",
        warrantyStatus: warranty(98), distributorInfo: DIST.trousers,
      },
      {
        name: "Wool Dress Trousers", sku: "TR-005", price: 135, stockQty: 0,
        description: "Tropical-weight wool, flat front, permanent crease. Half-lined.",
        imageUrl: u("1506629082955-511b1aa562c8"), category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-005",
        warrantyStatus: warranty(135), distributorInfo: DIST.trousers,
      },
      {
        name: "Cargo Utility Pants", sku: "TR-006", price: 79, stockQty: 20,
        description: "Relaxed cotton ripstop with six pockets. Washed for softness.",
        imageUrl: u("1517438476312-10d79c077509"), category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-006",
        warrantyStatus: warranty(79), distributorInfo: DIST.trousers,
      },
      {
        name: "Drawstring Jogger Trousers", sku: "TR-007", price: 62, stockQty: 30,
        description: "French terry cotton joggers with tapered leg. Ribbed ankle cuffs.",
        imageUrl: u("1552902865-b72c031ac5ea"), category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-007",
        warrantyStatus: warranty(62), distributorInfo: DIST.trousers,
      },

      // ── Knitwear (7) ──
      {
        name: "Cashmere Crew Sweater", sku: "KN-001", price: 195, stockQty: 10,
        description: "Pure Mongolian cashmere, classic crew-neck. Ribbed cuffs and hem.",
        imageUrl: u("1638643391904-9b551ba91eaa"), category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-001",
        warrantyStatus: warranty(195), distributorInfo: DIST.knitwear,
      },
      {
        // KN-002: image fixed (was duplicate of KN-001)
        name: "Merino V-Neck Sweater", sku: "KN-002", price: 110, stockQty: 24,
        description: "Fine-gauge merino wool V-neck. Layer over shirts or wear alone.",
        imageUrl: u("1511093959186-64d625a45b29"), category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-002",
        warrantyStatus: warranty(110), distributorInfo: DIST.knitwear,
      },
      {
        name: "Cable Knit Cardigan", sku: "KN-003", price: 145, stockQty: 4,
        description: "Heritage cable-knit in wool-cotton blend. Horn buttons, shawl collar.",
        imageUrl: u("1620799140408-edc6dcb6d633"), category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-003",
        warrantyStatus: warranty(145), distributorInfo: DIST.knitwear,
      },
      {
        name: "Cotton Rollneck", sku: "KN-004", price: 65, stockQty: 32,
        description: "Heavyweight cotton jersey rollneck. Clean, minimal layering piece.",
        imageUrl: u("1578587018452-892bacefd3f2"), category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-004",
        warrantyStatus: warranty(65), distributorInfo: DIST.knitwear,
      },
      {
        name: "Lambswool Fair Isle Sweater", sku: "KN-005", price: 125, stockQty: 0,
        description: "Traditional Fair Isle pattern in soft lambswool. Ribbed trim.",
        imageUrl: u("1583743814966-8936f5b7be1a"), category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-005",
        warrantyStatus: warranty(125), distributorInfo: DIST.knitwear,
      },
      {
        name: "Half-Zip Fleece Pullover", sku: "KN-006", price: 88, stockQty: 18,
        description: "Recycled polyester fleece with contrast half-zip. Chest pocket.",
        imageUrl: u("1556821840-3a63f95609a7"), category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-006",
        warrantyStatus: warranty(88), distributorInfo: DIST.knitwear,
      },
      {
        name: "Waffle Knit Henley", sku: "KN-007", price: 52, stockQty: 40,
        description: "Textured waffle-knit cotton with three-button henley placket.",
        imageUrl: u("1618354691373-d851c5c3a990"), category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-007",
        warrantyStatus: warranty(52), distributorInfo: DIST.knitwear,
      },

      // ── Footwear (7) ──
      {
        name: "Leather Chelsea Boots", sku: "FW-001", price: 245, stockQty: 15,
        description: "Full-grain calf leather, Goodyear-welted sole. Elastic side panels.",
        imageUrl: u("1638247025967-b4e38f787b76"), category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-001",
        warrantyStatus: warranty(245), distributorInfo: DIST.footwear,
      },
      {
        name: "Suede Desert Boots", sku: "FW-002", price: 160, stockQty: 20,
        description: "Unlined suede on crepe rubber sole. Warm sand colour.",
        imageUrl: u("1608256246200-53e635b5b65f"), category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-002",
        warrantyStatus: warranty(160), distributorInfo: DIST.footwear,
      },
      {
        name: "White Leather Sneakers", sku: "FW-003", price: 130, stockQty: 30,
        description: "Minimalist court sneaker in full-grain white leather. Cup-sole.",
        imageUrl: u("1600269452121-4f2416e55c28"), category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-003",
        warrantyStatus: warranty(130), distributorInfo: DIST.footwear,
      },
      {
        name: "Canvas Espadrilles", sku: "FW-004", price: 48, stockQty: 1,
        description: "Handmade jute-soled espadrilles in washed cotton canvas.",
        imageUrl: u("1460353581641-37baddab0fa2"), category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-004",
        warrantyStatus: warranty(48), distributorInfo: DIST.footwear,
      },
      {
        name: "Leather Penny Loafers", sku: "FW-005", price: 195, stockQty: 11,
        description: "Hand-sewn moccasin in polished calf leather. Blake-stitched sole.",
        imageUrl: u("1614252235316-8c857d38b5f4"), category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-005",
        warrantyStatus: warranty(195), distributorInfo: DIST.footwear,
      },
      {
        name: "Suede Low-Top Sneakers", sku: "FW-006", price: 115, stockQty: 0,
        description: "Italian suede upper with vulcanised rubber sole. Tonal laces.",
        imageUrl: u("1525966222134-fcfa99b8ae77"), category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-006",
        warrantyStatus: warranty(115), distributorInfo: DIST.footwear,
      },
      {
        // FW-007: image fixed (was duplicate of FW-001)
        name: "Leather Lace-Up Boots", sku: "FW-007", price: 220, stockQty: 9,
        description: "Oil-tanned leather with Vibram lug sole. Speed hooks at top.",
        imageUrl: u("1543163521-1bf539c55dd2"), category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-007",
        warrantyStatus: warranty(220), distributorInfo: DIST.footwear,
      },

      // ── Accessories (7) ──
      {
        name: "Waxed Canvas Tote", sku: "AC-001", price: 45, stockQty: 55,
        description: "Waxed cotton canvas, vegetable-tanned leather handles, brass hardware.",
        imageUrl: u("1553062407-98eeb64c6a62"), category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-001",
        warrantyStatus: warranty(45), distributorInfo: DIST.accessories,
      },
      {
        name: "Leather Belt", sku: "AC-002", price: 55, stockQty: 42,
        description: "Full-grain bridle leather, solid brass buckle. 35mm width.",
        imageUrl: u("1624222247344-550fb60583dc"), category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-002",
        warrantyStatus: warranty(55), distributorInfo: DIST.accessories,
      },
      {
        name: "Wool Scarf", sku: "AC-003", price: 38, stockQty: 50,
        description: "Brushed lambswool scarf in classic herringbone weave.",
        imageUrl: u("1520903920243-00d872a2d1c9"), category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-003",
        warrantyStatus: warranty(38), distributorInfo: DIST.accessories,
      },
      {
        name: "Leather Card Holder", sku: "AC-004", price: 28, stockQty: 0,
        description: "Slim vegetable-tanned leather card case. Three slots.",
        imageUrl: u("1627123424574-724758594e93"), category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-004",
        warrantyStatus: warranty(28), distributorInfo: DIST.accessories,
      },
      {
        name: "Silk Pocket Square", sku: "AC-005", price: 32, stockQty: 25,
        description: "Hand-rolled Italian silk with geometric print.",
        imageUrl: u("1598532163257-ae3c6b2524b6"), category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-005",
        warrantyStatus: warranty(32), distributorInfo: DIST.accessories,
      },
      {
        name: "Canvas Weekender Bag", sku: "AC-006", price: 85, stockQty: 14,
        description: "Roomy cotton canvas duffle with leather base and shoulder strap.",
        imageUrl: u("1542291026-7eec264c27ff"), category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-006",
        warrantyStatus: warranty(85), distributorInfo: DIST.accessories,
      },
      {
        name: "Knitted Beanie", sku: "AC-007", price: 25, stockQty: 60,
        description: "Ribbed merino wool beanie with a turn-up brim. One size.",
        imageUrl: u("1576871337622-98d48d1cf531"), category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-007",
        warrantyStatus: warranty(25), distributorInfo: DIST.accessories,
      },
    ],
  });

  // ── Sample orders for customer@demo.com ──
  console.log("Creating sample orders...");
  const addr = { fullName: "Polat Canpolat", line1: "123 Main St", line2: "", city: "Istanbul", postalCode: "34000", country: "Turkey" };

  const p1 = await prisma.product.findUnique({ where: { sku: "JC-001" } });
  const p2 = await prisma.product.findUnique({ where: { sku: "SH-001" } });
  const p3 = await prisma.product.findUnique({ where: { sku: "FW-003" } });
  const p4 = await prisma.product.findUnique({ where: { sku: "KN-001" } });
  const p5 = await prisma.product.findUnique({ where: { sku: "TR-002" } });

  if (p1 && p2 && p3 && p4 && p5) {
    // Order 1: delivered (enables reviews)
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: 487, status: "delivered", address: addr, invoiceNo: "INV-2026-001",
        createdAt: new Date("2026-04-10T14:00:00Z"),
        items: { create: [
          { productId: p1.id, productName: p1.name, unitPrice: Number(p1.price), quantity: 1, lineTotal: Number(p1.price) },
          { productId: p2.id, productName: p2.name, unitPrice: Number(p2.price), quantity: 2, lineTotal: Number(p2.price) * 2 },
          { productId: p3.id, productName: p3.name, unitPrice: Number(p3.price), quantity: 1, lineTotal: Number(p3.price) },
        ]},
      },
    });

    // Order 2: processing
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: 280, status: "processing", address: addr, invoiceNo: "INV-2026-002",
        createdAt: new Date("2026-04-18T10:30:00Z"),
        items: { create: [
          { productId: p4.id, productName: p4.name, unitPrice: Number(p4.price), quantity: 1, lineTotal: Number(p4.price) },
          { productId: p5.id, productName: p5.name, unitPrice: Number(p5.price), quantity: 1, lineTotal: Number(p5.price) },
        ]},
      },
    });

    // Order 3: in transit
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: 120, status: "in_transit", address: addr, invoiceNo: "INV-2026-003",
        createdAt: new Date("2026-04-22T16:00:00Z"),
        items: { create: [
          { productId: p2.id, productName: p2.name, unitPrice: Number(p2.price), quantity: 1, lineTotal: Number(p2.price) },
          { productId: p5.id, productName: p5.name, unitPrice: Number(p5.price), quantity: 1, lineTotal: Number(p5.price) },
        ]},
      },
    });
  }

  console.log("Creating sample wishlists...");
  const [w1, w2] = await prisma.$transaction([
    prisma.wishlist.create({ data: { userId: customer.id, name: "Favorites" } }),
    prisma.wishlist.create({ data: { userId: customer.id, name: "Spring Picks" } }),
  ]);

  const wishProducts = await prisma.product.findMany({
    where: { sku: { in: ["JC-001", "SH-003", "FW-004"] } },
  });

  if (wishProducts.length > 0) {
    await prisma.wishlistItem.createMany({
      data: wishProducts.map((p, idx) => ({
        wishlistId: idx % 2 === 0 ? w1.id : w2.id,
        productId: p.id,
      })),
    });
  }

  const counts = await Promise.all([prisma.user.count(), prisma.product.count(), prisma.order.count()]);
  console.log(`Seeded ${counts[0]} users, ${counts[1]} products, ${counts[2]} orders.`);
  console.log("\nAccounts (password: password123):");
  console.log("  customer@demo.com   (customer)");
  console.log("  sales@demo.com      (sales_manager)");
  console.log("  product@demo.com    (product_manager)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
