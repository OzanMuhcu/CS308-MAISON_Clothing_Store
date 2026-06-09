# MAISON — Online Clothing Store

MAISON is a full-stack e-commerce web application built for the CS308 Software Engineering course at Sabancı University. It lets shoppers browse a curated clothing catalogue, manage a shopping cart, complete a checkout and payment flow, download invoice PDFs, and organise personal wishlists. Three distinct user roles exist: **customer**, **sales manager**, and **product manager**, each with different permissions and dashboards.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Repository Structure](#repository-structure)
3. [Features by Role](#features-by-role)
4. [Setup and Run](#setup-and-run)
5. [Demo Users and Roles](#demo-users-and-roles)
6. [Testing](#testing)
7. [API Quick Reference](#api-quick-reference)
8. [Troubleshooting](#troubleshooting)
9. [Security Notes](#security-notes)

---

## Tech Stack

### Frontend

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| react-hook-form | Form state and validation |
| axios | HTTP client |
| Vitest + @testing-library/react | Component tests (jsdom environment) |

### Backend

| Tool | Purpose |
|---|---|
| Node.js + Express + TypeScript | HTTP server |
| Prisma ORM + PostgreSQL | Database access and migrations |
| Zod | Request body validation |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| pdfkit | Invoice PDF generation |
| nodemailer | Email delivery (Ethereal fallback in development, real SMTP in production) |
| Jest + ts-jest | Unit tests |

---

## Repository Structure

```
CS308-MAISON_Clothing_Store/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       Data models, enums, and relations
│   │   ├── migrations/         Auto-generated migration SQL files
│   │   └── seed.ts             Demo users, products, orders, and wishlists
│   ├── src/
│   │   ├── config/             env.ts (typed env vars), db.ts (Prisma client)
│   │   ├── routes/             Express route handlers
│   │   │   ├── auth.ts         Register, login, /me
│   │   │   ├── products.ts     Public list/detail + manager/admin endpoints
│   │   │   ├── cart.ts         Cart CRUD and guest-cart sync
│   │   │   ├── payment.ts      Card validation
│   │   │   ├── orders.ts       Order creation, listing, cancel, refund, invoices
│   │   │   ├── users.ts        Saved cards and saved addresses
│   │   │   ├── wishlist.ts     Wishlist and item management
│   │   │   ├── reviews.ts      Ratings, comments, moderation
│   │   │   └── categories.ts   Category CRUD (public + product manager)
│   │   ├── services/           Business logic
│   │   │   ├── authService.ts
│   │   │   ├── cartService.ts
│   │   │   ├── categoryService.ts
│   │   │   ├── discountNotificationService.ts
│   │   │   ├── discountUtils.ts
│   │   │   ├── invoiceService.ts
│   │   │   ├── orderService.ts
│   │   │   └── productService.ts
│   │   ├── middleware/         authenticate (JWT), authorize (role guard), errorHandler
│   │   └── tests/              Jest unit test suites (10 files, 161 tests)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              Route-level page components
│   │   │   ├── Landing.tsx, Login.tsx, Register.tsx
│   │   │   ├── ProductDetail.tsx, Cart.tsx, Checkout.tsx, Payment.tsx
│   │   │   ├── Account.tsx, Orders.tsx, Wishlist.tsx
│   │   │   ├── Admin.tsx              (sales manager dashboard — /admin)
│   │   │   ├── ProductManagerAdmin.tsx (product manager dashboard — /pm-admin)
│   │   │   └── About.tsx, Careers.tsx, Contact.tsx, Shipping.tsx, SizeGuide.tsx, Sustainability.tsx
│   │   ├── components/         Navbar, Footer, ProductCard, ProtectedRoute,
│   │   │                       SalesManagerRoute, ProductManagerRoute
│   │   ├── context/            AuthContext.tsx, CartContext.tsx
│   │   ├── services/           api.ts (Axios client)
│   │   ├── types/              Shared TypeScript types
│   │   └── tests/              Vitest component tests (11 files, 125 tests)
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

**Database schema models:** User, UserAddress, SavedCard, Product, Category, CartItem, Order, OrderItem, RefundRequest, Wishlist, WishlistItem, Rating, Comment.

**Roles:** `customer`, `sales_manager`, `product_manager`.

---

## Features by Role

### Customer

- Browse the product catalogue with search, category filter, and sort (price asc/desc, name, rating)
- View product detail pages with approved reviews and star ratings
- Add products to a cart; guest cart (localStorage) is merged into the server cart on login
- Checkout with a saved address or a one-time address (5-digit postal code enforced)
- Payment form with card validation (16-digit number, MM/YY expiry, 3-digit CVV)
- Order creation: stock decrements and cart clears atomically
- Download invoice PDFs for any order
- Track order status (processing → in transit → delivered / cancelled)
- Cancel a processing order
- Request a refund for a delivered order within a 30-day window
- Manage wishlists: create named lists, add/remove products
- Submit a 1–5 star rating for a product (requires a delivered order for that product)
- Submit a comment (requires a delivered order; comment is held for moderation before appearing)
- View approved comments on product pages

### Sales Manager (`/admin`)

- View and update product price and discount fields (discount name, type, percentage, date range)
- When a discount is saved, users who have that product in a wishlist receive an automated email notification
- View all orders with customer details and invoice download links
- Filter orders by date range and view a revenue summary with a bar chart
- View pending refund requests and approve or reject them

### Product Manager (`/pm-admin`)

- Create new products (name, SKU, description, model, warranty, distributor, stock, category)
- Edit existing products (non-price fields and stock quantity)
- Soft-remove a product (sets `isActive = false`; product is hidden from the public catalogue)
- Manage categories: create new categories, hide/show categories (hidden categories hide all their products from the public catalogue)
- View all orders with order status; advance order status (processing → in transit → delivered)
- Download invoice PDFs for any order
- Moderate pending comments: approve or reject

---

## Setup and Run

### Prerequisites

- Node.js 18 or later
- PostgreSQL running locally (Postgres.app works on macOS)
- A PostgreSQL user with permission to create databases

### Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to match your PostgreSQL setup, and replace `JWT_SECRET` with a long random string:

```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/maison_db?schema=public"
JWT_SECRET="replace-with-a-random-string-at-least-32-chars"
PORT=4000
```

For email: leave all `SMTP_*` fields blank to use Ethereal (a test mail service). The backend will print a preview URL to the terminal after each email. To send real email via Gmail, fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (Gmail app password), and `SMTP_FROM`.

```bash
npm install
npm run db:generate   # generates the Prisma client
npm run db:migrate    # applies all migrations to the database
npm run db:seed       # loads demo users, products, orders, and wishlists
npm run dev           # starts the server with hot reload
```

The backend listens on `http://localhost:4000` by default (controlled by `PORT` in `.env`).

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

The frontend runs at `http://localhost:5173` by default (set in `vite.config.ts`).

### Resetting the database

To wipe all data and re-seed from scratch:

```bash
cd backend
npm run db:reset    # drops and recreates all tables (no prompt — data is lost)
npm run db:seed     # re-loads demo data
```

---

## Demo Users and Roles

These accounts are created by `npm run db:seed`. All passwords are `password123`.

| Email | Role | Dashboard URL |
|---|---|---|
| `customer@demo.com` | customer | `/account`, `/orders`, `/wishlist` |
| `sales@demo.com` | sales_manager | `/admin` |
| `product@demo.com` | product_manager | `/pm-admin` |

Role-guarded routes redirect to `/login` if the user is unauthenticated, and to `/` if the role does not match.

---

## Testing

Run backend and frontend tests independently. No database or running server is required — all external dependencies are mocked.

### Backend — Jest

```bash
cd backend
npm test
npm run build
```

| Suite | File | Tests |
|---|---|---|
| Auth schemas + JWT + bcrypt + password change | `auth.test.ts` | 24 |
| Auth middleware (authenticate + authorize) | `authMiddleware.test.ts` | 10 |
| Cart schemas + service functions | `cart.test.ts` | 14 |
| Category service | `categoryService.test.ts` | 10 |
| Discount utilities (isDiscountActive, getEffectivePrice) | `discountUtils.test.ts` | 16 |
| Invoice PDF generation | `invoice.test.ts` | 6 |
| Order service (create/cancel/refund/status/list) | `orders.test.ts` | 30 |
| Product service (list/get/create/update) | `productService.test.ts` | 20 |
| Reviews Zod schemas | `reviews.test.ts` | 14 |
| Wishlist Zod schemas | `wishlist.test.ts` | 17 |
| **Total** | **10 suites** | **161** |

All tests run without a live database. Prisma is mocked at the module level.

### Frontend — Vitest

```bash
cd frontend
npm test
npm run build
```

| Suite | File | Tests |
|---|---|---|
| Login and Register pages (smoke) | `smoke.test.tsx` | 2 |
| Protected route guards | `routes.test.tsx` | 12 |
| ProductCard (stock, discount, rating, wishlist) | `productCard.test.tsx` | 19 |
| Landing page (hero, grid, search, filter, empty state) | `landing.test.tsx` | 13 |
| Cart page | `cart-flow.test.tsx` | 6 |
| Checkout (rendering + postal code validation) | `checkout-flow.test.tsx` | 6 |
| Payment form fields and validation | `payment-validation.test.tsx` | 7 |
| Orders page (list, status labels, cancel, refund) | `orders.test.tsx` | 19 |
| Admin dashboard (products, orders, refunds tabs) | `admin.test.tsx` | 13 |
| Product Manager dashboard (4 tabs) | `productManagerAdmin.test.tsx` | 22 |
| Wishlist page smoke | `wishlist-smoke.test.tsx` | 6 |
| **Total** | **11 suites** | **125** |

All API calls are mocked with `vi.mock`. No backend needs to be running.

---

## API Quick Reference

All routes are prefixed with `/api`. Routes marked **auth** require a `Bearer <token>` header.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create a new customer account |
| POST | `/auth/login` | — | Returns a JWT token |
| GET | `/auth/me` | auth | Returns the authenticated user's profile |

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | — | List active, priced products; supports `?search=`, `?category=`, `?sort=price_asc\|price_desc\|name_asc\|rating_desc` |
| GET | `/products/categories` | — | List visible category names |
| GET | `/products/:id` | — | Product detail with stock and rating |
| GET | `/products/admin` | sales_manager | All products including unpriced |
| PATCH | `/products/:id` | sales_manager | Update price and discount fields |
| GET | `/products/manager` | product_manager | All products including inactive |
| POST | `/products` | product_manager | Create a new product |
| PATCH | `/products/manager/:id` | product_manager | Update non-price fields and stock |

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | — | List visible categories |
| GET | `/categories/all` | product_manager | All categories including hidden |
| POST | `/categories` | product_manager | Create a category |
| DELETE | `/categories/:id` | product_manager | Soft-hide a category |

### Cart

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cart` | auth | Get current cart items |
| POST | `/cart/items` | auth | Add a product to cart |
| PATCH | `/cart/items/:id` | auth | Update item quantity |
| DELETE | `/cart/items/:id` | auth | Remove an item |
| POST | `/cart/sync` | auth | Merge guest cart after login |

### Payment and Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payment/validate` | auth | Validate card details |
| POST | `/orders` | auth | Create order, decrement stock, clear cart, send invoice email |
| GET | `/orders` | auth | List the user's orders |
| GET | `/orders/:id` | auth | Get a single order with items |
| GET | `/orders/:id/invoice` | auth | Download invoice as PDF |
| POST | `/orders/:id/cancel` | auth | Cancel a processing order |
| POST | `/orders/:id/refund-request` | auth | Request a refund (delivered, within 30 days) |
| GET | `/orders/refunds` | auth | List the user's refund requests |
| GET | `/orders/admin` | sales_manager | All orders with customer details |
| GET | `/orders/admin/refunds` | sales_manager | All refund requests |
| PATCH | `/orders/admin/refunds/:id` | sales_manager | Approve or reject a refund |
| GET | `/orders/admin/:id/invoice` | sales_manager | Download any order's invoice |
| GET | `/orders/manager` | product_manager | All orders |
| PATCH | `/orders/manager/:id/status` | product_manager | Advance order status |
| GET | `/orders/manager/:id/invoice` | product_manager | Download any order's invoice |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | `/users/me/addresses` | auth | List or add saved addresses |
| PUT / DELETE | `/users/me/addresses/:id` | auth | Update or delete a saved address |
| GET / POST | `/users/me/cards` | auth | List or add saved cards |
| PUT / DELETE | `/users/me/cards/:id` | auth | Update or delete a saved card |

### Wishlist

| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | `/wishlists` | auth | List or create wishlists |
| DELETE | `/wishlists/:id` | auth | Delete a wishlist |
| GET / POST | `/wishlists/:id/items` | auth | List items or add a product |
| DELETE | `/wishlists/:id/items/:productId` | auth | Remove a product |

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reviews/product/:productId` | — | Approved comments and ratings for a product |
| POST | `/reviews/rate` | auth | Submit or update a 1–5 star rating (requires delivered order) |
| POST | `/reviews/comment` | auth | Submit a comment (requires delivered order; starts as pending) |
| GET | `/reviews/my/:productId` | auth | Get the user's own rating and comment for a product |
| GET | `/reviews/pending` | product_manager | All pending comments |
| PATCH | `/reviews/comment/:id/status` | product_manager | Approve or reject a comment |

---

## Troubleshooting

**`npm run db:seed` errors on first run**
Run `npm run db:migrate` first so the tables exist. If you get a "relation does not exist" error, also run `npm run db:generate` to rebuild the Prisma client.

**`Cannot connect to database`**
Confirm PostgreSQL is running and the database named in `DATABASE_URL` exists. Create it manually if needed:
```sql
CREATE DATABASE maison_db;
```

**Product images show as unavailable**
Product images use Unsplash CDN URLs set in `seed.ts`. They load only when Unsplash is reachable from your network.

**Invoice email preview not appearing**
If all SMTP fields in `.env` are blank, the backend auto-provisions an Ethereal test account and prints a line starting with `[Email] Ethereal preview URL:` to the terminal. Click that URL to view the email in a browser.

**Postal code validation rejects a valid code**
Both `Checkout.tsx` and the `POST /api/orders` Zod schema enforce exactly 5 numeric digits (`^\d{5}$`). Codes with letters, spaces, or a different length are rejected.

**Guest cart items disappear after login**
`AuthContext.tsx` calls `POST /api/cart/sync` before setting user state, so the merge should complete before the server cart is fetched. If this still occurs, check that the sync request succeeds (no 4xx/5xx) in the browser Network tab.

**`npm run db:reset` drops data I needed**
`db:reset` runs `prisma migrate reset --force`, which deletes all data. Run `npm run db:seed` immediately after to restore the demo dataset.

---

## Security Notes

- Never commit `.env` to version control. It is listed in `.gitignore`.
- `JWT_SECRET` must be a long, randomly generated string. The default in `.env.example` is a placeholder — replace it before running the project.
- SMTP credentials should use Gmail App Passwords (not your account password). Generate one at **Google Account → Security → App Passwords**. Use the 16-character app password as `SMTP_PASS`.
- Do not share or publish real SMTP passwords, database credentials, or JWT secrets.

---

## Project Status

MAISON implements the full set of CS308 course requirements across all three sprints:

- **Sprint 3 (Stories 13–18):** Checkout, address management, payment validation, order creation with stock decrement, invoice PDF generation and email delivery, account page with saved cards and addresses.
- **Sprint 4 (Stories 19–34):** Wishlist creation and item management, wishlist discount notifications, product ratings and comment moderation, sales manager dashboard (products, orders, revenue, refunds), product manager dashboard (product/category CRUD, order status, comment moderation), order cancel and refund flows with 30-day refund window.

The test suite covers backend service functions and middleware with mocked Prisma (161 tests across 10 suites) and frontend component behaviour with mocked API calls (125 tests across 11 suites). Unit tests verify isolated logic; they do not replace a manual demo or end-to-end integration test against a real database.
