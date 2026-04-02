# MAISON — Online Clothing Store (Sprint 3)

A professional e-commerce application for a clothing brand, built as a CS 308 Software Engineering course project.

**Sprint 1 delivers**: landing page with product grid, search, sort and category filter, user registration and login with secure JWT authentication, guest and logged-in cart, protected account page, and product detail pages.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router, React Hook Form |
| Backend | Node.js, Express, TypeScript, Prisma ORM, Zod validation |
| Database | PostgreSQL |
| Auth | bcrypt password hashing, JWT tokens |
| Tests | Jest (backend, 14 tests), Vitest (frontend, 2 smoke tests) |

---

## How to Run Locally (Step-by-Step for Beginners)

### Prerequisites

You need two programs installed on your computer:

**1. Node.js (version 20 or newer)**

Download from: https://nodejs.org — click the big green "LTS" button.

After installing, open a terminal and verify:
```bash
node --version    # Should show v20.x.x or higher
npm --version     # Should show 10.x.x or higher
```

**2. PostgreSQL (version 14 or newer)**

- **macOS**: Install via Homebrew: `brew install postgresql@16 && brew services start postgresql@16`
- **Windows**: Download from https://www.postgresql.org/download/windows/ — run the installer, remember the password you set.

After installing, verify it is running:
```bash
# macOS
pg_isready
# Should print: accepting connections

# Windows (PowerShell)
pg_isready -h localhost -p 5432
```

### Step 1: Create the Database

```bash
# macOS (default user is your macOS username)
createdb clothingstore

# Windows (use the postgres superuser)
psql -U postgres -c "CREATE DATABASE clothingstore;"
# It will ask for the password you set during install
```

### Step 2: Set Up the Backend

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

Create your environment file:
```bash
cp .env.example .env
```

Now edit `.env` with a text editor. Update the DATABASE_URL to match your setup:

```
# macOS (usually no password needed):
DATABASE_URL="postgresql://yourusername@localhost:5432/clothingstore?schema=public"

# Windows (use the password from install):
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/clothingstore?schema=public"
```

Install dependencies:
```bash
npm install
```

Generate the Prisma client (this creates TypeScript code that talks to your database):
```bash
npx prisma generate
```

Run database migrations (this creates the tables in PostgreSQL):
```bash
npx prisma migrate dev --name init
```
If you see "All migrations have been successfully applied", it worked.

Seed the database with demo products and users:
```bash
npm run db:seed
```
You should see a list of 3 demo accounts and confirmation of 12 products created.

Start the backend server:
```bash
npm run dev
```
You should see: `Server running at http://localhost:4000`

**Leave this terminal running.** Open a new terminal for the next step.

### Step 3: Set Up the Frontend

In the new terminal, navigate to the frontend folder:

```bash
cd frontend
```

Create your environment file:
```bash
cp .env.example .env
```
The defaults are fine — it points to `http://localhost:4000/api`.

Install dependencies:
```bash
npm install
```

Start the frontend dev server:
```bash
npm run dev
```
You should see: `Local: http://localhost:5173/`

### Step 4: Open the App

Open http://localhost:5173 in your browser. You should see the MAISON store landing page with 12 clothing products.

---

## Verification Steps

After both servers are running, verify everything works:

**1. Check products load in the browser**

Open http://localhost:5173 — you should see product cards with images, prices, and stock info.

**2. Check the API directly**

Open http://localhost:4000/api/health in your browser. You should see:
```json
{"status":"ok","timestamp":"..."}
```

Open http://localhost:4000/api/products — you should see a JSON array of 12 products.

**3. Test registration via curl**

Open a new terminal:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"testpassword123"}'
```
You should get back a JSON response with `user` and `token` fields.

**4. Test login via curl**

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@demo.com","password":"password123"}'
```
Copy the `token` value from the response.

**5. Test protected route**

Replace `YOUR_TOKEN` with the actual token:
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```
You should see the user info (without password hash).

**6. Test the frontend login flow**

Go to http://localhost:5173/login, enter `customer@demo.com` / `password123`. After login, the navbar should show "Sign Out" and the "Account" link should appear.

**7. Test protected route guard**

While logged out, go to http://localhost:5173/account — you should be redirected to /login.

---

## Running Tests

```bash
# Backend (14 tests: validation, bcrypt, JWT)
cd backend
npm test

# Frontend (2 smoke tests: login page renders, register page renders)
cd frontend
npm test
```

---

## Smoke Test Checklist

After cloning the repo and completing setup, go through this checklist in order:

- [ ] `http://localhost:4000/api/health` returns `{"status":"ok",...}`
- [ ] `http://localhost:4000/api/products` returns 12 products
- [ ] Landing page at `http://localhost:5173/` shows product grid
- [ ] Search bar filters products by name
- [ ] Category dropdown filters products
- [ ] Sort dropdown reorders products by price
- [ ] Out-of-stock product (Cotton Pique Polo) shows "Sold Out" overlay
- [ ] Clicking a product card goes to `/products/:id` detail page
- [ ] "Add to Cart" works on product card hover (as guest)
- [ ] Cart page at `/cart` shows added items with quantities and totals
- [ ] Cart counter appears in the navbar
- [ ] `/register` page has name, email, password, confirm password fields
- [ ] Password rule indicator updates as you type
- [ ] Registering a new account works and redirects to home
- [ ] `/login` page has email and password fields
- [ ] Logging in with `customer@demo.com` / `password123` works
- [ ] After login, navbar shows "Sign Out" and "Account"
- [ ] `/account` page shows user name, email, role, member since
- [ ] Guest cart items are preserved after logging in
- [ ] Clicking "Sign Out" clears the session
- [ ] Visiting `/account` while logged out redirects to `/login`
- [ ] `cd backend && npm test` — 14 tests pass
- [ ] `cd frontend && npm test` — 2 tests pass

---

## Troubleshooting

### "Port 4000 already in use"
Another process is using that port. Kill it or change PORT in `backend/.env`:
```bash
# Find what's using port 4000:
lsof -i :4000    # macOS
netstat -ano | findstr :4000   # Windows
```

### "Port 5173 already in use"
Kill other Vite instances or change the port in `frontend/vite.config.ts`.

### Prisma migrate errors
- Make sure PostgreSQL is running (`pg_isready`)
- Make sure your DATABASE_URL in `.env` is correct
- Make sure the database exists (`createdb clothingstore` or via psql)
- Try: `npx prisma migrate reset --force` (this drops and recreates everything)

### "Can't reach database server"
Your DATABASE_URL is wrong. Common issues:
- Wrong password
- Wrong port (default is 5432)
- Database name doesn't exist
- PostgreSQL service isn't running

### CORS errors in browser console
Make sure the backend is running on port 4000. The CORS config allows requests from `http://localhost:5173`.

### TypeScript build errors
Run `npm install` again in the affected folder. If that doesn't help, delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### "prisma generate" fails
Make sure you ran `npm install` first (Prisma is a dev dependency). Try:
```bash
npx prisma generate
```

---

## Cart Persistence Logic

The cart uses a **dual-layer approach**:

1. **Guest users**: Cart is stored in `localStorage` under the key `guestCart`. This means anyone can browse and add items without an account. The cart survives page refreshes and browser restarts.

2. **Logged-in users**: Cart is stored on the server (PostgreSQL `cart_items` table). When a user logs in, any guest cart items are automatically synced to their server-side cart via `POST /api/cart/sync`. The guest cart is then cleared.

3. **On logout**: The server cart persists in the database. If the user logs back in, their cart is still there. The guest cart in localStorage is independent and not cleared on logout, so a guest can continue browsing.

4. **Future sprints**: When checkout is implemented, the server cart will be the source of truth for order creation. Stock is validated at add-to-cart time and will be re-validated at checkout time.

---

## Demo Accounts

All use password: `password123`

| Email | Role | Access |
|-------|------|--------|
| customer@demo.com | Customer | Shop, cart, account |
| sales@demo.com | Sales Manager | (Future: discounts, invoices, revenue) |
| product@demo.com | Product Manager | (Future: product CRUD, reviews) |

---

## Features NOT Implemented Yet (Sprint 2+)

These are intentionally out of scope for Sprint 1:

- Orders, checkout, and payment processing
- Invoice generation (PDF/email)
- Discount management
- Wishlist and wishlist notifications
- Product reviews and ratings
- Review moderation (product manager)
- Delivery tracking
- Refunds and returns
- Sales manager dashboard (revenue charts, invoice list)
- Product manager dashboard (product CRUD, stock management)
- Admin role-based UI panels

The architecture supports all of these. The database schema is ready for extension, the auth middleware supports role-based authorization, and the frontend routing structure accommodates new pages.

---

## Project Structure

```
/
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── prisma/
│   │   ├── schema.prisma          # Database models
│   │   └── seed.ts                # Demo data (12 products, 3 users)
│   └── src/
│       ├── server.ts              # Express app entry
│       ├── config/
│       │   ├── db.ts              # Prisma client singleton
│       │   └── env.ts             # Environment variables
│       ├── middleware/
│       │   ├── auth.ts            # JWT authenticate + authorize
│       │   └── errorHandler.ts    # Global error handler
│       ├── validators/
│       │   └── auth.ts            # Zod schemas (register, login)
│       ├── services/
│       │   ├── authService.ts     # Register, login, getMe logic
│       │   ├── productService.ts  # List, get, categories
│       │   └── cartService.ts     # CRUD cart, sync guest cart
│       ├── routes/
│       │   ├── auth.ts            # POST register, login; GET me
│       │   ├── products.ts        # GET list, categories, detail
│       │   └── cart.ts            # GET, POST, PATCH, DELETE cart items
│       ├── types/
│       │   └── index.ts           # JwtPayload, Express augmentation
│       └── tests/
│           └── auth.test.ts       # 14 unit tests
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                # Routes
        ├── index.css              # Tailwind + component classes
        ├── types/
        │   └── index.ts           # Shared TypeScript interfaces
        ├── services/
        │   └── api.ts             # Axios instance with auth interceptor
        ├── context/
        │   ├── AuthContext.tsx     # Login/register/logout + guest cart sync
        │   └── CartContext.tsx     # Dual-layer cart (guest + server)
        ├── components/
        │   ├── Navbar.tsx         # Nav with cart count badge
        │   ├── Footer.tsx         # Site footer
        │   ├── ProtectedRoute.tsx # Auth guard
        │   └── ProductCard.tsx    # Product card with hover add-to-cart
        ├── pages/
        │   ├── Landing.tsx        # Hero + product grid + search/sort/filter
        │   ├── Login.tsx          # Sign in form
        │   ├── Register.tsx       # Create account form
        │   ├── Account.tsx        # Protected user info page
        │   ├── ProductDetail.tsx  # Full product page
        │   └── Cart.tsx           # Cart with quantities, totals, checkout placeholder
        └── tests/
            └── smoke.test.tsx     # 2 smoke tests
```

---

## Task-Bundle Split Plan for Teamwork

### What is a "Scaffold Commit"?

A scaffold commit is the first commit that establishes the working skeleton of the project — all configuration files, project structure, dependencies, and just enough code that the app starts without errors. Think of it like the framing of a house: it's not finished yet, but it's structurally sound and every room has a defined space.

**Why it matters**: Without a scaffold, teammates working in parallel will create conflicting versions of shared files (package.json, App.tsx, tsconfig). The scaffold eliminates this by establishing the single truth before anyone branches off.

**Scaffold commit includes**: All files in this repository. It is the complete Sprint 1 codebase. One person pushes it, then teammates branch off to work on individual features for polish or future sprints.

### Workflow 1 (RECOMMENDED — Branch per Bundle)

This is the safest approach. One person pushes the scaffold, then each teammate creates a branch for their assigned bundle.

**Step-by-step:**

```bash
# === PERSON 1 (Scaffold Owner) ===
# Create the repo on GitHub, then:
git clone https://github.com/YOUR_TEAM/maison-store.git
cd maison-store

# Copy all project files into this folder, then:
git add .
git commit -m "scaffold: complete Sprint 1 baseline"
git push origin main

# === EVERY TEAMMATE ===
git clone https://github.com/YOUR_TEAM/maison-store.git
cd maison-store

# Create your branch:
git checkout -b bundle/landing-page    # (or your bundle name)

# Make your changes...
git add .
git commit -m "feat: improve landing hero section"
git push origin bundle/landing-page

# Then go to GitHub and click "Create Pull Request"
# Another teammate reviews and merges
```

**Merge order** (to avoid conflicts):

1. Bundle 4 (Registration Backend) — modifies only backend files
2. Bundle 5 (Login Backend) — modifies only backend files
3. Bundle 6 (Auth Foundation) — touches middleware + frontend context
4. Bundle 2 (Registration UI) — frontend pages only
5. Bundle 3 (Login UI) — frontend pages only
6. Bundle 1 (Landing Page) — frontend pages only

After each merge, everyone pulls the latest:
```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main    # incorporate the latest changes
```

### Workflow 2 (Everyone Commits to Main — RISKY)

If your team insists on committing directly to main, follow this strict sequence:

1. Person 1 pushes scaffold commit
2. Person 2 works on backend auth, commits, pushes
3. Person 3 works on frontend pages, commits, pushes
4. Everyone else ALWAYS pulls before starting work: `git pull origin main`

**Why this is risky**: If two people edit the same file (e.g., App.tsx) and push, the second person gets a merge conflict. Beginners often lose work resolving conflicts.

**Minimal safe procedure**:
```bash
# ALWAYS do this before starting work:
git pull origin main

# After finishing your work:
git add .
git commit -m "your message"
git pull origin main    # pull AGAIN to catch anything new
# If there's a conflict, resolve it, then:
git add .
git commit -m "merge: resolve conflict"
git push origin main
```

### The 6 Task Bundles

---

#### Bundle 1: Landing Page
**Assignee**: Frontend developer
**Files modified**: `frontend/src/pages/Landing.tsx`, `frontend/src/components/ProductCard.tsx`
**Depends on**: Scaffold commit
**Merge position**: 6th (last — purely visual, no conflicts)

Suggested commits:
- `feat(landing): refine hero section copy and layout`
- `feat(landing): improve product card hover states`
- `style(landing): adjust grid spacing and responsive breakpoints`

**Smoke test after merge**: Landing page loads, products display, search and sort work.

---

#### Bundle 2: Registration UI
**Assignee**: Frontend developer
**Files modified**: `frontend/src/pages/Register.tsx`
**Depends on**: Scaffold + Bundle 6 merged
**Merge position**: 4th

Suggested commits:
- `feat(register): add password strength meter`
- `feat(register): improve error display and loading states`
- `style(register): polish form layout and validation feedback`

**Smoke test after merge**: `/register` page renders, validation shows errors, successful registration redirects to home.

---

#### Bundle 3: Login UI
**Assignee**: Frontend developer
**Files modified**: `frontend/src/pages/Login.tsx`
**Depends on**: Scaffold + Bundle 6 merged
**Merge position**: 5th

Suggested commits:
- `feat(login): improve error message display`
- `style(login): polish form layout and transitions`

**Smoke test after merge**: `/login` page renders, invalid credentials show error, valid login redirects and shows user in navbar.

---

#### Bundle 4: Secure Registration Backend
**Assignee**: Backend developer
**Files modified**: `backend/src/services/authService.ts`, `backend/src/validators/auth.ts`, `backend/src/tests/auth.test.ts`
**Depends on**: Scaffold commit only
**Merge position**: 1st (no dependencies, backend only)

Suggested commits:
- `feat(auth): add email format normalization`
- `test(auth): add edge case tests for registration`
- `refactor(auth): improve error messages for duplicate email`

**Smoke test after merge**: `curl -X POST .../auth/register` works, duplicate email returns 409, short password returns 400. `npm test` passes.

---

#### Bundle 5: Secure Login Backend
**Assignee**: Backend developer
**Files modified**: `backend/src/services/authService.ts`, `backend/src/tests/auth.test.ts`
**Depends on**: Scaffold + Bundle 4 merged
**Merge position**: 2nd

Suggested commits:
- `feat(auth): add rate limiting note for future`
- `test(auth): add login-specific edge case tests`

**Smoke test after merge**: `curl -X POST .../auth/login` works, wrong password returns 401 with generic message. `npm test` passes.

---

#### Bundle 6: Authentication Foundation
**Assignee**: Full-stack developer
**Files modified**: `backend/src/middleware/auth.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/components/Navbar.tsx`
**Depends on**: Scaffold + Bundles 4 and 5 merged
**Merge position**: 3rd

Suggested commits:
- `feat(auth): verify JWT middleware handles edge cases`
- `feat(frontend): auth context persists session across refresh`
- `feat(frontend): protected route redirects unauthenticated users`

**Smoke test after merge**: Login via UI works, token is stored, `/account` is accessible when logged in, redirects to `/login` when not. Navbar shows correct state.

---

### File Overlap Matrix

| File | B1 | B2 | B3 | B4 | B5 | B6 |
|------|----|----|----|----|----|----|
| Landing.tsx | X | | | | | |
| ProductCard.tsx | X | | | | | |
| Register.tsx | | X | | | | |
| Login.tsx | | | X | | | |
| authService.ts | | | | X | X | |
| validators/auth.ts | | | | X | | |
| auth.test.ts | | | | X | X | |
| middleware/auth.ts | | | | | | X |
| AuthContext.tsx | | | | | | X |
| ProtectedRoute.tsx | | | | | | X |
| Navbar.tsx | | | | | | X |

Bundles 4 and 5 share `authService.ts` and `auth.test.ts` — this is why Bundle 5 must merge AFTER Bundle 4. All other bundles touch different files and can be developed in parallel.

---

## API Reference (Sprint 1)

### Public Endpoints

```
GET  /api/health                          → { status, timestamp }
GET  /api/products                        → Product[]
GET  /api/products/categories             → string[]
GET  /api/products/:id                    → Product
GET  /api/products?search=wool            → filtered Product[]
GET  /api/products?category=Outerwear     → filtered Product[]
GET  /api/products?sort=price_asc         → sorted Product[]
```

### Auth Endpoints

```
POST /api/auth/register                   → { user, token }
     body: { name, email, password }

POST /api/auth/login                      → { user, token }
     body: { email, password }

GET  /api/auth/me                         → User (protected)
     header: Authorization: Bearer <token>
```

### Cart Endpoints (protected)

```
GET    /api/cart                           → CartItem[]
POST   /api/cart/items                     → CartItem
       body: { productId, quantity? }
PATCH  /api/cart/items/:id                 → CartItem
       body: { quantity }
DELETE /api/cart/items/:id                 → { message }
POST   /api/cart/sync                      → CartItem[]
       body: { items: [{ productId, quantity }] }
```

### Response Format

All errors follow this format:
```json
{
  "error": "Human-readable error message"
}
```

Validation errors include details:
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Please enter a valid email address" }
  ]
}
```
