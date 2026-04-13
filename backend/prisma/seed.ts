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
      { name: "Polat Canpolat", email: "customer@demo.com", passwordHash: hash, role: "customer" },
      { name: "Sarah Keller", email: "sales@demo.com", passwordHash: hash, role: "sales_manager" },
      { name: "Peter Durand", email: "product@demo.com", passwordHash: hash, role: "product_manager" },
    ],
  });

  console.log("Creating products...");
  await prisma.product.createMany({
    data: [
      // ── Outerwear (7) ──
      { name: "Merino Wool Overcoat", description: "A timeless double-breasted overcoat crafted from Italian merino wool. Fully lined with a tailored silhouette that pairs effortlessly with both formal and casual looks.", price: 289.00, stockQty: 12, sku: "OW-001", imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=800&fit=crop", category: "Outerwear" },
      { name: "Denim Trucker Jacket", description: "Heavyweight selvedge denim jacket with copper rivets and tonal stitching. Raw unwashed finish that develops character over time.", price: 120.00, stockQty: 25, sku: "OW-002", imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=800&fit=crop", category: "Outerwear" },
      { name: "Wool Blend Blazer", description: "Half-lined blazer in a refined wool-cotton blend. Notch lapel, patch pockets, and a natural shoulder for a modern yet timeless look.", price: 210.00, stockQty: 18, sku: "OW-003", imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop", category: "Outerwear" },
      { name: "Quilted Field Jacket", description: "Diamond-quilted jacket with corduroy collar and brass snap closures. Insulated for cool weather without bulk.", price: 175.00, stockQty: 3, sku: "OW-004", imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop", category: "Outerwear" },
      { name: "Cotton Harrington Jacket", description: "A clean zip-front Harrington in washed cotton twill. Tartan-lined interior with elasticated cuffs and hem.", price: 95.00, stockQty: 0, sku: "OW-005", imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop", category: "Outerwear" },
      { name: "Leather Biker Jacket", description: "Full-grain lamb leather with asymmetric zip closure. Satin-lined body with zippered sleeve cuffs.", price: 395.00, stockQty: 8, sku: "OW-006", imageUrl: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=600&h=800&fit=crop", category: "Outerwear" },
      { name: "Waterproof Parka", description: "Seam-sealed technical parka with adjustable hood, fishtail hem, and breathable lining. Ready for rain.", price: 245.00, stockQty: 14, sku: "OW-007", imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd270b9?w=600&h=800&fit=crop", category: "Outerwear" },

      // ── Shirts (7) ──
      { name: "Slim Fit Oxford Shirt", description: "Crisp cotton oxford with a clean button-down collar. Garment-washed for a soft hand feel. A wardrobe essential.", price: 68.00, stockQty: 45, sku: "SH-001", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop", category: "Shirts" },
      { name: "Cotton Pique Polo", description: "Classic polo in heavyweight cotton pique. Mother-of-pearl buttons and ribbed collar that keeps its shape.", price: 55.00, stockQty: 0, sku: "SH-002", imageUrl: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&h=800&fit=crop", category: "Shirts" },
      { name: "Brushed Flannel Shirt", description: "Double-brushed cotton flannel with a soft, substantial hand. Subtle check pattern, essential for layered autumn looks.", price: 72.00, stockQty: 30, sku: "SH-003", imageUrl: "https://images.unsplash.com/photo-1604006852748-903fccbc4019?w=600&h=800&fit=crop", category: "Shirts" },
      { name: "Linen Camp Collar Shirt", description: "Relaxed camp collar shirt in pure European linen. Boxy fit with a clean drape for warm-weather ease.", price: 78.00, stockQty: 22, sku: "SH-004", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop", category: "Shirts" },
      { name: "Chambray Work Shirt", description: "Indigo-dyed chambray with double chest pockets and a reinforced yoke. Fades beautifully with wear.", price: 65.00, stockQty: 5, sku: "SH-005", imageUrl: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&h=800&fit=crop", category: "Shirts" },
      { name: "Striped Poplin Dress Shirt", description: "Fine cotton poplin with a French placket and spread collar. Tailored through the body with a longer tail.", price: 82.00, stockQty: 16, sku: "SH-006", imageUrl: "https://images.unsplash.com/photo-1563630423918-b58f07336ac9?w=600&h=800&fit=crop", category: "Shirts" },
      { name: "Band Collar Linen Shirt", description: "Mandarin collar shirt in garment-dyed linen. Minimalist aesthetic with a single chest pocket.", price: 74.00, stockQty: 2, sku: "SH-007", imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600&h=800&fit=crop", category: "Shirts" },

      // ── Trousers (6) ──
      { name: "Relaxed Linen Trousers", description: "Breathable pure-linen trousers with a relaxed drape. Elasticated waistband with drawstring for comfort.", price: 95.00, stockQty: 28, sku: "TR-001", imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop", category: "Trousers" },
      { name: "Tailored Chino Trousers", description: "Structured cotton twill chinos with a tailored fit through the thigh and a clean taper to the ankle.", price: 85.00, stockQty: 40, sku: "TR-002", imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop", category: "Trousers" },
      { name: "Stretch Slim Jeans", description: "Japanese selvedge denim with 2% elastane for comfort. Slim through the leg with a clean dark indigo wash.", price: 89.00, stockQty: 50, sku: "TR-003", imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop", category: "Trousers" },
      { name: "Corduroy Wide-Leg Trousers", description: "8-wale cotton corduroy in a generous wide-leg cut. Double pleats and a high rise for a vintage-inspired silhouette.", price: 98.00, stockQty: 15, sku: "TR-004", imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop", category: "Trousers" },
      { name: "Wool Dress Trousers", description: "Tropical-weight wool trousers with a flat front and permanent crease. Half-lined through the knee.", price: 135.00, stockQty: 0, sku: "TR-005", imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=800&fit=crop", category: "Trousers" },
      { name: "Cargo Utility Pants", description: "Relaxed cotton ripstop cargo trousers with six pockets. Washed for softness, built for utility.", price: 79.00, stockQty: 20, sku: "TR-006", imageUrl: "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=600&h=800&fit=crop", category: "Trousers" },

      // ── Knitwear (5) ──
      { name: "Cashmere Crew Sweater", description: "Pure Mongolian cashmere in a classic crew-neck silhouette. Ribbed cuffs and hem. The definitive luxury layering piece.", price: 195.00, stockQty: 10, sku: "KN-001", imageUrl: "https://images.unsplash.com/photo-1638643391904-9b551ba91eaa?w=600&h=800&fit=crop", category: "Knitwear" },
      { name: "Merino V-Neck Sweater", description: "Fine-gauge merino wool knitted into a versatile V-neck. Layer over shirts or wear alone.", price: 110.00, stockQty: 24, sku: "KN-002", imageUrl: "https://images.unsplash.com/photo-1614975059251-992f11792571?w=600&h=800&fit=crop", category: "Knitwear" },
      { name: "Cable Knit Cardigan", description: "Heritage cable-knit cardigan in a wool-cotton blend. Horn buttons and ribbed shawl collar.", price: 145.00, stockQty: 4, sku: "KN-003", imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop", category: "Knitwear" },
      { name: "Cotton Rollneck", description: "Heavyweight cotton jersey rollneck. Clean, minimal lines for a sharp layered look.", price: 65.00, stockQty: 35, sku: "KN-004", imageUrl: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&h=800&fit=crop", category: "Knitwear" },
      { name: "Lambswool Fair Isle Sweater", description: "Traditional Fair Isle pattern knitted in soft lambswool. Ribbed collar, cuffs and hem.", price: 125.00, stockQty: 0, sku: "KN-005", imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=800&fit=crop", category: "Knitwear" },

      // ── Footwear (5) ──
      { name: "Leather Chelsea Boots", description: "Full-grain calf leather with a Goodyear-welted sole. Elastic side panels for easy on-off. Built to age beautifully.", price: 245.00, stockQty: 15, sku: "FW-001", imageUrl: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&h=800&fit=crop", category: "Footwear" },
      { name: "Suede Desert Boots", description: "Unlined suede upper on a crepe rubber sole. The quintessential casual boot in a warm sand colour.", price: 160.00, stockQty: 20, sku: "FW-002", imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&h=800&fit=crop", category: "Footwear" },
      { name: "White Leather Sneakers", description: "Minimalist court sneaker in full-grain white leather. Stitched rubber cup-sole and tonal laces.", price: 130.00, stockQty: 30, sku: "FW-003", imageUrl: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=800&fit=crop", category: "Footwear" },
      { name: "Canvas Espadrilles", description: "Handmade jute-soled espadrilles in washed cotton canvas. Lightweight summer footwear.", price: 48.00, stockQty: 1, sku: "FW-004", imageUrl: "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600&h=800&fit=crop", category: "Footwear" },
      { name: "Leather Penny Loafers", description: "Hand-sewn moccasin construction in polished calf leather. Blake-stitched leather sole.", price: 195.00, stockQty: 11, sku: "FW-005", imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=800&fit=crop", category: "Footwear" },

      // ── Accessories (5) ──
      { name: "Waxed Canvas Tote", description: "Durable waxed cotton canvas with vegetable-tanned leather handles. Brass hardware, spacious interior.", price: 45.00, stockQty: 60, sku: "AC-001", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop", category: "Accessories" },
      { name: "Leather Belt", description: "Full-grain bridle leather belt with a solid brass buckle. 35mm width, hand-finished edges.", price: 55.00, stockQty: 42, sku: "AC-002", imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&h=800&fit=crop", category: "Accessories" },
      { name: "Wool Scarf", description: "Brushed lambswool scarf in a classic herringbone weave. Generous dimensions for draping or wrapping.", price: 38.00, stockQty: 50, sku: "AC-003", imageUrl: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&h=800&fit=crop", category: "Accessories" },
      { name: "Leather Card Holder", description: "Slim card case in vegetable-tanned leather. Three card slots and a central compartment for notes.", price: 28.00, stockQty: 0, sku: "AC-004", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=800&fit=crop", category: "Accessories" },
      { name: "Silk Pocket Square", description: "Hand-rolled Italian silk pocket square with a geometric print. Adds a refined finishing touch.", price: 32.00, stockQty: 25, sku: "AC-005", imageUrl: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=800&fit=crop", category: "Accessories" },
    ],
  });

  const counts = await Promise.all([prisma.user.count(), prisma.product.count()]);
  console.log(`Seeded ${counts[0]} users, ${counts[1]} products.`);
  console.log("");
  console.log("Accounts (password: password123):");
  console.log("  customer@demo.com   (customer)");
  console.log("  sales@demo.com      (sales_manager)");
  console.log("  product@demo.com    (product_manager)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
