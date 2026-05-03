# MAISON — Online Clothing Store

MAISON is a full-stack e-commerce web application built for the CS308 Software Engineering course at Sabancı University. It lets shoppers browse a curated clothing catalogue, manage a shopping cart, complete a checkout and payment flow, download invoice PDFs, and organize personal wishlists. Three distinct user roles exist: **customer**, **sales manager**, and **product manager**, each with different permissions.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Repository Structure](#repository-structure)
3. [Sprint Status](#sprint-status)
4. [Setup and Run](#setup-and-run)
5. [Demo Users and Roles](#demo-users-and-roles)
6. [Testing](#testing)
7. [API Quick Reference](#api-quick-reference)
8. [Troubleshooting](#troubleshooting)
9. [Contribution Workflow](#contribution-workflow)

---

## Tech Stack

### Frontend

| Tool | Version / Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| react-hook-form | Form state and validation |
| axios | HTTP client |
| Vitest + @testing-library/react | Component and integration tests |

### Backend

| Tool | Version / Purpose |
|---|---|
| Node.js + Express + TypeScript | HTTP server |
| Prisma ORM + PostgreSQL | Database access and migrations |
| Zod | Request body validation |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| pdfkit | Invoice PDF generation |
| nodemailer | Email delivery (Ethereal in development, real SMTP in production) |
| Jest + ts-jest | Unit tests |

---

## Repository Structure

```
CS308-MAISON_Clothing_Store/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      Data models, enums, and relations
│   │   ├── migrations/        Auto-generated migration SQL files
│   │   └── seed.ts            Demo users, 42 products, sample orders and wishlists
│   ├── src/
│   │   ├── routes/            Express route handlers
│   │   │   ├── auth.ts        Register, login, /me
│   │   │   ├── products.ts    Product listing and detail (public)
│   │   │   ├── cart.ts        Cart CRUD and guest-cart sync
│   │   │   ├── payment.ts     Card validation endpoint
│   │   │   ├── orders.ts      Order creation, listing, invoice download
│   │   │   ├── users.ts       Saved cards and saved addresses
│   │   │   ├── wishlist.ts    Wishlist and item management
│   │   │   └── reviews.ts     Ratings, comments, moderation
│   │   ├── services/          Business logic (auth, cart, order, product, invoice)
│   │   ├── middleware/        JWT authentication guard
│   │   └── tests/             Jest unit test suites (6 files, 65 tests)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             Route-level page components
│   │   ├── components/        Navbar, Footer, ProductCard, ProtectedRoute
│   │   ├── context/           AuthContext, CartContext
│   │   ├── services/          Axios API client (api.ts)
│   │   └── tests/             Vitest component tests (5 files, 26 tests)
│   ├── .env.example
│   └── package.json
└── README.md
```

**Database schema models:** User, UserAddress, SavedCard, Product, CartItem, Order, OrderItem, Wishlist, WishlistItem, Rating, Comment.

**Roles:** `customer`, `sales_manager`, `product_manager`.

---

## Sprint Status

### Sprint 3 — Stories 13–18

| Story | Description | Status |
|---|---|---|
| 13 | Checkout flow — address selection, order summary, navigation from cart to payment | **Implemented** — `Checkout.tsx`, `POST /api/orders` |
| 14 | Saved address entry and selection — users can save multiple addresses and reuse them at checkout | **Implemented** — `UserAddress` model, `/api/users/me/addresses`, `Checkout.tsx` |
| 15 | Payment form and card validation — cardholder name, 16-digit number, MM/YY expiry, 3-digit CVV with inline error messages | **Implemented** — `Payment.tsx` (react-hook-form), `POST /api/payment/validate` |
| 16 | Order creation, stock decrement, cart clearance — transaction creates the order, decrements stock, and empties the cart | **Implemented** — `orderService.ts`, `POST /api/orders` |
| 17 | Invoice PDF generation and email delivery — PDF generated with pdfkit; email sent via nodemailer with Ethereal fallback | **Implemented** — `invoiceService.ts`, `GET /api/orders/:id/invoice` |
| 18 | Landing page enhancements and account page — product listing with search/filter/sort, saved cards and addresses on account | **Implemented** — `Landing.tsx`, `Account.tsx` |

### Sprint 4

#### Bugs

| ID | Description | Status |
|---|---|---|
| DEV-113 | Postal code validation — must be exactly 5 digits | **Implemented** — Zod in `orders.ts`, regex in `Checkout.tsx` |
| DEV-114 | Guest cart merge timing — guest items lost when login triggers a simultaneous server fetch | **Implemented** — `AuthContext.tsx` completes `syncGuestCart` before setting user state |
| DEV-112 | Invoice email not delivered — empty SMTP config caused silent failure | **Implemented** — `invoiceService.ts` auto-provisions an Ethereal account when SMTP fields are blank; preview URL appears in backend logs |
| DEV-109 | Product images showing as unavailable | **Partially Addressed** — seed populates Unsplash CDN URLs; images load only when Unsplash is reachable from the network |
| DEV-111 | Incorrect product images — wrong photo shown for some products | **Partially Addressed** — seed revised; a small number of products still share photo IDs |

#### Wishlist — Stories 19–22

| Story | Description | Status |
|---|---|---|
| 19 | Wishlist data model | **Implemented** — `Wishlist` and `WishlistItem` in `schema.prisma` |
| 20 | Create wishlists with names | **Implemented** — `POST /api/wishlists` with Zod name validation (1–40 chars); create form in `Wishlist.tsx` |
| 21 | Add and remove items from a wishlist | **Implemented** — `POST /api/wishlists/:id/items`, `DELETE /api/wishlists/:id/items/:productId`; add button in `ProductDetail.tsx` |
| 22 | Wishlist page and product listing | **Implemented** — `Wishlist.tsx` page; wishlists shown as a sidebar list in `Account.tsx` |

#### Reviews and Ratings — Stories 23–26

| Story | Description | Status |
|---|---|---|
| 23 | Eligibility — only customers with a delivered order for that product can rate or comment | **Implemented** — `hasDeliveredOrder` check in `reviews.ts` |
| 24 | Comment submission with pending status — comments are held for moderation before appearing | **Implemented** — `CommentStatus` enum (`pending`/`approved`/`rejected`); `POST /api/reviews/comment`; product manager approves via `PATCH /api/reviews/comment/:id/status` |
| 25 | Submit and update ratings — star rating (1–5); `avgRating` and `ratingCount` updated on the Product record | **Implemented** — `POST /api/reviews/rate`; `Rating` model; `Product.avgRating` and `Product.ratingCount` fields |
| 26 | Rating-based sort and approved comment display | **Implemented** — `productService.ts` handles `sort=rating_desc`; Landing.tsx "Rating: Highest" option; `ProductDetail.tsx` renders only `approved` comments |

#### Manager and Admin Flows — Stories 27–34

| Story | Description | Status |
|---|---|---|
| 27 | Sales manager role and post-login redirect | **Partially Implemented** — `sales_manager` role exists in schema and seed; `Account.tsx` displays the role label. No dedicated dashboard or redirect. |
| 28 | Product management tab — create, update, delete products | **Not Implemented** — no frontend page or backend CRUD routes for managers |
| 29 | Wishlist discount notification email | **Not Implemented** — no backend service or route |
| 30 | Manager orders tab with customer details | **Not Implemented** — `GET /api/orders` returns the authenticated user's own orders only; no manager-scoped view |
| 31 | Invoice PDF download with filter for managers | **Partially Implemented** — `GET /api/orders/:id/invoice` works for any authenticated user's own orders; no manager-level filter endpoint |
| 32 | Revenue chart | **Not Implemented** — no analytics or revenue endpoint |
| 33 | Refund request flow | **Not Implemented** — no refund routes or model fields |
| 34 | Cancel and refund rules with stock update | **Not Implemented** — no cancel or refund logic |

---

## Setup and Run

### Prerequisites

- Node.js 18 or later
- PostgreSQL running locally (Postgres.app works well on macOS)
- A PostgreSQL user with permission to create databases

### Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and update `DATABASE_URL` to match your PostgreSQL setup:

```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/maison_sprint4?schema=public"
```

The `.env.example` uses `maison_sprint3` as the default database name. You can use any name — create the database in PostgreSQL first (e.g. `CREATE DATABASE maison_sprint4;`).

Leave all `SMTP_*` fields blank to use Ethereal for email testing. When the backend starts, it will print an Ethereal preview URL for each email sent. To send real emails, fill in all four SMTP fields.

```bash
npm install
npm run db:generate   # generates the Prisma client from schema.prisma
npm run db:migrate    # applies migrations to the database
npm run db:seed       # loads demo users, products, orders, and wishlists
npm run dev           # starts the server with hot reload
```

The backend listens on `http://localhost:4000` by default. To change the port, set `PORT` in `.env`.

### Frontend

```bash
cd frontend
cp .env.example .env
```

The default `VITE_API_URL=http://localhost:4000/api` matches the backend default. Change it only if you changed `PORT`.

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

### Resetting the database

To wipe all data and re-seed from scratch:

```bash
cd backend
npm run db:reset    # drops and recreates all tables (uses --force, no prompt)
npm run db:seed     # re-loads demo data
```

---

## Demo Users and Roles

These accounts are created by `npm run db:seed`. All passwords are `password123`.

| Email | Role | Notes |
|---|---|---|
| `customer@demo.com` | customer | Has 3 sample orders (delivered, processing, in-transit), 2 wishlists |
| `sales@demo.com` | sales_manager | Sales manager role; no dedicated UI yet (Sprint 4) |
| `product@demo.com` | product_manager | Can approve or reject pending comments via the API |

---

## Testing

### Backend — Jest

```bash
cd backend
npm test
```

| Suite | File | Tests |
|---|---|---|
| Auth schemas + JWT + bcrypt | `auth.test.ts` | 22 |
| Cart schemas + service | `cart.test.ts` | 13 |
| Invoice PDF generation | `invoice.test.ts` | 5 |
| Order schemas + service | `orders.test.ts` | 8 |
| Reviews schemas | `reviews.test.ts` | 10 |
| Wishlist schemas | `wishlist.test.ts` | 7 |
| **Total** | 6 suites | **65** |

All backend tests run without a live database. Prisma is mocked at the module level so no `DATABASE_URL` is needed to run them.

### Frontend — Vitest

```bash
cd frontend
npm test
```

| Suite | File | Tests |
|---|---|---|
| Login and Register pages | `smoke.test.tsx` | 2 |
| Cart page — items, totals, guest/logged-in states | `cart-flow.test.tsx` | 6 |
| Checkout and Payment page rendering | `checkout-flow.test.tsx` | 5 |
| Payment form fields and validation errors | `payment-validation.test.tsx` | 7 |
| Wishlist page — empty state, create form, existing lists | `wishlist-smoke.test.tsx` | 6 |
| **Total** | 5 suites | **26** |

All API calls are mocked with `vi.mock`. No backend needs to be running.

---

## API Quick Reference

All routes are prefixed with `/api`. Routes marked **auth** require a `Bearer <token>` header. Routes marked **manager** additionally require the `product_manager` role.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create a new customer account |
| POST | `/auth/login` | — | Returns a JWT token |
| GET | `/auth/me` | auth | Returns the authenticated user's profile |

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | — | List products; supports `?search=`, `?category=`, `?sort=price_asc\|price_desc\|name_asc\|rating_desc` |
| GET | `/products/categories` | — | List all distinct category names |
| GET | `/products/:id` | — | Product detail with stock and rating summary |

### Cart

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cart` | auth | Get current cart items |
| POST | `/cart/items` | auth | Add a product to cart |
| PATCH | `/cart/items/:id` | auth | Update item quantity |
| DELETE | `/cart/items/:id` | auth | Remove an item |
| POST | `/cart/sync` | auth | Merge a guest cart after login |

### Payment and Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payment/validate` | auth | Validate card details |
| POST | `/orders` | auth | Create order, decrement stock, clear cart, send invoice email |
| GET | `/orders` | auth | List the user's orders |
| GET | `/orders/:id` | auth | Get a single order with items |
| GET | `/orders/:id/invoice` | auth | Download invoice as a PDF |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/users/me/addresses` | auth | List or add saved addresses |
| PUT/DELETE | `/users/me/addresses/:id` | auth | Update or delete a saved address |
| GET/POST | `/users/me/cards` | auth | List or add saved cards |
| PUT/DELETE | `/users/me/cards/:id` | auth | Update or delete a saved card |

### Wishlist

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/wishlists` | auth | List or create wishlists |
| DELETE | `/wishlists/:id` | auth | Delete a wishlist |
| GET/POST | `/wishlists/:id/items` | auth | List items or add a product to a wishlist |
| DELETE | `/wishlists/:id/items/:productId` | auth | Remove a product from a wishlist |

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reviews/product/:productId` | — | Public ratings and approved comments for a product |
| POST | `/reviews/rate` | auth | Submit or update a 1–5 star rating (requires delivered order) |
| POST | `/reviews/comment` | auth | Submit a comment (requires delivered order; starts as pending) |
| GET | `/reviews/my/:productId` | auth | Get the authenticated user's rating and comment for a product |
| GET | `/reviews/pending` | manager | List all pending comments awaiting approval |
| PATCH | `/reviews/comment/:id/status` | manager | Approve or reject a pending comment |

---

## Troubleshooting

**`jest: command not found` or `vitest: command not found`**
Run `npm install` in the relevant directory (`backend/` or `frontend/`). The test runners are local dev dependencies.

**`npm run db:seed` errors on first run**
Make sure `npm run db:migrate` has been run first so the tables exist. If you get a "relation does not exist" error, also run `npm run db:generate` to rebuild the Prisma client.

**`Cannot connect to database`**
Confirm PostgreSQL is running and the database named in `DATABASE_URL` exists. Create it manually if needed: `CREATE DATABASE maison_sprint4;` in psql.

**Product images show as "Image unavailable"**
Product images load from Unsplash CDN URLs (set in `seed.ts`). If Unsplash is unreachable from your network, images will not load. This is a network/CDN dependency, not a server error.

**Invoice email preview not appearing**
If all SMTP fields in `.env` are blank, the backend auto-provisions an Ethereal test account. Look for a line starting with `Invoice email preview:` in the backend terminal output. Click the URL to view the email in a browser.

**Invoice email not sending with real SMTP**
Fill in all four SMTP fields: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. Also set `SMTP_FROM` to a valid sender address. Restart the backend after changing `.env`.

**Postal code validation rejects a valid code**
Both the frontend (`Checkout.tsx`) and backend (`orders.ts` Zod schema) enforce exactly 5 numeric digits. Codes with letters, spaces, or fewer/more digits are rejected by design.

**Guest cart items disappear after login**
This was bug DEV-114. The fix (in `AuthContext.tsx`) ensures the guest cart is synced to the server before the user state is set, preventing a race condition. If you see this during testing, check that the `POST /api/cart/sync` request in the Network tab completes successfully before the `GET /api/cart` request fires.

**`npm run db:reset` drops data I needed**
`db:reset` runs `prisma migrate reset --force` which deletes all data. Run `npm run db:seed` immediately after to restore the demo dataset.

---

## Contribution Workflow

1. **Branch per story.** Create a branch named after the story or ticket, for example `feature/story-27-manager-redirect` or `fix/dev-113-postal-validation`.

2. **Keep `main` stable.** Do not push directly to `main`. Open a pull request and wait for at least one review before merging.

3. **Commit messages.** Use the format: `type(scope): short description`. Examples:
   - `feat(orders): add invoice download endpoint`
   - `fix(checkout): enforce 5-digit postal code`
   - `test(cart): add unit tests for syncCart`

4. **Before opening a PR:**
   - Run `cd backend && npm test` — all 65 tests must pass.
   - Run `cd frontend && npm test` — all 26 tests must pass.
   - Manually verify the feature in the browser.

5. **What to include in a PR description:** link to the story/ticket, a brief explanation of what changed and why, and a short manual test plan.

Additional workflow details may be found in the `docs/` folder, but note that the `docs/` folder may not be fully up to date with the current sprint.
