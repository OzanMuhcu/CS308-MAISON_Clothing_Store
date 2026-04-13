# MAISON -- Online Clothing Store

A professional e-commerce application for a clothing brand, built as a CS 308 Software Engineering course project.

## Tech Stack

| Layer    | Technology                                                            |
|----------|-----------------------------------------------------------------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router, React Hook Form |
| Backend  | Node.js, Express, TypeScript, Prisma ORM, Zod validation             |
| Database | PostgreSQL                                                            |
| Auth     | bcrypt password hashing, JWT tokens                                   |
| Tests    | Jest (backend, 22 tests), Vitest (frontend, 2 smoke tests)           |

---

## Changelog

### Sprint 3 UI/Catalog Update (current)

**Seed data**: Expanded from 12 to 35 products across 7 balanced categories (Outerwear, Shirts, Trousers, Knitwear, Footwear, Accessories). Includes 4 out-of-stock items, 5 low-stock items (1-5 units), and the rest with normal stock (6-60 units).

**Landing page**: Removed the standalone "Featured / Curated" block entirely. The page now has a clean hero section (subtle gradient and texture pattern) followed directly by the product grid with category tabs. Search includes a magnifying glass icon. Category tabs are horizontally scrollable on mobile.

**Product cards**: Stock status with count is now visible next to the product name on every card without clicking. Format: "In stock (N)" / "Only N left" / "Out of stock".

**Navbar**: Replaced text-based "Bag" link with an SVG shopping bag icon with count badge. Replaced inline username display with an initials avatar that opens a click-only dropdown menu containing Profile, Order History, and Sign Out. Dropdown closes on outside click and ESC key. Removed all "demo" labels.

**Account page**: Added initials avatar header. Removed demo references. Address form section and Order History placeholder are structurally ready for future stories.

**Order History page**: New `/orders` route with a professional placeholder. Linked from the navbar dropdown.

**Login page**: Removed the demo accounts block at the bottom.

**Checkout page**: Polished with bordered card containers, chevron breadcrumbs, item count header, cleaner total section.

**Payment page**: Polished with bordered form container, loading spinner on the Pay button during validation, consistent breadcrumbs and typography.

### Sprint 3 (previous)

**Bugfix**: Guest cart sync timing -- moved `setUser()` after `await syncGuestCart()` in AuthContext so server cart is populated before CartContext fetches it. Added guest-item state clearing in CartContext when user becomes truthy.

**Story 13**: Checkout page at `/checkout` with order summary.

**Story 15**: Payment page at `/payment` with mock card validation (frontend + backend `POST /api/payment/validate`).

**Story 18**: Authentication foundation, landing enhancements, account page.

---

## How to Run Locally

### Prerequisites

1. **Node.js 20+**: https://nodejs.org (LTS). Verify: `node --version`
2. **PostgreSQL 14+**: macOS: `brew install postgresql@16 && brew services start postgresql@16` / Windows: https://www.postgresql.org/download/windows/

### Step 1: Create the Database

```bash
# macOS
createdb clothingstore

# Windows
psql -U postgres -c "CREATE DATABASE clothingstore;"
```

### Step 2: Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your DATABASE_URL:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/clothingstore?schema=public"
```

```bash
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

| Email              | Role            |
|--------------------|-----------------|
| customer@demo.com  | Customer        |
| sales@demo.com     | Sales Manager   |
| product@demo.com   | Product Manager |

---

## Running Tests

```bash
cd backend && npm test    # 22 tests
cd frontend && npm test   # 2 smoke tests
```

---

## Manual Regression Checklist (Section A -- must all pass)

### A1: Guest to login immediate cart merge

- [ ] Open incognito browser (fresh localStorage)
- [ ] Browse landing page, add 2 different products to cart as guest
- [ ] Verify navbar cart icon shows count badge = 2
- [ ] Navigate to `/login`, sign in as `customer@demo.com` / `password123`
- [ ] Navigate to `/cart`
- [ ] **VERIFY**: both guest-added items visible immediately -- no empty cart, no delay

### A2: Logout clears user cart from guest view

- [ ] While logged in with items in cart, click Sign Out from dropdown
- [ ] Navigate to `/cart`
- [ ] **VERIFY**: cart is empty (guest view does not show server cart items)

### A3: Logged-in cart persistence

- [ ] Log in, add 3 products to cart
- [ ] Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] **VERIFY**: all 3 items still in cart
- [ ] Log out, then log back in
- [ ] **VERIFY**: all 3 items still in cart (server-side persistence)

### A4: No ghost delayed appearance

- [ ] Repeat A1, but after login go directly to `/cart`
- [ ] **VERIFY**: items appear on first load, not after adding another item

---

## Manual UI Checklist

### Landing Page

- [ ] No "Featured" or "Curated" standalone block exists
- [ ] Hero section has subtle gradient/texture (not flat black)
- [ ] Category tabs appear below the "Collection" header
- [ ] "All" tab is active by default showing all products
- [ ] Clicking a category tab filters to that category
- [ ] Clicking the same active tab or "All" resets to all products
- [ ] Tabs scroll horizontally on mobile
- [ ] Search field has magnifying glass icon
- [ ] Search filters by name (type "cashmere" -> shows Cashmere Crew Sweater)
- [ ] Search filters by description (type "selvedge" -> shows denim items)
- [ ] Sort by "Price: Low to High" works correctly
- [ ] Sort by "Price: High to Low" works correctly
- [ ] Product count updates when filtering
- [ ] ~35 products visible when no filters applied

### Product Cards (stock label)

- [ ] Each card shows stock status next to the product name
- [ ] In-stock items show "In stock (N)" with the count
- [ ] Low-stock items (1-5) show "Only N left" in amber
- [ ] Out-of-stock items show "Out of stock" in red
- [ ] Out-of-stock items have "Sold Out" overlay on image
- [ ] Labels are subtle and don't dominate the card

### Navbar

- [ ] Cart is shown as an SVG bag icon (no text)
- [ ] Cart count badge appears on the icon when items present
- [ ] When logged out: "Sign In" text link on right side
- [ ] When logged in: circular avatar with initials replaces "Sign In"
- [ ] No raw username string displayed in navbar
- [ ] No "demo" label anywhere
- [ ] Clicking avatar opens dropdown menu
- [ ] Dropdown contains: Profile, Order History, Sign Out
- [ ] Clicking outside dropdown closes it
- [ ] Pressing ESC closes dropdown
- [ ] Dropdown does NOT open on hover (click only)
- [ ] "Profile" navigates to `/account`
- [ ] "Order History" navigates to `/orders`
- [ ] "Sign Out" logs out and navigates to home

### Checkout Page

- [ ] Cart -> click "Proceed to Checkout" -> arrives at `/checkout`
- [ ] Breadcrumb shows Cart > **Checkout** > Payment (with chevron separators)
- [ ] Items displayed in a bordered card with count header
- [ ] Each item shows image, name, SKU, quantity, line total
- [ ] Totals section shows subtotal, shipping note, and total
- [ ] "Continue to Payment" is the primary action button
- [ ] "Back to Cart" link below
- [ ] Visiting `/checkout` while not logged in redirects to `/login`
- [ ] Visiting `/checkout` with empty cart shows empty state

### Payment Page

- [ ] Checkout -> click "Continue to Payment" -> arrives at `/payment`
- [ ] Breadcrumb shows Cart > Checkout > **Payment**
- [ ] Amount due shown clearly below heading
- [ ] Card form is inside a bordered container
- [ ] Card number auto-formats with spaces
- [ ] Expiry auto-formats to MM/YY
- [ ] Submitting empty form shows field-level errors
- [ ] Invalid card number shows "Card number must be exactly 16 digits"
- [ ] Expired date shows "Card has expired"
- [ ] 2-digit CVV shows "CVV must be exactly 3 digits"
- [ ] During validation, Pay button shows loading spinner
- [ ] Valid card (4111111111111111 / 12/30 / 123) shows success screen
- [ ] Success screen does not say "demo" or "mock"
- [ ] "Back to Checkout" link below form

### Account & Orders

- [ ] `/account` shows avatar with initials, name, email
- [ ] No "demo" text anywhere on account page
- [ ] Address form section present
- [ ] Order History section shows placeholder
- [ ] `/orders` page shows professional empty state with "Start Shopping" link

---

## API Reference

### Public
```
GET  /api/health               -> { status, timestamp }
GET  /api/products              -> Product[]
GET  /api/products/categories   -> string[]
GET  /api/products/:id          -> Product
```

### Auth
```
POST /api/auth/register         -> { user, token }
POST /api/auth/login            -> { user, token }
GET  /api/auth/me               -> User (protected)
```

### Cart (protected)
```
GET    /api/cart                 -> CartItem[]
POST   /api/cart/items           -> CartItem
PATCH  /api/cart/items/:id       -> CartItem
DELETE /api/cart/items/:id       -> { message }
POST   /api/cart/sync            -> CartItem[]
```

### Payment (protected)
```
POST /api/payment/validate      -> { ok: boolean, message?: string }
```

---

## Features NOT Implemented Yet

- Order creation and confirmation (Story 16)
- Order tracking and history population (Story 17)
- Address persistence to database (Story 14)
- Discounts, wishlists, reviews, invoices, delivery tracking, refunds
- Sales manager and product manager dashboards

---

## Project Structure

```
backend/
  prisma/           schema.prisma, seed.ts (35 products)
  src/
    config/          db.ts, env.ts
    middleware/       auth.ts, errorHandler.ts
    validators/      auth.ts, payment.ts
    services/        authService.ts, productService.ts, cartService.ts
    routes/          auth.ts, products.ts, cart.ts, payment.ts
    types/           index.ts
    tests/           auth.test.ts (22 tests)
    server.ts

frontend/
  src/
    context/         AuthContext.tsx, CartContext.tsx
    components/      Navbar.tsx, Footer.tsx, ProductCard.tsx, ProtectedRoute.tsx
    pages/           Landing.tsx, Login.tsx, Register.tsx, Account.tsx,
                     Orders.tsx, ProductDetail.tsx, Cart.tsx, Checkout.tsx, Payment.tsx
    services/        api.ts
    types/           index.ts
    tests/           smoke.test.tsx (2 tests)
    App.tsx, main.tsx, index.css, vite-env.d.ts
```
