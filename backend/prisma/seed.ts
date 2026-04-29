import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Stable Unsplash photo IDs — each verified to exist and match its product type.
// Format: https://images.unsplash.com/photo-{ID}?w=600&h=800&fit=crop&q=80
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&h=800&fit=crop&q=80`;

async function main() {
  console.log("Clearing existing data...");
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.wishlistItem.deleteMany();
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
      { name: "Sarah Keller", email: "sales@demo.com", passwordHash: hash, role: "sales_manager" },
      { name: "Peter Durand", email: "product@demo.com", passwordHash: hash, role: "product_manager" },
    ],
  });

  console.log("Creating 42 products (6 categories × 7)...");
  await prisma.product.createMany({
    data: [
      // ── Jackets & Coats (7) ──
      { name: "Merino Wool Overcoat", description: "Double-breasted overcoat in Italian merino wool. Fully lined, tailored silhouette.", price: 289, stockQty: 12, sku: "JC-001", imageUrl: u("1539533018447-63fcce2678e3"), category: "Jackets & Coats" },
      { name: "Denim Trucker Jacket", description: "Heavyweight selvedge denim with copper rivets. Raw finish that develops character.", price: 120, stockQty: 22, sku: "JC-002", imageUrl: u("1576995853123-5a10305d93c0"), category: "Jackets & Coats" },
      { name: "Wool Blend Blazer", description: "Half-lined blazer in wool-cotton blend. Notch lapel, patch pockets, natural shoulder.", price: 210, stockQty: 15, sku: "JC-003", imageUrl: u("1507679799987-c73779587ccf"), category: "Jackets & Coats" },
      { name: "Quilted Field Jacket", description: "Diamond-quilted jacket with corduroy collar and brass snaps. Insulated, no bulk.", price: 175, stockQty: 3, sku: "JC-004", imageUrl: u("1591047139829-d91aecb6caea"), category: "Jackets & Coats" },
      { name: "Leather Biker Jacket", description: "Full-grain lamb leather, asymmetric zip. Satin-lined with zippered cuffs.", price: 395, stockQty: 8, sku: "JC-005", imageUrl: u("1521223890158-f9f7c3d5d504"), category: "Jackets & Coats" },
      { name: "Cotton Harrington Jacket", description: "Zip-front Harrington in washed cotton twill. Tartan-lined, elasticated cuffs.", price: 95, stockQty: 0, sku: "JC-006", imageUrl: u("1551028719-00167b16eac5"), category: "Jackets & Coats" },
      { name: "Waterproof Parka", description: "Seam-sealed technical parka with adjustable hood and fishtail hem.", price: 245, stockQty: 14, sku: "JC-007", imageUrl: u("1591047139829-d91aecb6caea"), category: "Jackets & Coats" },

      // ── Shirts (7) ──
      { name: "Slim Fit Oxford Shirt", description: "Crisp cotton oxford, button-down collar. Garment-washed for softness.", price: 68, stockQty: 40, sku: "SH-001", imageUrl: u("1596755094514-f87e34085b2c"), category: "Shirts" },
      { name: "Brushed Flannel Shirt", description: "Double-brushed cotton flannel with subtle check. Essential for autumn layering.", price: 72, stockQty: 28, sku: "SH-002", imageUrl: u("1604006852748-903fccbc4019"), category: "Shirts" },
      { name: "Linen Camp Collar Shirt", description: "Relaxed camp collar in pure European linen. Boxy fit, warm-weather ease.", price: 78, stockQty: 18, sku: "SH-003", imageUrl: u("1602810318383-e386cc2a3ccf"), category: "Shirts" },
      { name: "Chambray Work Shirt", description: "Indigo-dyed chambray, double chest pockets, reinforced yoke.", price: 65, stockQty: 5, sku: "SH-004", imageUrl: u("1589310243389-96a5483213a8"), category: "Shirts" },
      { name: "Striped Poplin Dress Shirt", description: "Fine cotton poplin, French placket, spread collar. Tailored fit.", price: 82, stockQty: 16, sku: "SH-005", imageUrl: u("1563630423918-b58f07336ac9"), category: "Shirts" },
      { name: "Cotton Pique Polo", description: "Classic polo in heavyweight cotton pique. Mother-of-pearl buttons.", price: 55, stockQty: 0, sku: "SH-006", imageUrl: u("1586363104862-3a5e2ab60d99"), category: "Shirts" },
      { name: "Band Collar Linen Shirt", description: "Mandarin collar, garment-dyed linen. Minimalist with chest pocket.", price: 74, stockQty: 2, sku: "SH-007", imageUrl: u("1602810318383-e386cc2a3ccf"), category: "Shirts" },

      // ── Trousers (7) ──
      { name: "Relaxed Linen Trousers", description: "Pure-linen with relaxed drape. Elasticated drawstring waistband.", price: 95, stockQty: 25, sku: "TR-001", imageUrl: u("1624378439575-d8705ad7ae80"), category: "Trousers" },
      { name: "Tailored Chino Trousers", description: "Structured cotton twill chinos, tailored fit, clean ankle taper.", price: 85, stockQty: 35, sku: "TR-002", imageUrl: u("1473966968600-fa801b869a1a"), category: "Trousers" },
      { name: "Stretch Slim Jeans", description: "Japanese selvedge denim with 2% elastane. Dark indigo wash.", price: 89, stockQty: 45, sku: "TR-003", imageUrl: u("1542272604-787c3835535d"), category: "Trousers" },
      { name: "Corduroy Wide-Leg Trousers", description: "8-wale cotton corduroy, generous wide-leg. Double pleats, high rise.", price: 98, stockQty: 12, sku: "TR-004", imageUrl: u("1594938298603-c8148c4dae35"), category: "Trousers" },
      { name: "Wool Dress Trousers", description: "Tropical-weight wool, flat front, permanent crease. Half-lined.", price: 135, stockQty: 0, sku: "TR-005", imageUrl: u("1506629082955-511b1aa562c8"), category: "Trousers" },
      { name: "Cargo Utility Pants", description: "Relaxed cotton ripstop with six pockets. Washed for softness.", price: 79, stockQty: 20, sku: "TR-006", imageUrl: u("1517438476312-10d79c077509"), category: "Trousers" },
      { name: "Drawstring Jogger Trousers", description: "French terry cotton joggers with tapered leg. Ribbed ankle cuffs.", price: 62, stockQty: 30, sku: "TR-007", imageUrl: u("1552902865-b72c031ac5ea"), category: "Trousers" },

      // ── Knitwear (7) ──
      { name: "Cashmere Crew Sweater", description: "Pure Mongolian cashmere, classic crew-neck. Ribbed cuffs and hem.", price: 195, stockQty: 10, sku: "KN-001", imageUrl: u("1638643391904-9b551ba91eaa"), category: "Knitwear" },
      { name: "Merino V-Neck Sweater", description: "Fine-gauge merino wool V-neck. Layer over shirts or wear alone.", price: 110, stockQty: 24, sku: "KN-002", imageUrl: u("1638643391904-9b551ba91eaa"), category: "Knitwear" },
      { name: "Cable Knit Cardigan", description: "Heritage cable-knit in wool-cotton blend. Horn buttons, shawl collar.", price: 145, stockQty: 4, sku: "KN-003", imageUrl: u("1620799140408-edc6dcb6d633"), category: "Knitwear" },
      { name: "Cotton Rollneck", description: "Heavyweight cotton jersey rollneck. Clean, minimal layering piece.", price: 65, stockQty: 32, sku: "KN-004", imageUrl: u("1578587018452-892bacefd3f2"), category: "Knitwear" },
      { name: "Lambswool Fair Isle Sweater", description: "Traditional Fair Isle pattern in soft lambswool. Ribbed trim.", price: 125, stockQty: 0, sku: "KN-005", imageUrl: u("1583743814966-8936f5b7be1a"), category: "Knitwear" },
      { name: "Half-Zip Fleece Pullover", description: "Recycled polyester fleece with contrast half-zip. Chest pocket.", price: 88, stockQty: 18, sku: "KN-006", imageUrl: u("1556821840-3a63f95609a7"), category: "Knitwear" },
      { name: "Waffle Knit Henley", description: "Textured waffle-knit cotton with three-button henley placket.", price: 52, stockQty: 40, sku: "KN-007", imageUrl: u("1618354691373-d851c5c3a990"), category: "Knitwear" },

      // ── Footwear (7) ──
      { name: "Leather Chelsea Boots", description: "Full-grain calf leather, Goodyear-welted sole. Elastic side panels.", price: 245, stockQty: 15, sku: "FW-001", imageUrl: u("1638247025967-b4e38f787b76"), category: "Footwear" },
      { name: "Suede Desert Boots", description: "Unlined suede on crepe rubber sole. Warm sand colour.", price: 160, stockQty: 20, sku: "FW-002", imageUrl: u("1608256246200-53e635b5b65f"), category: "Footwear" },
      { name: "White Leather Sneakers", description: "Minimalist court sneaker in full-grain white leather. Cup-sole.", price: 130, stockQty: 30, sku: "FW-003", imageUrl: u("1600269452121-4f2416e55c28"), category: "Footwear" },
      { name: "Canvas Espadrilles", description: "Handmade jute-soled espadrilles in washed cotton canvas.", price: 48, stockQty: 1, sku: "FW-004", imageUrl: u("1460353581641-37baddab0fa2"), category: "Footwear" },
      { name: "Leather Penny Loafers", description: "Hand-sewn moccasin in polished calf leather. Blake-stitched sole.", price: 195, stockQty: 11, sku: "FW-005", imageUrl: u("1614252235316-8c857d38b5f4"), category: "Footwear" },
      { name: "Suede Low-Top Sneakers", description: "Italian suede upper with vulcanised rubber sole. Tonal laces.", price: 115, stockQty: 0, sku: "FW-006", imageUrl: u("1525966222134-fcfa99b8ae77"), category: "Footwear" },
      { name: "Leather Lace-Up Boots", description: "Oil-tanned leather with Vibram lug sole. Speed hooks at top.", price: 220, stockQty: 9, sku: "FW-007", imageUrl: u("1638247025967-b4e38f787b76"), category: "Footwear" },

      // ── Accessories (7) ──
      { name: "Waxed Canvas Tote", description: "Waxed cotton canvas, vegetable-tanned leather handles, brass hardware.", price: 45, stockQty: 55, sku: "AC-001", imageUrl: u("1553062407-98eeb64c6a62"), category: "Accessories" },
      { name: "Leather Belt", description: "Full-grain bridle leather, solid brass buckle. 35mm width.", price: 55, stockQty: 42, sku: "AC-002", imageUrl: u("1624222247344-550fb60583dc"), category: "Accessories" },
      { name: "Wool Scarf", description: "Brushed lambswool scarf in classic herringbone weave.", price: 38, stockQty: 50, sku: "AC-003", imageUrl: u("1520903920243-00d872a2d1c9"), category: "Accessories" },
      { name: "Leather Card Holder", description: "Slim vegetable-tanned leather card case. Three slots.", price: 28, stockQty: 0, sku: "AC-004", imageUrl: u("1627123424574-724758594e93"), category: "Accessories" },
      { name: "Silk Pocket Square", description: "Hand-rolled Italian silk with geometric print.", price: 32, stockQty: 25, sku: "AC-005", imageUrl: u("1598532163257-ae3c6b2524b6"), category: "Accessories" },
      { name: "Canvas Weekender Bag", description: "Roomy cotton canvas duffle with leather base and shoulder strap.", price: 85, stockQty: 14, sku: "AC-006", imageUrl: u("1542291026-7eec264c27ff"), category: "Accessories" },
      { name: "Knitted Beanie", description: "Ribbed merino wool beanie with a turn-up brim. One size.", price: 25, stockQty: 60, sku: "AC-007", imageUrl: u("1576871337622-98d48d1cf531"), category: "Accessories" },
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

    // Order 3: confirmed
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: 120, status: "confirmed", address: addr, invoiceNo: "INV-2026-003",
        createdAt: new Date("2026-04-22T16:00:00Z"),
        items: { create: [
          { productId: p2.id, productName: p2.name, unitPrice: Number(p2.price), quantity: 1, lineTotal: Number(p2.price) },
          { productId: p5.id, productName: p5.name, unitPrice: Number(p5.price), quantity: 1, lineTotal: Number(p5.price) },
        ]},
      },
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
