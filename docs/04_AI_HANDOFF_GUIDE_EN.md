> Place this file under `docs/` in the GitHub repository.

# AI HANDOFF GUIDE (English)
CS308 ShopHub — Sprint-Ready Baseline (Sprint 1)

Purpose: This document helps teammates use their own AI assistant effectively on top of the shared Sprint-1 baseline. It explains the codebase structure, implemented features, project requirements, the sprint workflow we adopted, and strict rules for requesting updates without breaking the existing system. This guide is designed to be copied into an AI chat together with the project ZIP (sprint1.zip).

## 0. What you must do before asking AI to change anything

- Always attach the full project ZIP (sprint1.zip) to the AI chat. Do NOT paste only README.
- Tell the AI: 'You must not remove existing behavior. Only add or modify what the new Sprint requires.'
- Ask the AI to work in small patches (file-by-file changes), not a brand-new rewrite.
- After any changes, you (the human) must run the Smoke Test checklist (Section 8).
## 1. Project context & requirements (CS308 Online Store)

This is an online store web application that includes a web frontend, an application web-server backend, and a database. Key requirements (full list varies by later sprints, but these fundamentals must always hold):

- Users can browse products and use the cart as guests (no login required).
- Login is required before checkout/payment (payment is mock).
- Products have stock; stock must be shown; out-of-stock products remain searchable but cannot be added to cart.
- Search (name/description) and sorting (e.g., price) are required.
- The UI is graded: it should look professional, attractive, and easy to use.
- Security matters: passwords must be hashed; authentication/authorization must be correct.
- The backend must connect to the DB and handle concurrent HTTP requests (later sprints add stronger concurrency rules).
- Roles exist (customer, sales_manager, product_manager). Sprint 1 lays the foundation; later sprints expand role-based features.
## 2. Sprint workflow (IMPORTANT: our sprint scopes are custom)

Our sprint scopes are decided by the team (based on weekly TA guidance). Therefore, the AI must NOT assume a typical industry sprint roadmap. Each sprint request must explicitly list what is in-scope and out-of-scope.

- Sprint rule: main branch must always be runnable and demo-ready.
- We extend from the Sprint-1 baseline. We do not 'rewrite everything' per sprint.
- Each sprint change is implemented as a small set of tasks, merged via PR/branch workflow (recommended).
- Before starting a new sprint, run the Smoke Test on main to ensure the baseline is intact.
## 3. What Sprint 1 baseline already implements

Sprint 1 baseline is a runnable foundation with a professional clothing-store UI and a secure backend. It is intentionally NOT a full finished e-commerce system yet.

### 3.1 Features implemented

- Landing page: apparel product grid with clean layout, search, sort, and basic filtering.
- Product detail page: /products/:id
- Guest cart: add/remove/update quantity, cart badge in navbar, cart totals.
- Cart persistence: guest cart stored in localStorage; on login it syncs to server cart.
- Authentication: Register + Login + JWT access token; protected /account page; /auth/me endpoint.
- Seed data: demo users + apparel products in PostgreSQL via Prisma seed.
- Basic backend tests (Jest) + basic frontend smoke tests.
### 3.2 Explicitly not implemented yet (must remain out-of-scope unless the sprint requires it)

- Orders / checkout / payment flows
- Invoices (PDF/email)
- Discount engine / wishlists / notifications
- Reviews and moderation
- Delivery tracking statuses
- Returns/refunds
- Admin dashboards for roles
## 4. Tech stack (must not change unless the team decides)

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + TypeScript + Express
- Database: PostgreSQL
- ORM: Prisma
- Auth: bcrypt + JWT
- Validation: Zod (backend)
## 5. Codebase structure (what the AI should understand)

The project is a monorepo-style folder layout:

    sprint1/
 backend/
 prisma/ (schema.prisma, seed.ts)
 src/
 server.ts
 config/ (env.ts, db.ts)
 middleware/ (auth.ts, errorHandler.ts)
 validators/ (auth.ts)
 services/ (authService.ts, productService.ts, cartService.ts)
 routes/ (auth.ts, products.ts, cart.ts)
 tests/ (auth.test.ts)
 frontend/
 src/
 services/api.ts
 context/ (AuthContext.tsx, CartContext.tsx)
 components/ (Navbar, ProductCard, ProtectedRoute, Footer)
 pages/ (Landing, ProductDetail, Cart, Login, Register, Account)
 tests/ (smoke.test.tsx)
Architecture pattern: routes → services → DB (via Prisma). Frontend uses contexts (Auth/Cart) and a shared API client.

## 6. Non-negotiable rules for any AI-generated changes

- Do NOT remove existing endpoints or UI flows unless the team explicitly requests it.
- Do NOT rename API routes or response shapes without updating both backend and frontend.
- Do NOT include node_modules in outputs or commits.
- Keep .env.example files updated whenever new env vars are introduced.
- Keep all changes minimal and incremental. Prefer modifying existing files over generating a new project.
- Always add or update tests when touching auth/cart logic.
- Preserve professional UI tone: no emojis, no childish copy, no 'AI vibe' slogans.
## 7. How to ask AI for Sprint N updates (copy-paste templates)

### 7.1 Best template (patch-based)

    ROLE: You are a senior full-stack engineer on a sprint-based course project.
CONTEXT: I uploaded sprint1.zip (baseline). Do NOT rewrite from scratch.
GOAL: Implement Sprint N features listed below. Keep Sprint 1 behavior working.
OUTPUT: Provide a change plan + file-by-file diffs/patches + new/updated tests + updated runbook lines.
CONSTRAINTS:
- Do not break existing smoke tests.
- Do not change existing API contracts unless required.
- Keep UI professional and consistent with MAISON clothing store look.
SPRINT N REQUIREMENTS (IN-SCOPE):
1) ...
2) ...
OUT OF SCOPE (MUST NOT IMPLEMENT):
- ...
DELIVERABLES:
1) Summary of changes
2) Exact files modified/added (paths)
3) The full updated content of each modified file
4) Any DB schema migrations + seed updates if needed
5) Updated smoke test steps (if new features)
### 7.2 If the AI tries to overbuild

If the AI proposes advanced features you did not request, respond with:

    Stop. This is out of scope for this sprint.
Only implement the listed Sprint N requirements.
Revert any unrelated additions and provide a minimal patch.
## 8. Mandatory verification after any AI change (Smoke Test checklist)

After applying AI changes locally, ALWAYS run these checks in order:

- Backend starts (npm run dev) and /api/health returns OK.
- GET /api/products returns non-empty list.
- Landing page loads products and search/sort/filter still work.
- Guest cart: add item → cart badge increments → cart page shows totals.
- Register a new user → login works → /account is accessible when logged in.
- Logout → /account redirects to login.
- If cart sync exists: add items as guest → login → cart still contains items.
If any step fails, the change must be treated as incomplete (do not merge).

## 9. Debugging rules (what to give the AI when something breaks)

- Always paste the exact error message (terminal log or browser console).
- Include: backend/.env (redact passwords), frontend/.env, and the command you ran.
- Include: curl -i http://localhost:4000/api/health and curl -i http://localhost:4000/api/products (first lines).
- If DB-related: include psql -d clothingstore -c 'SELECT current_user;' output.
## 10. How to keep sprint changes merge-friendly (avoid chaos)

Even with AI assistance, merges can break if multiple people edit the same files.

- Prefer one 'feature branch' per sprint task (or per bundle).
- Avoid editing shared core files (server.ts, api.ts, contexts) unless necessary.
- If multiple tasks need the same shared file, coordinate merge order or assign one owner.
- After each merge to main, rerun the Smoke Test.
## 11. What the AI should NOT do (anti-patterns)

- Generate a brand-new repo that ignores the uploaded ZIP.
- Introduce new frameworks (Next.js, Redux, different ORM) without permission.
- Commit or output node_modules, dist/, build/ folders.
- Change ports/URLs silently (must document).
- Remove seed data or demo accounts (makes demo fragile).
## 12. Appendix: Quick run commands (for AI awareness)

The AI should keep these run steps valid unless it changes something explicitly:

    Backend (from sprint1/backend):
 npm install
 npx prisma generate
 npx prisma migrate dev --name init
 npm run db:seed
 npm run dev
Frontend (from sprint1/frontend):
 npm install
 npm run dev
End of guide. Use this document as the first message to your AI assistant, and always upload sprint1.zip in the same chat.
