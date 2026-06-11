# MAISON — CS308 Final Demo Guide

> **Read this fully before the demo.** The demo is 15 minutes, no slides. Reseed the database right before starting.

---

## 1. Pre-Demo Local Reset Commands

Run each command in order. Do **not** skip the reseed.

```bash
# Terminal 1 — Backend
cd backend
npx prisma db push          # applies schema (only needed once or after schema changes)
npx prisma db seed          # resets and reseeds all demo data
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

> **`npx prisma db push` vs `prisma migrate dev`:** This project uses `prisma db push` (schema-push mode, no migration files). Run it when the schema changes. Running `db seed` alone is enough for a reseed if the schema has not changed.

---

## 2. Demo Accounts

| Role | Email | Password |
|---|---|---|
| Customer | `esat.celebioglu@sabanciuniv.edu` | `password123` |
| Product Manager | `product@demo.com` | `password123` |
| Sales Manager | `sales@demo.com` | `password123` |

The customer email is a **real inbox**. Invoice emails, wishlist discount notifications, and refund decision notifications all go there when real SMTP is configured (see Section 6).

---

## 3. Product A / B / C / D / E / F / G / H Mapping

| Label | Product Name | SKU | Stock | Order / Status | Demo Purpose |
|---|---|---|---|---|---|
| **A** | Cotton Harrington Jacket **(A)** | JC-006 | **0** | — | Show "Add to Cart" is disabled (out of stock) |
| **B** | Canvas Espadrilles **(B)** | FW-004 | **1** | — | Buy live in Step 3; stock drops to 0 afterward |
| **C** | Linen Camp Collar Shirt **(C)** | SH-003 | 18 | — | Add to wishlist live (Step 1.5); SM sets 20% discount → notification fires |
| **D** | *(not seeded — created live)* | *(chosen by presenter)* | — | — | PM adds during Step 4.3; SM sets price during Step 5.2 |
| **E** | Merino Wool Overcoat **(E)** | JC-001 | 12 | Order 1 · delivered 2026-04-10 | Rate + comment (Step 1.8); refund window **closed** (Step 2.2) |
| **F** | Merino V-Neck Sweater **(F)** | KN-002 | 24 | Order 4 · delivered 2026-06-01 | Refund request (Step 2.1); 30% discount → notification (Step 5.3/5.4); refund approved (Step 6) |
| **G** | Cashmere Crew Sweater **(G)** | KN-001 | 10 | Order 2 · processing 2026-04-18 | Cancel in Step 1.7 |
| **H** | Leather Chelsea Boots **(H)** | FW-001 | 15 | Order 3 · in_transit 2026-04-22 | Show in-transit status; compare delivery address with PM panel |

**Product D — live creation details:**
- Name: `Demo Jacket (D)` (or similar — must contain "(D)")
- SKU: `DEMO-D-001` (must be unique)
- Serial Number: `SN-DEMO-D-001` (must be unique)
- Category: the new category created in Step 4.2
- Stock: any positive number (e.g. 10)
- Leave price at 0 — SM sets price in Step 5.2

---

## 4. Sales Manager Date Range (for Invoices / Revenue Chart)

Use **2026-04-01 to 2026-06-30** to capture all seeded orders and the live purchase made in Step 3.

Orders visible in this range:
| Invoice | Date | Amount | Status |
|---|---|---|---|
| INV-2026-001 | 2026-04-10 | $289.00 | delivered (E) |
| INV-2026-002 | 2026-04-18 | $195.00 | processing (G) — cancelled in Step 1.7 |
| INV-2026-003 | 2026-04-22 | $245.00 | in_transit (H) |
| INV-2026-004 | 2026-06-01 | $110.00 | delivered (F) — refunded in Step 6 |
| Live purchase | demo day | $48.00 | processing (B) → delivered via PM in Step 4.7 |

---

## 5. Exact 15-Minute Demo Script

### Opening (30 seconds)
> "MAISON is a premium clothing e-commerce platform. Customers browse, wishlist, and purchase items. A product manager controls inventory and orders. A sales manager handles pricing, discounts, invoices, and refunds. We'll run the full scenario now."

---

### STEP 1 — Customer Panel / Wishlist (~3 min)

1. Go to `/login`. Log in as `esat.celebioglu@sabanciuniv.edu` / `password123`.
2. Go to `/account`. Point out:
   - **Customer ID** (numeric `#id`)
   - **Name** (Polat Canpolat)
   - **Tax ID** (TR-1234567890)
   - **Email** (esat.celebioglu@sabanciuniv.edu)
   - **Home Address** (123 Main St, Istanbul, Turkey)
   - **Password** row shows `••••••••` with note: *securely hashed, never stored in plaintext*
3. Search for **"(A)"** → show Cotton Harrington Jacket (A): "Add to Cart" is greyed out / disabled.
4. Search for **"(B)"** → show Canvas Espadrilles (B): stock says "Only 1 left".
5. Search for **"(C)"** → show Linen Camp Collar Shirt (C): stock shows 18. **Add Product C to wishlist.**
6. Search for **"(D)"** → show no results.
7. Go to `/orders`. Walk through the four orders — show statuses (delivered, processing, in_transit, delivered). Note cancellation option for G, refund option for F (< 30 days), no refund for E (> 30 days).
8. **Cancel Order 2** (Cashmere Crew Sweater (G), processing). Confirm it becomes "Cancelled".
9. Go to product page for **Merino Wool Overcoat (E)**. Rate it (1–5 stars) and submit a comment.

---

### STEP 2 — Customer Panel / Refund (~1 min)

1. Go to `/orders`. Find **Order 4** (Merino V-Neck Sweater (F), delivered 2026-06-01). Click **"Request Refund"**. Confirm refund request is submitted.
2. Point to **Order 1** (Merino Wool Overcoat (E), delivered 2026-04-10). Show that "Refund window closed" appears — the 30-day window has passed.

---

### STEP 3 — Customer Panel / Credit Card Purchase (~1.5 min)

1. Search for **"(B)"** → Canvas Espadrilles (B). Add to cart.
2. Go to `/checkout`. Note the delivery address — **remember it** for the PM panel comparison in Step 4.
3. Go to `/payment`. Show that credit card fields are required (do not submit without them).
4. Fill in card details and complete the purchase.
5. Go to `/orders`. Show the new order for Product B with status **"processing"** and the delivery address.

---

### STEP 4 — Product Manager Panel (~3 min)

1. Log out. Log in as `product@demo.com` / `password123`. You are redirected to `/pm-admin`.
2. Click **"Categories"** tab. Show existing categories. Add a new category (e.g. "Demo Outerwear").
3. Click **"Products"** tab → **"+ Add Product"**. Fill in:
   - Name: `Demo Jacket (D)` · SKU: `DEMO-D-001` · Serial: `SN-DEMO-D-001`
   - Category: the new category · Stock: 10
   - Leave price at 0 (SM sets price later). Submit.
4. Find **Cotton Harrington Jacket (A)** in the product list. Click **"Remove"** to deactivate it.
5. Find **Canvas Espadrilles (B)**. Show that stock is now **0** (sold in Step 3). Use **"Edit"** to increase stock (e.g. to 5). Save.
6. Click **"Orders"** tab. Point out the columns:
   - **Invoice** (INV-2026-XXX)
   - **Customer** (name + email + **ID**)
   - **Delivery Address** (matches what the customer entered in Step 3)
   - **Items** (product name × quantity + **product ID**)
   - **Total**, **Date**, **Status**
7. Find the **Canvas Espadrilles (B)** order (status: processing). Click **"Mark In Transit"** — status changes. Click **"Mark Delivered"** — status changes to delivered. *(Two clicks required — processing → in_transit → delivered.)*
8. Click **"Comments"** tab. Find the comment left for Product E. Click **"Approve"**.

---

### STEP 5 — Sales Manager Panel (~3 min)

1. Log out. Log in as `sales@demo.com` / `password123`. Redirected to `/admin`.
2. Click **"Products"** tab. Find **Demo Jacket (D)**. Set price to e.g. `$199`. Save. Explain: the product is now visible on the storefront.
3. Set **20% discount** on **Linen Camp Collar Shirt (C)** and **30% discount** on **Merino V-Neck Sweater (F)**. Save each.
4. Check the real inbox at `esat.celebioglu@sabanciuniv.edu` — show the wishlist discount notification email for Product F (pre-seeded in wishlist). If Product C was added in Step 1.5, a notification for C will also arrive.
5. Click **"Orders"** tab. Set date range to **2026-04-01 → 2026-06-30**. Show the filtered order list.
6. Click the invoice link for any order → PDF downloads. Open it to show the formatted invoice with product IDs and totals.
7. Show the **revenue and profit chart** for the same date range.

---

### STEP 6 — Sales Manager / Refund (~1 min)

1. Click **"Refunds"** tab. Find the pending refund for **Merino V-Neck Sweater (F)**. Click **"Approve"**.
2. Show that the order status changes to **"refunded"**.
3. Check the customer's inbox — a refund decision email was sent.
4. Switch to Product Manager panel → Products → find **Merino V-Neck Sweater (F)** → show that stock increased by 1 (refund restores stock atomically via `prisma.$transaction`).

---

### STEP 7 — Security / Defensive / Concurrency Protections (~2 min)

**Security Awareness:**
- `server.ts` — `app.use(helmet())` sets 11 HTTP security headers (X-Frame-Options, CSP, HSTS, etc.)
- Auth routes protected by `express-rate-limit`: 20 requests / 15 min / IP — brute-force protection
- Passwords hashed with `bcrypt` at cost factor 12 — one-way, irreversible
- JWT tokens signed with `jwt.verify()` — tamper-proof session tokens
- No plaintext passwords ever stored or returned by any API

**Defensive Programming:**
- All inputs validated with **Zod** schemas + `.trim()` — rejects whitespace-only strings
- Global React **ErrorBoundary** wraps the entire app — any unhandled render error shows a fallback UI instead of a blank screen
- `safeUser()` in `authService.ts` never includes `passwordHash`, `passwordChangeCode`, or any sensitive field in API responses
- All API errors follow a consistent `{ error: string }` shape via `AppError` + `errorHandler` middleware

**Concurrency Protection:**
- `createOrder()` runs entirely inside `prisma.$transaction()` — atomic: stock check, decrement, order create, cart clear all succeed or all roll back
- Stock decrement uses a conditional `updateMany({ where: { stockQty: { gte: quantity } } })` — if `count === 0`, another concurrent checkout won the race and we throw immediately with a helpful error, preventing any overselling

---

## 6. Real Email Configuration (Required Before Demo)

### Email flow

| Role | Address |
|---|---|
| **Recipient (customer inbox)** | `esat.celebioglu@sabanciuniv.edu` |
| **SMTP sender account** | `noreplymaisoncs308@gmail.com` |

All three email types (invoice, wishlist discount notification, refund decision) are sent **FROM** `noreplymaisoncs308@gmail.com` **TO** `esat.celebioglu@sabanciuniv.edu`. This happens automatically because the customer's account email in the seed is `esat.celebioglu@sabanciuniv.edu` and the SMTP sender identity is controlled by the `.env` variables below.

### Local `.env` configuration

Add the following to `backend/.env` **locally**. **Do not commit this file.**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreplymaisoncs308@gmail.com
SMTP_PASS=<gmail-app-password-goes-here>
SMTP_FROM=noreplymaisoncs308@gmail.com
```

`SMTP_PASS` must be a **Gmail App Password**, not the Gmail account password. Generate one at: **Google Account → Security → 2-Step Verification → App passwords**. The 16-character app password is entered only in your local `.env` file and must never be committed to the repository.

### Ethereal fallback (NOT suitable for demo)

If `SMTP_HOST` or `SMTP_USER` is missing, the backend automatically falls back to Ethereal — a disposable test SMTP service. In this mode, no real email is delivered; instead a preview URL is printed to the backend terminal. **This is not sufficient for the final demo.** Real SMTP must be configured so that `esat.celebioglu@sabanciuniv.edu` actually receives the emails.

### How to verify before the demo

1. Add the SMTP variables above to `backend/.env` and restart the backend (`npm run dev`).
2. Log in as the customer (`esat.celebioglu@sabanciuniv.edu`) and purchase any item.
3. Check the inbox at `esat.celebioglu@sabanciuniv.edu` — an invoice PDF email from `noreplymaisoncs308@gmail.com` should arrive within 30 seconds.
4. If it arrives, email is working. If not, check the backend terminal for lines starting with `[Email]` — they will indicate whether real SMTP or Ethereal was used, and any error messages.

---

## 7. Notes and Risks

| Item | Note |
|---|---|
| **Product B delivery: 2 clicks** | After Step 3 purchase, B is "processing". PM must click "Mark In Transit" first, then "Mark Delivered". Both buttons appear one at a time. |
| **Product D: unique SKU and serial number** | If the seed was run before, the database is clean. But if live-adding D fails with "SKU already exists", use a different SKU. |
| **Discount notification email** | Fires only when the discounted product is in the customer's wishlist. F is pre-seeded. C must be added in Step 1.5. |
| **Refund notification email** | Fires after SM approves or rejects in Step 6. Check inbox within ~10 seconds. |
| **Ethereal fallback** | If SMTP env vars are missing, preview URL appears only in the backend terminal — not enough for live demo. |
| **Product A removed in Step 4.4** | "Remove" sets `isActive = false`. The product disappears from the customer storefront but remains visible in the PM panel. |
| **Comment moderation** | Comment left in Step 1.9 starts as "pending". It becomes visible on the product page only after PM approves in Step 4.8. |

---

## 8. Test and Build Commands

```bash
# Backend tests
cd backend && npm test

# Backend build
cd backend && npm run build

# Frontend tests
cd frontend && npm test

# Frontend build
cd frontend && npm run build
```
