# MAISON -- Online Clothing Store

CS 308 Software Engineering course project. Professional e-commerce application built with React + Node.js + PostgreSQL.

---

## Changelog

### Sprint 3 — Stories 16 + 17 + UI/Data Update (current)

**Part A: UI/Data Fixes**
- **Seed data**: Rewritten with 42 products across 6 balanced categories (Jackets & Coats, Shirts, Trousers, Knitwear, Footwear, Accessories — 7 each). All Unsplash image URLs verified. Includes 5 out-of-stock items, 4 low-stock (1-5), rest normal stock.
- **Category filter**: Replaced tab buttons with a dropdown `<select>` next to the sort dropdown. Scales to any number of categories.
- **Stock labels**: Every product card shows "Stock: N" or "Out of stock" next to the product name.
- **Navbar**: Refined SVG shopping bag icon with count badge. Account dropdown (click/ESC/outside-click to close) with Profile, Order History, Sign Out. No raw username, no "demo" labels anywhere.
- **Account page**: Removed Order History section (accessible via /orders from dropdown). Polished profile card with initials avatar + delivery address form placeholder.
- **Login page**: Removed demo accounts block.
- **Checkout page**: Two-column layout with address form (Story 14 ready) + order summary card. Address validated before proceeding.
- **Payment page**: Bordered card form, spinner on submit button, consistent breadcrumbs.

**Part B: Story 16 — Order Creation**
- New Prisma models: `Order` (with JSON address snapshot, invoiceNo, status) and `OrderItem` (productName/unitPrice/lineTotal snapshots).
- Backend `POST /api/orders`: Transactional order creation — verifies stock, decrements atomically, creates order + items, clears cart. Rolls back entirely on failure.
- Backend `GET /api/orders`, `GET /api/orders/:id`: List and detail endpoints.
- Frontend: Payment success now calls order creation. Cart clears only after confirmed order. Orders page shows real order history.

**Part C: Story 17 — Invoice PDF + Email**
- PDF generation with pdfkit: includes product name, product ID, quantity, unit price, line total, customer name, address snapshot, invoice number, date.
- Email via nodemailer: Uses Ethereal test account by default (preview URL logged to console). Supports real SMTP via env vars. Failures are caught and logged — order creation is never blocked.
- Backend `GET /api/orders/:id/invoice`: Generates and streams PDF download.
- Frontend: "Download Invoice PDF" button on success screen and on each order in history.

**Story 14 Readiness**: Order model stores address as a JSON snapshot (`{ fullName, line1, line2, city, postalCode, country }`). Checkout form collects this address. Invoice uses the order's address snapshot, not user profile. No refactoring needed when Story 14 adds address persistence.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router, React Hook Form |
| Backend | Node.js, Express, TypeScript, Prisma ORM, Zod, pdfkit, nodemailer |
| Database | PostgreSQL |
| Auth | bcrypt + JWT |
| Tests | Jest (backend 22), Vitest (frontend 2) |

---

## How to Run Locally

### Prerequisites
- **Node.js 20+**: `node --version`
- **PostgreSQL 14+**: `pg_isready`

### Step 1: Create database

```bash
createdb maison_sprint3
```

### Step 2: Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL:
#   DATABASE_URL="postgresql://youruser@localhost:5432/maison_sprint3?schema=public"
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### Step 3: Frontend (new terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

### Accounts (password: `password123`)

| Email | Role |
|-------|------|
| customer@demo.com | Customer |
| sales@demo.com | Sales Manager |
| product@demo.com | Product Manager |

### Invoice Email Behavior

By default, invoice emails are sent via **Ethereal** (a free test email service). The backend logs a preview URL to the console after each order — click it to view the email in your browser. No SMTP configuration needed for development.

To use real SMTP, set these in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

---

## Running Tests

```bash
cd backend && npm test     # 22 tests
cd frontend && npm test    # 2 smoke tests
```

---

## Manual Regression Checklist

### Guest cart → login merge (MUST pass)
- [ ] Incognito browser, add 2 products as guest
- [ ] Login as customer@demo.com
- [ ] Open /cart — both items visible immediately
- [ ] No empty-cart flash, no delayed appearance

### Logout isolation
- [ ] Logged in with cart items → Sign Out
- [ ] /cart shows empty (no leaked server items)

### Logged-in cart persistence
- [ ] Login, add items, hard refresh → items persist
- [ ] Logout + login again → items persist

### Search / sort / filter
- [ ] Search "cashmere" → finds knitwear item
- [ ] Search "selvedge" → finds denim items
- [ ] Category dropdown filters correctly
- [ ] Price sort works both directions

---

## Manual UI Checklist

### Landing
- [ ] No "Featured/Curated" block — just hero + product grid
- [ ] Category filter is a dropdown (not buttons)
- [ ] "Stock: N" visible next to every product name
- [ ] Out-of-stock items show "Out of stock" label + "Sold Out" overlay
- [ ] 42 products visible with no broken images

### Navbar
- [ ] Cart shown as SVG bag icon (no text)
- [ ] Count badge on icon when items present
- [ ] Logged in: initials avatar + chevron, NO raw username
- [ ] Click avatar → dropdown (Profile / Order History / Sign Out)
- [ ] Click outside / ESC closes dropdown
- [ ] No "demo" labels anywhere

### Full Purchase Flow
- [ ] Add items to cart → "Proceed to Checkout"
- [ ] /checkout: address form + order summary side by side
- [ ] Address validation (try empty fields)
- [ ] "Continue to Payment" → /payment
- [ ] Payment form: card auto-formats, expiry auto-formats
- [ ] Submit with invalid data → clear field errors
- [ ] Submit with valid data (4111111111111111 / 12/30 / 123)
- [ ] Spinner shown during processing
- [ ] Success screen: "Order Confirmed" + invoice number
- [ ] "Download Invoice PDF" works (opens PDF)
- [ ] Backend console shows Ethereal preview URL
- [ ] Navigate to /orders → order appears in history
- [ ] Download invoice from order history works
- [ ] Stock decremented on landing (check product stock changed)
- [ ] Cart is empty after successful order

---

## API Reference

### Public
```
GET  /api/health
GET  /api/products
GET  /api/products/categories
GET  /api/products/:id
```

### Auth
```
POST /api/auth/register    → { user, token }
POST /api/auth/login       → { user, token }
GET  /api/auth/me          → User (protected)
```

### Cart (protected)
```
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
POST   /api/cart/sync
```

### Payment (protected)
```
POST /api/payment/validate → { ok, message? }
```

### Orders (protected) — Story 16 + 17
```
POST /api/orders           → { order, emailPreviewUrl? }
GET  /api/orders           → Order[]
GET  /api/orders/:id       → Order
GET  /api/orders/:id/invoice → PDF download
```

---

## Story 16 Patch Map

Files created/modified ONLY for Story 16 (order creation, stock update, cart clear):

| File | Action | Purpose |
|------|--------|---------|
| `backend/prisma/schema.prisma` | Modified | Added `Order`, `OrderItem` models, `OrderStatus` enum |
| `backend/src/services/orderService.ts` | Created | Transactional order creation, stock decrement, cart clear, list/detail |
| `backend/src/routes/orders.ts` | Created | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id` |
| `backend/src/server.ts` | Modified | Registered `/api/orders` route |
| `frontend/src/types/index.ts` | Modified | Added `Order`, `OrderItem`, `OrderAddress` interfaces |
| `frontend/src/pages/Payment.tsx` | Modified | Calls `POST /api/orders` after payment validation |
| `frontend/src/pages/Orders.tsx` | Modified | Fetches real orders from `GET /api/orders` |

---

## Story 17 Patch Map

Files created/modified ONLY for Story 17 (invoice PDF + email):

| File | Action | Purpose |
|------|--------|---------|
| `backend/package.json` | Modified | Added `nodemailer`, `pdfkit` dependencies |
| `backend/.env.example` | Modified | Added SMTP env vars |
| `backend/src/config/env.ts` | Modified | Added `smtp` config block |
| `backend/src/services/invoiceService.ts` | Created | `generateInvoicePdf()` → Buffer, `sendInvoiceEmail()` → Ethereal/SMTP |
| `backend/src/routes/orders.ts` | Modified | Invoice generation in POST handler, `GET /api/orders/:id/invoice` endpoint |
| `frontend/src/pages/Payment.tsx` | Modified | Invoice download button on success screen |
| `frontend/src/pages/Orders.tsx` | Modified | Invoice download link per order |

---

## Suggested Commit Plan

```
# Commit 1: UI/data fixes (Part A)
git add backend/prisma/seed.ts frontend/src/components/ frontend/src/pages/Landing.tsx \
        frontend/src/pages/Account.tsx frontend/src/pages/Login.tsx
git commit -m "fix: update seed data (42 products), category dropdown, stock labels, navbar polish"

# Commit 2: Story 16 — Order creation
git add backend/prisma/schema.prisma backend/src/services/orderService.ts \
        backend/src/routes/orders.ts backend/src/server.ts \
        frontend/src/types/index.ts frontend/src/pages/Payment.tsx \
        frontend/src/pages/Orders.tsx frontend/src/pages/Checkout.tsx
git commit -m "feat(story-16): order creation with stock decrement and cart finalization"

# Commit 3: Story 17 — Invoice PDF + email
git add backend/package.json backend/.env.example backend/src/config/env.ts \
        backend/src/services/invoiceService.ts backend/src/routes/orders.ts \
        frontend/src/pages/Payment.tsx frontend/src/pages/Orders.tsx
git commit -m "feat(story-17): invoice PDF generation and email delivery via Ethereal"

# Commit 4: Remaining frontend polish + README
git add frontend/src/pages/Cart.tsx frontend/src/App.tsx frontend/src/tests/ README.md
git commit -m "chore: checkout/payment UI polish, updated README with patch maps"
```

---

## Project Structure

```
backend/
  prisma/           schema.prisma, seed.ts
  src/
    config/          db.ts, env.ts
    middleware/       auth.ts, errorHandler.ts
    validators/      auth.ts, payment.ts
    services/        authService.ts, productService.ts, cartService.ts,
                     orderService.ts, invoiceService.ts
    routes/          auth.ts, products.ts, cart.ts, payment.ts, orders.ts
    types/           index.ts
    tests/           auth.test.ts
    server.ts

frontend/
  src/
    context/         AuthContext.tsx (untouched), CartContext.tsx (untouched)
    components/      Navbar.tsx, Footer.tsx, ProductCard.tsx, ProtectedRoute.tsx
    pages/           Landing.tsx, Login.tsx, Register.tsx, Account.tsx,
                     Orders.tsx, ProductDetail.tsx, Cart.tsx, Checkout.tsx, Payment.tsx
    services/        api.ts
    types/           index.ts
    tests/           smoke.test.tsx
    App.tsx, main.tsx, index.css, vite-env.d.ts
```
