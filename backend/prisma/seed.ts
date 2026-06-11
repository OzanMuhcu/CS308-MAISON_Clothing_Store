import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Unsplash direct photo CDN links — format: photo-{ID}?w=600&h=800&fit=crop&q=80
// Each ID is curated to match the product's category. To verify or replace an image,
// visit: https://unsplash.com/photos/{ID}
// Maintainability: one ID per product, grouped by category below.
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
  await prisma.refundRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const hash = await bcrypt.hash("password123", 12);
  // Demo customer — email set to presenter's real address so invoice/notification emails are received live
  const customer = await prisma.user.create({
    data: { name: "Polat Canpolat", email: "esat.celebioglu@sabanciuniv.edu", passwordHash: hash, role: "customer", taxId: "TR-1234567890" },
  });
  await prisma.user.createMany({
    data: [
      { name: "Sarah Keller",  email: "sales@demo.com",   passwordHash: hash, role: "sales_manager",    taxId: "TR-9876543210" },
      { name: "Peter Durand",  email: "product@demo.com", passwordHash: hash, role: "product_manager",  taxId: "TR-5678901234" },
    ],
  });

  // Seed a home address for the customer (shown in Account page and compared with PM delivery list)
  await prisma.userAddress.create({
    data: {
      userId: customer.id,
      label: "Home",
      fullName: "Polat Canpolat",
      line1: "123 Main St",
      line2: "",
      city: "Istanbul",
      postalCode: "34000",
      country: "Turkey",
    },
  });

  console.log("Creating 42 products (6 categories × 7)...");
  await prisma.product.createMany({
    data: [
      // ── Jackets & Coats (7) ──
      {
        // Demo label (E): appears in Order 1 (delivered > 1 month). Rate/comment target.
        name: "Merino Wool Overcoat (E)", sku: "JC-001", price: 289, stockQty: 12,
        description: "Double-breasted overcoat in Italian merino wool. Fully lined, tailored silhouette.",
        imageUrl: "https://images.unsplash.com/photo-1638109879135-285a7b8b5924?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxNZXJpbm8lMjBXb29sJTIwT3ZlcmNvYXR8ZW58MHx8fHwxNzc4MDYzOTkyfDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-001",
        warrantyStatus: warranty(289), distributorInfo: DIST.jackets,
      },
      {
        name: "Denim Trucker Jacket", sku: "JC-002", price: 120, stockQty: 22,
        description: "Heavyweight selvedge denim with copper rivets. Raw finish that develops character.",
        imageUrl: "https://images.unsplash.com/photo-1578100044626-110806c15b00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxEZW5pbSUyMFRydWNrZXIlMjBKYWNrZXR8ZW58MHx8fHwxNzc4MDYzOTk0fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-002",
        warrantyStatus: warranty(120), distributorInfo: DIST.jackets,
      },
      {
        name: "Wool Blend Blazer", sku: "JC-003", price: 210, stockQty: 15,
        description: "Half-lined blazer in wool-cotton blend. Notch lapel, patch pockets, natural shoulder.",
        imageUrl: "https://images.unsplash.com/photo-1603339655061-8c2c0899b1cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxXb29sJTIwQmxlbmQlMjBCbGF6ZXJ8ZW58MHx8fHwxNzc4MDYzOTk2fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-003",
        warrantyStatus: warranty(210), distributorInfo: DIST.jackets,
      },
      {
        name: "Quilted Field Jacket", sku: "JC-004", price: 175, stockQty: 3,
        description: "Diamond-quilted jacket with corduroy collar and brass snaps. Insulated, no bulk.",
        imageUrl: "https://images.unsplash.com/photo-1610371335313-a69c45999f0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxRdWlsdGVkJTIwRmllbGQlMjBKYWNrZXR8ZW58MHx8fHwxNzc4MDYzOTk5fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-004",
        warrantyStatus: warranty(175), distributorInfo: DIST.jackets,
      },
      {
        name: "Leather Biker Jacket", sku: "JC-005", price: 395, stockQty: 8,
        description: "Full-grain lamb leather, asymmetric zip. Satin-lined with zippered cuffs.",
        imageUrl: "https://images.unsplash.com/photo-1770711670961-ce01204d3186?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMZWF0aGVyJTIwQmlrZXIlMjBKYWNrZXR8ZW58MHx8fHwxNzc4MDY0MDAxfDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-005",
        warrantyStatus: warranty(395), distributorInfo: DIST.jackets,
      },
      {
        // Demo label (A): out of stock — "Add to Cart" button must be disabled.
        name: "Cotton Harrington Jacket (A)", sku: "JC-006", price: 95, stockQty: 0,
        description: "Zip-front Harrington in washed cotton twill. Tartan-lined, elasticated cuffs.",
        imageUrl: "https://images.unsplash.com/photo-1754479139293-045481a6c3b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDb3R0b24lMjBIYXJyaW5ndG9uJTIwSmFja2V0fGVufDB8fHx8MTc3ODA2NDAwM3ww&ixlib=rb-4.1.0&q=80&w=1080", category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-006",
        warrantyStatus: warranty(95), distributorInfo: DIST.jackets,
      },
      {
        // JC-007: image fixed (was duplicate of JC-004)
        name: "Waterproof Parka", sku: "JC-007", price: 245, stockQty: 14,
        description: "Seam-sealed technical parka with adjustable hood and fishtail hem.",
        imageUrl: "https://images.unsplash.com/photo-1599830851884-b2d05974992c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxXYXRlcnByb29mJTIwUGFya2F8ZW58MHx8fHwxNzc4MDY0MDA2fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Jackets & Coats",
        model: "Heritage Outerwear Line", serialNumber: "SN-JC-007",
        warrantyStatus: warranty(245), distributorInfo: DIST.jackets,
      },

      // ── Shirts (7) ──
      {
        name: "Slim Fit Oxford Shirt", sku: "SH-001", price: 68, stockQty: 40,
        description: "Crisp cotton oxford, button-down collar. Garment-washed for softness.",
        imageUrl: "https://images.unsplash.com/photo-1583525225141-1adb30017fd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxTbGltJTIwRml0JTIwT3hmb3JkJTIwU2hpcnR8ZW58MHx8fHwxNzc4MDY0MDA4fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-001",
        warrantyStatus: warranty(68), distributorInfo: DIST.shirts,
      },
      {
        name: "Brushed Flannel Shirt", sku: "SH-002", price: 72, stockQty: 28,
        description: "Double-brushed cotton flannel with subtle check. Essential for autumn layering.",
        imageUrl: "https://images.unsplash.com/photo-1758521232810-f65749e2931f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxCcnVzaGVkJTIwRmxhbm5lbCUyMFNoaXJ0fGVufDB8fHx8MTc3ODA2NDAxMHww&ixlib=rb-4.1.0&q=80&w=1080", category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-002",
        warrantyStatus: warranty(72), distributorInfo: DIST.shirts,
      },
      {
        // Demo label (C): > 1 unit in stock. Customer adds this to wishlist live (Step 1.5).
        // Sales manager sets 20% discount (Step 5.3) → discount notification fires because C is in wishlist.
        name: "Linen Camp Collar Shirt (C)", sku: "SH-003", price: 78, stockQty: 18,
        description: "Relaxed camp collar in pure European linen. Boxy fit, warm-weather ease.",
        imageUrl: "https://images.unsplash.com/photo-1708531378330-b42fa44a882d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMaW5lbiUyMENhbXAlMjBDb2xsYXIlMjBTaGlydHxlbnwwfHx8fDE3NzgwNjQwMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-003",
        warrantyStatus: warranty(78), distributorInfo: DIST.shirts,
      },
      {
        name: "Chambray Work Shirt", sku: "SH-004", price: 65, stockQty: 5,
        description: "Indigo-dyed chambray, double chest pockets, reinforced yoke.",
        imageUrl: "https://images.unsplash.com/photo-1558171813-2ffcb3d2ea27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDaGFtYnJheSUyMFdvcmslMjBTaGlydHxlbnwwfHx8fDE3NzgwNjQwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-004",
        warrantyStatus: warranty(65), distributorInfo: DIST.shirts,
      },
      {
        name: "Striped Poplin Dress Shirt", sku: "SH-005", price: 82, stockQty: 16,
        description: "Fine cotton poplin, French placket, spread collar. Tailored fit.",
        imageUrl: "https://images.unsplash.com/photo-1592961659807-88f71d4acd3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxTdHJpcGVkJTIwUG9wbGluJTIwRHJlc3MlMjBTaGlydHxlbnwwfHx8fDE3NzgwNjQwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-005",
        warrantyStatus: warranty(82), distributorInfo: DIST.shirts,
      },
      {
        name: "Cotton Pique Polo", sku: "SH-006", price: 55, stockQty: 0,
        description: "Classic polo in heavyweight cotton pique. Mother-of-pearl buttons.",
        imageUrl: "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDb3R0b24lMjBQaXF1ZSUyMFBvbG98ZW58MHx8fHwxNzc4MDY0MDE5fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-006",
        warrantyStatus: warranty(55), distributorInfo: DIST.shirts,
      },
      {
        // SH-007: image fixed (was duplicate of SH-003)
        name: "Band Collar Linen Shirt", sku: "SH-007", price: 74, stockQty: 2,
        description: "Mandarin collar, garment-dyed linen. Minimalist with chest pocket.",
        imageUrl: "https://images.unsplash.com/photo-1713881842156-3d9ef36418cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxCYW5kJTIwQ29sbGFyJTIwTGluZW4lMjBTaGlydHxlbnwwfHx8fDE3NzgwNjQwMjF8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Shirts",
        model: "Classic Shirts Collection", serialNumber: "SN-SH-007",
        warrantyStatus: warranty(74), distributorInfo: DIST.shirts,
      },

      // ── Trousers (7) ──
      {
        name: "Relaxed Linen Trousers", sku: "TR-001", price: 95, stockQty: 25,
        description: "Pure-linen with relaxed drape. Elasticated drawstring waistband.",
        imageUrl: "https://images.unsplash.com/photo-1772583435283-b07bc9950497?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxSZWxheGVkJTIwTGluZW4lMjBUcm91c2Vyc3xlbnwwfHx8fDE3NzgwNjQwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-001",
        warrantyStatus: warranty(95), distributorInfo: DIST.trousers,
      },
      {
        name: "Tailored Chino Trousers", sku: "TR-002", price: 85, stockQty: 35,
        description: "Structured cotton twill chinos, tailored fit, clean ankle taper.",
        imageUrl: "https://images.unsplash.com/photo-1619470148547-0adbfc64b595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxUYWlsb3JlZCUyMENoaW5vJTIwVHJvdXNlcnN8ZW58MHx8fHwxNzc4MDY0MDI1fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-002",
        warrantyStatus: warranty(85), distributorInfo: DIST.trousers,
      },
      {
        name: "Stretch Slim Jeans", sku: "TR-003", price: 89, stockQty: 45,
        description: "Japanese selvedge denim with 2% elastane. Dark indigo wash.",
        imageUrl: "https://images.unsplash.com/photo-1714143164072-7646ef5cb24d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxTdHJldGNoJTIwU2xpbSUyMEplYW5zfGVufDB8fHx8MTc3ODA2NDAyN3ww&ixlib=rb-4.1.0&q=80&w=1080", category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-003",
        warrantyStatus: warranty(89), distributorInfo: DIST.trousers,
      },
      {
        name: "Corduroy Wide-Leg Trousers", sku: "TR-004", price: 98, stockQty: 12,
        description: "8-wale cotton corduroy, generous wide-leg. Double pleats, high rise.",
        imageUrl: "https://images.unsplash.com/photo-1764593008673-af6056758b4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDb3JkdXJveSUyMFdpZGUtTGVnJTIwVHJvdXNlcnN8ZW58MHx8fHwxNzc4MDY0MDI5fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-004",
        warrantyStatus: warranty(98), distributorInfo: DIST.trousers,
      },
      {
        name: "Wool Dress Trousers", sku: "TR-005", price: 135, stockQty: 0,
        description: "Tropical-weight wool, flat front, permanent crease. Half-lined.",
        imageUrl: "https://images.unsplash.com/photo-1540704751673-44f9dfd188c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxXb29sJTIwRHJlc3MlMjBUcm91c2Vyc3xlbnwwfHx8fDE3NzgwNjQwMzF8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-005",
        warrantyStatus: warranty(135), distributorInfo: DIST.trousers,
      },
      {
        name: "Cargo Utility Pants", sku: "TR-006", price: 79, stockQty: 20,
        description: "Relaxed cotton ripstop with six pockets. Washed for softness.",
        imageUrl: "https://images.unsplash.com/photo-1776687773939-348819a9b787?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDYXJnbyUyMFV0aWxpdHklMjBQYW50c3xlbnwwfHx8fDE3NzgwNjQwMzR8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-006",
        warrantyStatus: warranty(79), distributorInfo: DIST.trousers,
      },
      {
        name: "Drawstring Jogger Trousers", sku: "TR-007", price: 62, stockQty: 30,
        description: "French terry cotton joggers with tapered leg. Ribbed ankle cuffs.",
        imageUrl: "https://images.unsplash.com/photo-1719473448126-eb1159ec5242?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxEcmF3c3RyaW5nJTIwSm9nZ2VyJTIwVHJvdXNlcnN8ZW58MHx8fHwxNzc4MDY0MDM2fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Trousers",
        model: "Modern Trousers Collection", serialNumber: "SN-TR-007",
        warrantyStatus: warranty(62), distributorInfo: DIST.trousers,
      },

      // ── Knitwear (7) ──
      {
        // Demo label (G): appears in Order 2 (processing, cancellable during demo Step 1.7).
        name: "Cashmere Crew Sweater (G)", sku: "KN-001", price: 195, stockQty: 10,
        description: "Pure Mongolian cashmere, classic crew-neck. Ribbed cuffs and hem.",
        imageUrl: "https://images.unsplash.com/photo-1623393807211-3d70dc56395c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDYXNobWVyZSUyMENyZXclMjBTd2VhdGVyfGVufDB8fHx8MTc3ODA2NDAzOHww&ixlib=rb-4.1.0&q=80&w=1080", category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-001",
        warrantyStatus: warranty(195), distributorInfo: DIST.knitwear,
      },
      {
        // Demo label (F): appears in Order 4 (delivered < 30 days ago — refundable in Step 2).
        // Pre-seeded in wishlist → 30% discount notification fires in Step 5.3.
        // KN-002: image fixed (was duplicate of KN-001)
        name: "Merino V-Neck Sweater (F)", sku: "KN-002", price: 110, stockQty: 24,
        description: "Fine-gauge merino wool V-neck. Layer over shirts or wear alone.",
        imageUrl: "https://images.unsplash.com/photo-1599032909736-0155c1d43a6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxNZXJpbm8lMjBWLU5lY2slMjBTd2VhdGVyfGVufDB8fHx8MTc3ODA2NDA0MHww&ixlib=rb-4.1.0&q=80&w=1080", category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-002",
        warrantyStatus: warranty(110), distributorInfo: DIST.knitwear,
      },
      {
        name: "Cable Knit Cardigan", sku: "KN-003", price: 145, stockQty: 4,
        description: "Heritage cable-knit in wool-cotton blend. Horn buttons, shawl collar.",
        imageUrl: "https://images.unsplash.com/photo-1771736811976-03c89e50593d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDYWJsZSUyMEtuaXQlMjBDYXJkaWdhbnxlbnwwfHx8fDE3NzgwNjQwNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-003",
        warrantyStatus: warranty(145), distributorInfo: DIST.knitwear,
      },
      {
        name: "Cotton Rollneck", sku: "KN-004", price: 65, stockQty: 32,
        description: "Heavyweight cotton jersey rollneck. Clean, minimal layering piece.",
        imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop&q=80", category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-004",
        warrantyStatus: warranty(65), distributorInfo: DIST.knitwear,
      },
      {
        name: "Lambswool Fair Isle Sweater", sku: "KN-005", price: 125, stockQty: 0,
        description: "Traditional Fair Isle pattern in soft lambswool. Ribbed trim.",
        imageUrl: "https://images.unsplash.com/photo-1769772273242-a7bd27684da4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMYW1ic3dvb2wlMjBGYWlyJTIwSXNsZSUyMFN3ZWF0ZXJ8ZW58MHx8fHwxNzc4MDY0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-005",
        warrantyStatus: warranty(125), distributorInfo: DIST.knitwear,
      },
      {
        name: "Half-Zip Fleece Pullover", sku: "KN-006", price: 88, stockQty: 18,
        description: "Recycled polyester fleece with contrast half-zip. Chest pocket.",
        imageUrl: "https://images.unsplash.com/photo-1771414279996-e7d9aee99007?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxIYWxmLVppcCUyMEZsZWVjZSUyMFB1bGxvdmVyfGVufDB8fHx8MTc3ODA2NDA0OXww&ixlib=rb-4.1.0&q=80&w=1080", category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-006",
        warrantyStatus: warranty(88), distributorInfo: DIST.knitwear,
      },
      {
        name: "Waffle Knit Henley", sku: "KN-007", price: 52, stockQty: 40,
        description: "Textured waffle-knit cotton with three-button henley placket.",
        imageUrl: "https://images.unsplash.com/photo-1774294067490-b7e2a5964cf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxXYWZmbGUlMjBLbml0JTIwSGVubGV5fGVufDB8fHx8MTc3ODA2NDA1MXww&ixlib=rb-4.1.0&q=80&w=1080", category: "Knitwear",
        model: "Premium Knitwear Series", serialNumber: "SN-KN-007",
        warrantyStatus: warranty(52), distributorInfo: DIST.knitwear,
      },

      // ── Footwear (7) ──
      {
        // Demo label (H): appears in Order 3 (in_transit — cannot cancel, cannot refund).
        name: "Leather Chelsea Boots (H)", sku: "FW-001", price: 245, stockQty: 15,
        description: "Full-grain calf leather, Goodyear-welted sole. Elastic side panels.",
        imageUrl: "https://images.unsplash.com/photo-1608629601270-a0007becead3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMZWF0aGVyJTIwQ2hlbHNlYSUyMEJvb3RzfGVufDB8fHx8MTc3ODA2NDA1M3ww&ixlib=rb-4.1.0&q=80&w=1080", category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-001",
        warrantyStatus: warranty(245), distributorInfo: DIST.footwear,
      },
      {
        name: "Suede Desert Boots", sku: "FW-002", price: 160, stockQty: 20,
        description: "Unlined suede on crepe rubber sole. Warm sand colour.",
        imageUrl: "https://images.unsplash.com/photo-1762236097115-4aaf0e7a2d20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxTdWVkZSUyMERlc2VydCUyMEJvb3RzfGVufDB8fHx8MTc3ODA2NDA1NXww&ixlib=rb-4.1.0&q=80&w=1080", category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-002",
        warrantyStatus: warranty(160), distributorInfo: DIST.footwear,
      },
      {
        name: "White Leather Sneakers", sku: "FW-003", price: 130, stockQty: 30,
        description: "Minimalist court sneaker in full-grain white leather. Cup-sole.",
        imageUrl: "https://images.unsplash.com/photo-1722489291846-0bc130eac071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxXaGl0ZSUyMExlYXRoZXIlMjBTbmVha2Vyc3xlbnwwfHx8fDE3NzgwNjQwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-003",
        warrantyStatus: warranty(130), distributorInfo: DIST.footwear,
      },
      {
        // Demo label (B): exactly 1 unit in stock. Customer buys this in Step 3.
        name: "Canvas Espadrilles (B)", sku: "FW-004", price: 48, stockQty: 1,
        description: "Handmade jute-soled espadrilles in washed cotton canvas.",
        imageUrl: "https://images.unsplash.com/photo-1513654233834-19416b6eed13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDYW52YXMlMjBFc3BhZHJpbGxlc3xlbnwwfHx8fDE3NzgwNjQwNjB8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-004",
        warrantyStatus: warranty(48), distributorInfo: DIST.footwear,
      },
      {
        name: "Leather Penny Loafers", sku: "FW-005", price: 195, stockQty: 11,
        description: "Hand-sewn moccasin in polished calf leather. Blake-stitched sole.",
        imageUrl: "https://images.unsplash.com/photo-1616406432452-07bc5938759d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMZWF0aGVyJTIwUGVubnklMjBMb2FmZXJzfGVufDB8fHx8MTc3ODA2NDA2Mnww&ixlib=rb-4.1.0&q=80&w=1080", category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-005",
        warrantyStatus: warranty(195), distributorInfo: DIST.footwear,
      },
      {
        name: "Suede Low-Top Sneakers", sku: "FW-006", price: 115, stockQty: 0,
        description: "Italian suede upper with vulcanised rubber sole. Tonal laces.",
        imageUrl: "https://images.unsplash.com/photo-1767589325064-a20f42c1da11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxTdWVkZSUyMExvdy1Ub3AlMjBTbmVha2Vyc3xlbnwwfHx8fDE3NzgwNjQwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-006",
        warrantyStatus: warranty(115), distributorInfo: DIST.footwear,
      },
      {
        name: "Leather Lace-Up Boots", sku: "FW-007", price: 220, stockQty: 9,
        description: "Oil-tanned leather with Vibram lug sole. Speed hooks at top.",
        imageUrl: "https://images.unsplash.com/photo-1762339107598-c3bf3036559f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMZWF0aGVyJTIwTGFjZS1VcCUyMEJvb3RzfGVufDB8fHx8MTc3ODA2NDA2N3ww&ixlib=rb-4.1.0&q=80&w=1080", category: "Footwear",
        model: "Artisan Footwear Series", serialNumber: "SN-FW-007",
        warrantyStatus: warranty(220), distributorInfo: DIST.footwear,
      },

      // ── Accessories (7) ──
      {
        name: "Waxed Canvas Tote", sku: "AC-001", price: 45, stockQty: 55,
        description: "Waxed cotton canvas, vegetable-tanned leather handles, brass hardware.",
        imageUrl: "https://images.unsplash.com/photo-1732963574895-f4b6af2dec06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxXYXhlZCUyMENhbnZhcyUyMFRvdGV8ZW58MHx8fHwxNzc4MDY0MDY5fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-001",
        warrantyStatus: warranty(45), distributorInfo: DIST.accessories,
      },
      {
        name: "Leather Belt", sku: "AC-002", price: 55, stockQty: 42,
        description: "Full-grain bridle leather, solid brass buckle. 35mm width.",
        imageUrl: "https://images.unsplash.com/photo-1664286074176-5206ee5dc878?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMZWF0aGVyJTIwQmVsdHxlbnwwfHx8fDE3NzgwNjQwNzF8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-002",
        warrantyStatus: warranty(55), distributorInfo: DIST.accessories,
      },
      {
        name: "Wool Scarf", sku: "AC-003", price: 38, stockQty: 50,
        description: "Brushed lambswool scarf in classic herringbone weave.",
        imageUrl: "https://images.unsplash.com/photo-1599948126830-89f10444e491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxXb29sJTIwU2NhcmZ8ZW58MHx8fHwxNzc4MDY0MDc0fDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-003",
        warrantyStatus: warranty(38), distributorInfo: DIST.accessories,
      },
      {
        name: "Leather Card Holder", sku: "AC-004", price: 28, stockQty: 0,
        description: "Slim vegetable-tanned leather card case. Three slots.",
        imageUrl: "https://images.unsplash.com/photo-1676276549687-6f51f6e406b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxMZWF0aGVyJTIwQ2FyZCUyMEhvbGRlcnxlbnwwfHx8fDE3NzgwNjQwNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080", category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-004",
        warrantyStatus: warranty(28), distributorInfo: DIST.accessories,
      },
      {
        name: "Silk Pocket Square", sku: "AC-005", price: 32, stockQty: 25,
        description: "Hand-rolled Italian silk with geometric print.",
        imageUrl: "https://images.unsplash.com/photo-1776127839720-c0ab710d9d37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxTaWxrJTIwUG9ja2V0JTIwU3F1YXJlfGVufDB8fHx8MTc3ODA2NDA3OHww&ixlib=rb-4.1.0&q=80&w=1080", category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-005",
        warrantyStatus: warranty(32), distributorInfo: DIST.accessories,
      },
      {
        name: "Canvas Weekender Bag", sku: "AC-006", price: 85, stockQty: 14,
        description: "Roomy cotton canvas duffle with leather base and shoulder strap.",
        imageUrl: "https://images.unsplash.com/photo-1631844321851-a1a5a7594a92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxDYW52YXMlMjBXZWVrZW5kZXIlMjBCYWd8ZW58MHx8fHwxNzc4MDY0MDgwfDA&ixlib=rb-4.1.0&q=80&w=1080", category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-006",
        warrantyStatus: warranty(85), distributorInfo: DIST.accessories,
      },
      {
        name: "Knitted Beanie", sku: "AC-007", price: 25, stockQty: 60,
        description: "Ribbed merino wool beanie with a turn-up brim. One size.",
        imageUrl: "https://images.unsplash.com/photo-1699347611474-5be693bee31e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDQwMDh8MHwxfHNlYXJjaHwxfHxLbml0dGVkJTIwQmVhbmllfGVufDB8fHx8MTc3ODA2NDA4Mnww&ixlib=rb-4.1.0&q=80&w=1080", category: "Accessories",
        model: "Everyday Essentials Collection", serialNumber: "SN-AC-007",
        warrantyStatus: warranty(25), distributorInfo: DIST.accessories,
      },
    ],
  });

  // ── Sample orders for the demo customer ──
  console.log("Creating sample orders...");
  const addr = { fullName: "Polat Canpolat", line1: "123 Main St", line2: "", city: "Istanbul", postalCode: "34000", country: "Turkey" };

  // Fetch the four demo-labeled products
  const pE = await prisma.product.findUnique({ where: { sku: "JC-001" } }); // Merino Wool Overcoat (E)
  const pF = await prisma.product.findUnique({ where: { sku: "KN-002" } }); // Merino V-Neck Sweater (F)
  const pG = await prisma.product.findUnique({ where: { sku: "KN-001" } }); // Cashmere Crew Sweater (G)
  const pH = await prisma.product.findUnique({ where: { sku: "FW-001" } }); // Leather Chelsea Boots (H)

  if (pE && pF && pG && pH) {
    // Order 1: E — delivered > 30 days ago → review/comment target; refund window closed.
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: Number(pE.price), status: "delivered", address: addr, invoiceNo: "INV-2026-001",
        createdAt: new Date("2026-04-10T14:00:00Z"),
        items: { create: [
          { productId: pE.id, productName: pE.name, unitPrice: Number(pE.price), quantity: 1, lineTotal: Number(pE.price) },
        ]},
      },
    });

    // Order 2: G — processing → cancellable in Step 1.7.
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: Number(pG.price), status: "processing", address: addr, invoiceNo: "INV-2026-002",
        createdAt: new Date("2026-04-18T10:30:00Z"),
        items: { create: [
          { productId: pG.id, productName: pG.name, unitPrice: Number(pG.price), quantity: 1, lineTotal: Number(pG.price) },
        ]},
      },
    });

    // Order 3: H — in_transit → cannot cancel, cannot request refund.
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: Number(pH.price), status: "in_transit", address: addr, invoiceNo: "INV-2026-003",
        createdAt: new Date("2026-04-22T16:00:00Z"),
        items: { create: [
          { productId: pH.id, productName: pH.name, unitPrice: Number(pH.price), quantity: 1, lineTotal: Number(pH.price) },
        ]},
      },
    });

    // Order 4: F — delivered within the 30-day refund window → refund request in Step 2.1;
    // approval in Step 6; stock restored in Step 6.3.
    await prisma.order.create({
      data: {
        userId: customer.id, totalAmount: Number(pF.price), status: "delivered", address: addr, invoiceNo: "INV-2026-004",
        createdAt: new Date("2026-06-01T10:00:00Z"),
        items: { create: [
          { productId: pF.id, productName: pF.name, unitPrice: Number(pF.price), quantity: 1, lineTotal: Number(pF.price) },
        ]},
      },
    });
  }

  console.log("Creating sample wishlists...");
  const [w1, w2] = await prisma.$transaction([
    prisma.wishlist.create({ data: { userId: customer.id, name: "Favorites" } }),
    prisma.wishlist.create({ data: { userId: customer.id, name: "Spring Picks" } }),
  ]);

  // Pre-seed Product F (KN-002) in the wishlist so the SM's 30% discount in Step 5.3
  // triggers a real notification email to the customer.
  // Product C (SH-003) is added live by the customer in Step 1.5 and will also trigger
  // a notification when the SM sets 20% discount on it in Step 5.3.
  const pFWish = await prisma.product.findUnique({ where: { sku: "KN-002" } });
  if (pFWish) {
    await prisma.wishlistItem.create({
      data: { wishlistId: w1.id, productId: pFWish.id },
    });
  }

  const counts = await Promise.all([prisma.user.count(), prisma.product.count(), prisma.order.count()]);
  console.log(`Seeded ${counts[0]} users, ${counts[1]} products, ${counts[2]} orders.`);
  console.log("\nDemo accounts (password: password123):");
  console.log("  esat.celebioglu@sabanciuniv.edu   (customer)");
  console.log("  sales@demo.com                    (sales_manager)");
  console.log("  product@demo.com                  (product_manager)");
  console.log("\nDemo product labels:");
  console.log("  A = Cotton Harrington Jacket (A)  [JC-006, stock=0]");
  console.log("  B = Canvas Espadrilles (B)        [FW-004, stock=1]");
  console.log("  C = Linen Camp Collar Shirt (C)   [SH-003, stock=18]");
  console.log("  E = Merino Wool Overcoat (E)      [JC-001, Order 1: delivered Apr-10]");
  console.log("  F = Merino V-Neck Sweater (F)     [KN-002, Order 4: delivered Jun-01 — refundable]");
  console.log("  G = Cashmere Crew Sweater (G)     [KN-001, Order 2: processing — cancellable]");
  console.log("  H = Leather Chelsea Boots (H)     [FW-001, Order 3: in_transit]");
}

main()
  .catch((e) => { console.error(e); })
  .finally(() => prisma.$disconnect());
