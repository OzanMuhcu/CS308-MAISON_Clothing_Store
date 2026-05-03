# CS308 — MAISON Clothing Store
## Kod Haritası (Sprint 1–4) — “Hocaya kodu açıp gösterebilme” rehberi

Bu doküman, MAISON projesindeki ana feature’ların **hangi dosyalarda** olduğunu ve birbirleriyle nasıl bağlandığını gösterir.
Amaç: Sunumda / hocanın sorularında “şu feature nerede?” dendiğinde **10 saniyede dosyayı açabilmek**.

> **Kaynak doğruluk sırası:** Kod > Root README > docs  
> Dokümanlar zamanla eskiyebilir; şüphede kalınca kodu kontrol edin.

---

# 0) Repo yapısı (güncel)

- `backend/` → Express + TypeScript + Prisma + PostgreSQL  
- `frontend/` → React + TypeScript + Vite + Tailwind + Router  
- `docs/` → Runbook, guideline, GitHub guide, AI handoff

---

# 1) Backend haritası (Express + Prisma)

## 1.1 Entry point
- `backend/src/server.ts`  
  - Express app kurulumu  
  - `/api` base path  
  - route registration  
  - CORS / middleware / error handler

## 1.2 Konfigürasyon
- `backend/src/config/env.ts` → env okuma/validate
- `backend/src/config/db.ts` → PrismaClient init
- `backend/src/middleware/auth.ts` → JWT doğrulama + role/ownership kontrolleri
- `backend/src/middleware/errorHandler.ts` → tek yerden hata formatı

## 1.3 Prisma (DB modelleri)
- `backend/prisma/schema.prisma`  
  Burada en kritik modeller:
  - `User` (+ `Role` enum)
  - `Product`
  - `CartItem`
  - `Order`, `OrderItem`
  - `Wishlist`, `WishlistItem`
  - `Rating`, `Comment` (pending/approved/rejected)
  - Address: `UserAddress` ve/veya `defaultAddress`/snapshot alanları (Story 14 uyumu)
- `backend/prisma/seed.ts`  
  - demo kullanıcılar + role’lar
  - örnek ürünler (imageUrl, stock, price)
  - demo wishlist/review varsa buradan basılır

> “Ürünler gözükmüyor” sorununda ilk bakılacak yer: **seed.ts** (data var mı?) ve **DATABASE_URL** (doğru DB mi?).

## 1.4 Route dosyaları (Sprint story’lerin ana kapısı)
> Hepsi `backend/src/routes/` altında.

- `auth.ts`  
  - register/login
  - token üretimi
  - `/me` gibi endpoint’ler varsa burada

- `products.ts`  
  - ürün listeleme
  - ürün detay (id ile)
  - stock/rating gibi alanlar response’ta burada şekillenir

- `cart.ts`  
  - authenticated cart CRUD
  - **guest→user merge / sync** endpoint’i (Sprint 2/3 kritik)
  - “Guest cart login sonrası gecikmeli gelmesin” bugfix’i bu route + frontend context etkileşimindedir.

- `payment.ts`  
  - payment validation endpoint (mock)
  - kart bilgisi DB’ye yazılmaz; sadece validate edilir

- `orders.ts`  
  - order create / list / detail
  - stock decrement + cart finalize logic (service ile)
  - invoice download endpoint’i (PDF)

- `users.ts`  
  - account/profile endpoint’leri
  - address yönetimi endpoint’leri (Story 14)

- `wishlist.ts` (Sprint 4)  
  - wishlist create/list/delete
  - wishlist item add/remove

- `reviews.ts` (Sprint 4)  
  - rating submit/update
  - comment submit (pending)
  - product manager moderation: approve/reject
  - eligibility checks (purchased/delivered)

---

# 2) Frontend haritası (React + Router)

## 2.1 Routing
- `frontend/src/App.tsx`  
  - route tanımları (Landing, ProductDetail, Cart, Checkout, Payment, Orders, Account, Wishlist)
  - ProtectedRoute/role-based guard varsa burada bağlanır

## 2.2 API client
- `frontend/src/services/api.ts`  
  - base URL (`VITE_API_URL`)
  - token ekleme (Authorization header)
  - tek yerden API çağrıları

> “Ürünler gelmiyor” sorununda kontrol: VITE_API_URL doğru mu? backend çalışıyor mu?

## 2.3 Global state (kritik)
- `frontend/src/context/AuthContext.tsx`
  - login/register
  - token + user state
  - login sonrası “cart sync” tetiklemesi (guest→user)

- `frontend/src/context/CartContext.tsx`
  - guest cart (localStorage)
  - authenticated cart (server)
  - merge/sync sonrası state temizliği

Bu iki dosya, sprintler boyunca en çok regression çıkaran yerdir.

## 2.4 Sayfalar (Sprint story’ler burada görünür)
`frontend/src/pages/` altında:

- `Landing.tsx` (Story 18)  
  - product grid
  - search + sort + category filter
  - stock label (count)
  - wishlist kısa aksiyonları varsa burada/ ProductCard’da

- `ProductDetail.tsx`  
  - ürün detay
  - wishlist/review/rating bileşenleri burada olabilir
  - accepted comments display (Sprint 4)

- `Cart.tsx` (Sprint 2/3)  
  - add/remove/qty
  - checkout’a geçiş
  - guest state vs user state

- `Checkout.tsx` (Story 13/14)  
  - order summary
  - address selection/entry
  - “snapshot” mantığına uygun address data

- `Payment.tsx` (Story 15)  
  - mock card form + UI validation
  - backend validation endpoint çağrısı

- `Orders.tsx` (Story 16/17)  
  - order history
  - invoice PDF download link/button

- `Account.tsx` (Story 18 + Story 14 hazırlık)  
  - profile bilgiler
  - address yönetimi
  - role gösterimi (varsa)

- `Wishlist.tsx` (Sprint 4)  
  - wishlist create/list
  - wishlist item list + remove

- `Login.tsx`, `Register.tsx`  
  - auth UI
  - form validation

## 2.5 UI Components
- `frontend/src/components/Navbar.tsx`  
  - cart icon + count
  - account dropdown (profile/orders/sign out)
- `frontend/src/components/ProductCard.tsx`  
  - image render + fallback
  - stock label
  - wishlist icon (kalp)
- `frontend/src/components/ProtectedRoute.tsx`  
  - route protection

---

# 3) Sprint bazlı “dosya eşleştirme” (en hızlı referans)

## Sprint 3 (13–18) — satın alma akışı
- Story 13 (Checkout): `Cart.tsx` → `Checkout.tsx` + backend `orders.ts`
- Story 14 (Address): `Checkout.tsx`, `Account.tsx`, backend `users.ts`, prisma `schema.prisma`
- Story 15 (Payment mock): `Payment.tsx`, backend `payment.ts` + validator
- Story 16 (Order/Stock): backend `orders.ts` + `orderService` + prisma `Order/OrderItem`
- Story 17 (Invoice + Email): backend invoice service/utils + `orders.ts` invoice endpoint, frontend `Orders.tsx`
- Story 18 (UI): `Landing.tsx`, `Account.tsx`, `Navbar.tsx`, `ProductCard.tsx`

## Sprint 4 — wishlist + reviews + manager flows
- Wishlist (19–22): backend `wishlist.ts`, frontend `Wishlist.tsx`
- Reviews/Ratings (23–26): backend `reviews.ts`, frontend `ProductDetail.tsx` (ve/veya ayrı component)
- Manager flows (27–34): role guard + admin pages/routes (varsa)  
  (Bu repo’da scope’a göre değişebilir; “var mı?” kontrol: `Role` enum ve ilgili route/page)

---

# 4) Test haritası (hocaya gösterme)

## Backend unit tests (Jest)
- `backend/src/tests/*.test.ts`
  - auth + payment schema
  - cart
  - orders
  - invoice
  - wishlist
  - reviews

Komut:
```bash
cd backend
npm test
```

## Frontend tests (Vitest)
- `frontend/src/tests/*.test.tsx`
  - smoke (login/register)
  - cart/checkout/payment flow
  - wishlist smoke

Komut:
```bash
cd frontend
npm test
```

---

# 5) Hızlı “Nereden bakayım?” Rehberi (sorulara göre)

- “Ürünler neden gözükmüyor?”  
  1) backend çalışıyor mu (`/api/health`), 2) seed var mı, 3) `VITE_API_URL` doğru mu, 4) CORS/port

- “Guest cart login sonrası neden gelmiyor?”  
  `AuthContext.tsx` (sync sırası) + `CartContext.tsx` + backend `cart.ts`

- “Order nasıl oluşuyor / stock nasıl düşüyor?”  
  backend `orders.ts` + ilgili service + prisma transaction

- “Invoice nerede?”  
  backend invoice endpoint + frontend `Orders.tsx` download logic

- “Wishlist nerede?”  
  `routes/wishlist.ts` + `pages/Wishlist.tsx`

- “Review/rating approval nasıl?”  
  `routes/reviews.ts` + product manager flow UI (varsa)

---

### Son güncelleme
Bu kod haritası en son **2026-05-03** tarihinde güncellenmiştir.
