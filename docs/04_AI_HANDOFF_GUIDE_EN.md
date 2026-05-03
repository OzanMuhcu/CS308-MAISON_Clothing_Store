# MAISON — AI Handoff Guide (EN)
**Goal:** Help each teammate use their own AI assistant safely on the **current MAISON codebase** (Sprint 3 baseline + Sprint 4 work) without breaking anything.

This is the “one file” to share with teammates so they can:
- understand what exists today,
- know what must never regress,
- implement Sprint 4 stories incrementally,
- add tests and prepare clean commits/PRs.

Last updated: **2026-05-03**

---

## 0) Project snapshot (what this repo is)
**Domain:** clothing e‑commerce store (CS308)

**Stack**
- Backend: Node.js + TypeScript + Express + Prisma + PostgreSQL
- Frontend: React + TypeScript + Vite + Tailwind + React Router
- Tests: Backend **Jest**, Frontend **Vitest + RTL**

**Golden rule:** Code is the source of truth. Docs may be outdated.

---

## 1) Non‑negotiable regression checklist (Sprint 3 core)
These must still work after ANY change. If your AI touches these areas, you must re-test them.

### Cart / Auth invariants
1) **Guest cart → login/register → immediate merge**
   - Guest adds items → login/register → items appear immediately in user cart (no “appears later after adding another item”).

2) **Logout isolation**
   - After logout, guest view must NOT show the authenticated cart.

3) **Logged‑in cart persistence**
   - Login, add items, refresh/logout+login → cart still has those items.

### Purchase flow invariants
4) **Checkout → Payment (mock)**
   - Payment is fake; validate input but never store card data.

5) **Order success effects**
   - Order saved, stock decreases, cart clears/finalizes **only after order success** (transactional).

6) **Invoice**
   - Invoice PDF downloadable and contains required fields.
   - Email may use Ethereal fallback; real delivery requires SMTP env.

### UI invariants
7) **Out-of-stock behavior**
   - Out-of-stock products still visible/searchable but cannot be added to cart.
8) **Image reliability**
   - Broken URLs should not break UI; show placeholder fallback.

**After any change, run:**
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`

---

## 2) Repo map (what your AI must inspect first)
Ask your AI to open and confirm these files before coding:

### Backend
- `backend/src/server.ts` (routes registered under `/api`)
- `backend/src/routes/*` (auth/products/cart/payment/orders/users/wishlist/reviews)
- `backend/prisma/schema.prisma` (models + enums + relations)
- `backend/prisma/seed.ts` (demo users/products/images/stock)
- `backend/src/middleware/auth.ts` (JWT + role checks)
- `backend/src/config/db.ts` (Prisma client)

### Frontend
- `frontend/src/App.tsx` (routes)
- `frontend/src/services/api.ts` (API wrapper, token handling)
- `frontend/src/context/AuthContext.tsx` (login/register + cart sync timing)
- `frontend/src/context/CartContext.tsx` (guest vs user cart; localStorage; server cart)
- `frontend/src/pages/*` (Landing/ProductDetail/Cart/Checkout/Payment/Orders/Account/Wishlist)
- `frontend/src/components/*` (Navbar/ProductCard/ProtectedRoute)

---

## 3) Sprint 3 recap (Stories 13–18)
This is your stable baseline.

- **Story 13 — Checkout page + order summary**
  - Cart → Checkout route; summary shown before payment.

- **Story 14 — Address selection/entry (readiness)**
  - Default address (profile) vs one‑time address (checkout).
  - **Order must store address snapshot** so past orders don’t change when profile changes.

- **Story 15 — Payment form + validation**
  - Frontend + backend validation (16-digit card number, expiry MM/YY not past, 3-digit CVV). Mock only.

- **Story 16 — Order creation + stock update + cart finalization**
  - Create Order + OrderItems; decrement stock; clear cart only after successful order (transaction).

- **Story 17 — Invoice PDF + email delivery**
  - Generate invoice PDF; download/view; email via Ethereal/SMTP.

- **Story 18 — Landing + account enhancements**
  - Better browsing/search/sort/category; professional header/account UI; stock display.

---

## 4) Sprint 4 — COMPLETE story list (19–34)
**Important:** Do not claim “implemented” unless you verify by file paths + manual test + unit tests.
Use this as your Sprint 4 checklist.

### Wishlist (Stories 19–22)
**Story 19 — Wishlist Data Model and Backend**
- DB models: Wishlist + WishlistItem
- Backend endpoints: create/list/delete wishlists; add/remove items
- Auth-only access

**Story 20 — Wishlist Creation and Naming**
- UI: create wishlists with custom name
- Prevent duplicate wishlist names per user
- Show wishlists on account page

**Story 21 — Add and Remove Products in Wishlist**
- Add-to-wishlist action on product pages
- Remove products from wishlists
- Allow adding out-of-stock products to wishlists

**Story 22 — Wishlist Page and Product Listing**
- Wishlist detail page shows saved products
- Group by wishlist name
- Navigate to product detail from wishlist

### Reviews/Ratings/Comments (Stories 23–26)
**Story 23 — Comment and Rating Eligibility Rules**
- Only users who purchased AND received (delivered) can comment/rate
- Eligibility checks for comment and rating are independent

**Story 24 — Comment Submission with Pending Status**
- Comment form on product page
- Save comments as `pending`
- Pending comments not public

**Story 25 — Rating Submission and Product Rating Update**
- Rating input on product page
- Update average rating and rating count after valid save

**Story 26 — Rating-Based Sorting and Accepted Comment Display**
- Sort products by popularity/rating
- Show ONLY accepted comments on product page
- Product page refreshes after DB approval

### Sales Manager / Admin (Stories 27–34)
**Story 27 — Sales Manager Role and Admin Redirect**
- Create/configure one sales manager user in seed
- Sales manager login redirects to admin interface
- Protect admin routes (sales manager only)

**Story 28 — Sales Manager Product Management Tab**
- Admin tab lists products
- Edit product price
- Edit discount value (default 0)

**Story 29 — Wishlist Discount Notification by Email**
- When discount updated, detect users whose wishlists contain product
- Trigger email notification during product edit flow

**Story 30 — Sales Manager Orders Tab and Customer Information**
- Admin orders tab lists all orders
- Show customer info next to each order
- Reuse order/invoice structures

**Story 31 — Invoice PDF Download and Order Date Filtering**
- Admin orders tab: invoice PDF download
- Filter orders by start/end date

**Story 32 — Revenue Chart for Selected Date Range**
- Calculate revenue for chosen date range
- Render chart (x-axis date, y-axis revenue)
- Refresh chart when filters change

**Story 33 — Refund Request Tab and Refund Review Flow**
- Admin tab lists refund requests with order+user info
- Accept / reject refund requests

**Story 34 — Cancel / Refund Rules and Stock Update Logic**
- Direct cancellation allowed for `processing`
- Refund requests only for delivered orders within 30 days
- Increase stock when cancellation/refund accepted

---

## 5) How to ask an AI to implement a ticket (safe template)
Copy/paste this template to your AI:

**Ticket:** <Story ID or Bug ID>  
**Goal:** <1–2 sentences>  
**Acceptance criteria:**  
- <bullet list>  
**Scope boundary (must not break):** Sprint 3 regression checklist (Section 1)  
**Files likely involved:**  
- Backend: <routes/services/schema>  
- Frontend: <pages/components/context>  
**Tests required:**  
- Backend Jest (mock Prisma; no real DB)  
- Frontend Vitest (mock API; no real network)  
**Output required:**  
- Patch Map (files changed + reason)  
- Manual test checklist  
- Commands to run tests  

**Extra rule:** Do not create parallel logic inside tests; prefer importing validators/services.

---

## 6) Testing & quality requirements
### Backend unit tests (Jest)
- Prefer mocking Prisma (`jest.mock` on the Prisma client module).
- Add tests for:
  - route validation (Zod)
  - service logic (transactions / stock rules)
  - role/ownership access controls

### Frontend tests (Vitest + RTL)
- Do not call real backend.
- Mock `frontend/src/services/api.ts`.
- Prefer `findBy*` / `waitFor` for async UI effects.
- Avoid flaky timers/sleeps.

**Commands**
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`

---

## 7) Commit slicing (so each teammate commits only their part)
When multiple people own different stories, ask AI to include a **Patch Map**.

### Patch Map format
- **Story XX Patch Map**
  - file path → what changed (1 line)

Then each teammate commits only their story’s files.

---

## 8) Common Sprint 4 pitfalls (what breaks the project)
1) **Delivered eligibility lock**
   - If reviews require “delivered” but there is no way to mark delivered, ratings/comments will be blocked.
   - Solution: implement a safe admin endpoint to set order status OR adjust eligibility rules per course instructions.

2) **CORS / port mismatch**
   - Strict CORS can break product loading when Vite picks a new port.
   - Use a dev-friendly localhost strategy or document required ports.

3) **Image reliability**
   - Seed URLs can fail → add `onError` placeholder fallback and validate seed imageUrl values.

4) **Payment scope creep**
   - Never store or process real card data.

---

## 9) Running the project (reference)
Backend:
```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---
