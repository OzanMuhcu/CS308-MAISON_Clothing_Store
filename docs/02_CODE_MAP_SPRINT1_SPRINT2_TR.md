> Bu dosyayı GitHub reposunda `docs/` klasörü altına koyun.

# CS308 — Sprint 1 + Sprint 2
Kod Haritası ve Çalışma Mantığı (MAISON Clothing Store)

“Hocaya kodu açıp gösterebilecek seviyede” rehber

Bu belge, mevcut stabil kod tabanında (sprint1.zip) Sprint 1 ve Sprint 2 kapsamındaki görevlerin hangi dosyalarda bulunduğunu, nasıl çalıştığını, hangi dosyalarla bağlantılı olduğunu ve ileriki sprint’lerde bu yapıyı bozmadan nasıl genişletebileceğinizi anlatır.

Hedef: Ekipten biri herhangi bir özellik hakkında soru geldiğinde, 1) ilgili ekranı, 2) ilgili API endpoint’i, 3) ilgili service / middleware / context akışını açıp gösterebilsin.

## 1) 30 saniyelik genel resim (Architecture)

Bu proje iki ayrı uygulamadan oluşur:

- Frontend: React + TypeScript + Vite + Tailwind (5173 portu).
- Backend: Node.js + Express + TypeScript + Prisma (4000 portu).
- Database: PostgreSQL (Prisma schema ile yönetiliyor).
Frontend backend’e HTTP ile konuşur. Backend DB’ye Prisma ile konuşur. Auth JWT ile yapılır. Sepet (cart) hem guest (localStorage) hem de logged-in (DB) olarak tasarlanmıştır.

### 1.1 Akış diyagramı (en önemli flow’lar)

    BROWSER (React UI)
    |
    | (axios) GET /api/products (public)
    | (axios) GET /api/products/:id (public)
    | (axios) POST /api/auth/register (public)
    | (axios) POST /api/auth/login (public)
    | (axios) GET /api/cart (Bearer token) [logged-in]
    | (axios) POST /api/cart/items (Bearer token) [logged-in]
    | (axios) PATCH/DELETE cart items (Bearer token) [logged-in]
    | (axios) POST /api/cart/sync (Bearer token) [login sonrası guest->user merge]
    v
    BACKEND (Express)
    |
    v
    Prisma ORM
    |
    v
    PostgreSQL

## 2) Klasör yapısı: “Nerede ne var?”

### 2.1 Backend

    backend/
    prisma/
    schema.prisma # DB tabloları: User, Product, CartItem + Role enum
    seed.ts # demo kullanıcılar + 12 kıyafet ürünü seed
    src/
    server.ts # Express app, route mount (auth/products/cart), health endpoint
    config/
    env.ts # .env okuma, port, jwt secret, expires vs
    db.ts # Prisma client instance
    middleware/
    auth.ts # authenticate() + authorize()
    errorHandler.ts # AppError + ZodError handling
    validators/
    auth.ts # Zod register/login doğrulaması
    services/
    authService.ts # register/login/me business logic
    productService.ts # list/get/categories logic
    cartService.ts # cart add/update/remove + sync merge logic
    routes/
    auth.ts # /api/auth endpoints
    products.ts # /api/products endpoints
    cart.ts # /api/cart endpoints (protected)
    tests/
    auth.test.ts # 14 test: validator + bcrypt + jwt
### 2.2 Frontend

    frontend/
    src/
    App.tsx # Router + Providers + Routes
    services/api.ts # axios client (baseURL + token interceptor)
    context/
    AuthContext.tsx # login/register/logout + guest cart sync trigger
    CartContext.tsx # guest cart (localStorage) + server cart (API) + unified display
    pages/
    Landing.tsx # product grid + search/sort/filter
    ProductDetail.tsx # product detail + add to cart
    Cart.tsx # cart manage UI (qty/remove/totals) + checkout gating
    Login.tsx # login UI
    Register.tsx # register UI
    Account.tsx # protected account UI
    components/
    Navbar.tsx # nav + cart badge + auth buttons
    ProductCard.tsx # card + quick add to cart + stock badge
    ProtectedRoute.tsx # login required guard
    Footer.tsx # footer
    tests/
    smoke.test.tsx # 2 smoke tests: Login/Register render
Not: zip içinde yanlışlıkla oluşmuş gibi duran '{backend' klasörü varsa, repoya KESİNLİKLE koymayın. Repo kökünde sadece backend/, frontend/, README.md, .gitignore olması ideal.

## 3) Sprint 1 görevleri → Kod karşılığı (dosya + çalışma mantığı)

Sprint 1 sizin ekipte şu çekirdek işleri içeriyordu: Landing UI, Register UI, Login UI, Secure Register Backend, Secure Login Backend ve Authentication Foundation (protected route / token doğrulama). Aşağıda her birinin kodda nerede yaşadığını ve nasıl çalıştığını anlatıyorum.

### S1-G1) Landing Page (ürün grid + temel bilgileri gösterme)

Kullanıcı siteye girince ürünleri görmeli. Bu işin UI ve data kısmı iki parçadır:

- UI tarafı: Landing.tsx ürünleri kartlarla gösterir.
- Data tarafı: Backend /api/products ürün listesini döner (seed ile 12 ürün).
Nerede?

- frontend/src/pages/Landing.tsx → ürünleri çeker ve filtre/sort uygular.
- frontend/src/components/ProductCard.tsx → ürün kartı (image + name + price + stock).
- backend/src/routes/products.ts → GET /api/products ve /categories.
- backend/src/services/productService.ts → listProducts(), getCategories().
- backend/prisma/seed.ts → 12 demo clothing product oluşturur.
Nasıl çalışıyor? (adım adım)

1. Landing.tsx mount olunca Promise.all ile /products ve /products/categories çağrılır.
2. Gelen liste state’e yazılır; search/category/sort state’leri ile filtered list hesaplanır.
3. Her product ProductCard ile çizilir. ProductCard üzerindeki Add to Cart butonu CartContext.addItem() çağırır.
### Hocaya gösterilecek 20 saniyelik demo

- Landing.tsx → useEffect içinde api.get('/products') satırını göster.
- backend routes/products.ts → router.get('/') ile listProducts() çağrısını göster.
- seed.ts → products array içinde ‘Merino Wool Overcoat’ gibi ürünleri göster.
### Genişletme (Sprint 3+)

- Pagination: listProducts() içine take/skip ekle; frontend’de page parametreleri.
- Server-side filter/sort: Landing şu an client-side sort yapıyor; istersen query param’larını backend’e aktar.
- Product preview sayısı: Story ‘few products’ isterse Landing’de products.slice(0, 6) gibi göster.

### S1-G2) Registration UI (Create Account ekranı)

Amaç: Kullanıcı kayıt formu doldurup backend’e register request atabilsin.

Nerede?

- frontend/src/pages/Register.tsx → form ve submit.
- frontend/src/context/AuthContext.tsx → register(name,email,password) fonksiyonu.
- frontend/src/services/api.ts → axios baseURL + token header.
Nasıl çalışıyor?

1. Register.tsx kullanıcıdan name/email/password alır.
2. Submit → AuthContext.register() çağrılır.
3. AuthContext.register() → POST /auth/register atar; dönen token ve user localStorage’a kaydedilir.
4. Register sonrası user state set olur ve kullanıcı ‘logged-in’ sayılır.
5. Ayrıca register sonrası syncGuestCart() çalışır (guest cart varsa server’a aktarır).
Backend tarafı ile bağlantı:

- backend/src/routes/auth.ts → POST /register endpoint’i.
- backend/src/services/authService.ts → registerUser() bcrypt hash + prisma user create + JWT sign.
- backend/src/validators/auth.ts → registerSchema (Zod) ile input doğrulama.
- backend/src/middleware/errorHandler.ts → ZodError veya AppError formatlı response.
### S1-G3) Login UI (Sign In ekranı)

Amaç: Kullanıcı login olup JWT token alabilsin ve protected sayfalara erişebilsin.

Nerede?

- frontend/src/pages/Login.tsx → login formu.
- frontend/src/context/AuthContext.tsx → login(email,password).
- frontend/src/components/ProtectedRoute.tsx → login yoksa /login’e redirect.
Nasıl çalışıyor?

1. Login.tsx submit → AuthContext.login()
2. AuthContext.login() → POST /auth/login
3. Backend token döner → localStorage ‘token’ set edilir
4. Sonra syncGuestCart() çalışır: guestCart varsa /cart/sync ile merge edilir
5. User state set edilir; Navbar ‘Sign Out’ ve ‘Account’ gösterir.
### Genişletme (Sprint 2+)

- Password reset: yeni endpoint + email flow (ileride).
- Refresh token: JWT expiry yönetimini büyütmek.
- Role-based UI: user.role’a göre farklı menüler (sales_manager, product_manager).

### S1-G4) Secure Registration Backend

Amaç: Register endpoint’i güvenli olsun (validation, hash, error).

Nerede?

- backend/src/routes/auth.ts → /register route
- backend/src/services/authService.ts → registerUser()
- backend/src/validators/auth.ts → registerSchema
- backend/prisma/schema.prisma → User modeli (email unique)
- backend/src/middleware/errorHandler.ts → validation error format
Güvenlik noktaları (hocaya anlatım):

- Şifre plain text saklanmıyor: bcrypt.hash(..., 12) ile passwordHash field’ına yazılıyor.
- Email unique: prisma schema’da @unique → aynı email tekrar kayıt olamaz (409).
- Zod validation: name/email/password format kontrolü (min 8 karakter vb).
- Hata mesajları: AppError ile kontrollü status code + message.
### S1-G5) Secure Login Backend

Amaç: Login endpoint’i güvenli olsun (generic error, bcrypt compare, jwt).

Nerede?

- backend/src/services/authService.ts → loginUser()
- backend/src/validators/auth.ts → loginSchema
- backend/src/middleware/auth.ts → token verify (protected endpoint’ler için)
- backend/src/tests/auth.test.ts → validator/bcrypt/jwt testleri
Güvenlik noktaları:

- Email var mı yok mu sızdırmamak için generic error: 'Invalid email or password'.
- bcrypt.compare ile doğrulama.
- JWT içine sadece userId ve role koyuluyor (JwtPayload).
### S1-G6) Authentication Foundation (protected route + /me)

Amaç: Token ile kimlik doğrulama ve protected sayfa altyapısı.

Nerede?

- backend/src/middleware/auth.ts → authenticate() (Bearer token)
- backend/src/routes/auth.ts → GET /auth/me (authenticate ile korunuyor)
- frontend/src/components/ProtectedRoute.tsx → user yoksa /login
- frontend/src/services/api.ts → token interceptor (Authorization header)
Nasıl çalışıyor?

1. Frontend token’ı localStorage’da saklar.
2. api.ts interceptor her request’e Authorization: Bearer <token> ekler.
3. Backend authenticate() token’ı verify eder ve req.user’a userId/role ekler.
4. Protected endpoint’ler req.user.userId ile DB’den veri çeker (ör: /auth/me, /cart).

## 4) Sprint 2 story’leri (7–12) → Kod karşılığı (dosya + çalışma mantığı)

Senin paylaştığın Sprint 2 story listesi ürün preview + product model/listing + guest cart persistence + cart manage + logged-in cart persistence + guest-to-user merge logic idi. Bu kod tabanı bu story’leri zaten içeriyor. Aşağıda tek tek eşliyorum.

### Story 7) Product Preview on Landing / Product Area

Nerede?

- frontend/src/pages/Landing.tsx → ürün preview grid
- frontend/src/components/ProductCard.tsx → basic info + quick add
- backend/src/routes/products.ts → /api/products endpoint
Çalışma mantığı: Landing mount → GET /products → grid render.

### Story 8) Product Data Model & Product Listing Backend

Nerede?

- backend/prisma/schema.prisma → Product modeli (sku, price, stockQty, imageUrl, category)
- backend/src/services/productService.ts → listProducts(query) + getProduct(id)
- backend/src/routes/products.ts → GET /products, GET /products/:id, GET /products/categories
- backend/prisma/seed.ts → demo ürünleri DB’ye basar
Çalışma mantığı: Frontend products endpoint’ini çağırır; backend DB’den ürünleri alır; number dönüşümü yapıp döner (Decimal → Number).

### Story 9) Guest Cart UI & Local Persistence

Nerede?

- frontend/src/context/CartContext.tsx → guestItems state + localStorage (guestCart)
- frontend/src/components/Navbar.tsx → cart badge guest için de çalışır (count)
- frontend/src/pages/Cart.tsx → guest cart manage UI
Çalışma mantığı: user yokken addItem() guestItems’ı günceller ve localStorage’a yazar. Sayfa yenilense bile loadGuest() ile geri yüklenir.

### Story 10) Cart Management UI

Nerede?

- frontend/src/pages/Cart.tsx → quantity +/- ve remove
- frontend/src/context/CartContext.tsx → updateQty(), removeItem()
Guest için: updateQty/removeItem local state üzerinde. Logged-in için: API patch/delete çağrılır (server cart).

### Story 11) Authenticated User Cart Persistence

Nerede?

- backend/prisma/schema.prisma → CartItem modeli (userId + productId unique)
- backend/src/routes/cart.ts → /api/cart protected endpoints
- backend/src/services/cartService.ts → getCart/addToCart/update/remove
- frontend/src/context/CartContext.tsx → user varsa serverItems kullanır, api.get('/cart') ile fetch eder
Çalışma mantığı: user login olunca CartProvider fetchServerCart() ile server cart’ı çeker ve UI serverItems üzerinden çizilir.

### Story 12) Guest-to-User Cart Transfer & Merge Logic

Nerede?

- frontend/src/context/AuthContext.tsx → syncGuestCart()
- backend/src/routes/cart.ts → POST /api/cart/sync
- backend/src/services/cartService.ts → syncCart(userId, items) merge logic
Çalışma mantığı (en kritik):

1. Guest olarak ürün ekledin → localStorage guestCart doldu.
2. Login/Register olunca AuthContext token’ı kaydeder ve syncGuestCart() çalıştırır.
3. syncGuestCart() guestCart’ı /cart/sync’e gönderir.
4. Backend syncCart(): her item için stock kontrol eder; mevcutsa quantity’yi merge eder; yoksa create eder.
5. Sonunda getCart() döner. Frontend guestCart’ı localStorage’dan siler.
6. CartProvider user değişince /cart çağırıp server cart’ı günceller → UI artık server cart’ı gösterir.

## 5) Feature bazında “dosyalar arası bağlantı haritası”

Bu bölüm, bir görevi geliştirirken hangi dosyaları birlikte düşünmeniz gerektiğini gösterir (hocaya hâkimiyet için çok iyi).

### 5.1 Product Listing & Detail (Landing → ProductDetail)

    Landing.tsx
    -> api.get('/products')
    -> ProductCard.tsx (Link -> /products/:id)

    ProductDetail.tsx
    -> api.get('/products/:id')
    -> addItem() (CartContext)

    Backend:
    routes/products.ts -> services/productService.ts -> Prisma Product model
### 5.2 Auth (Register/Login → token → ProtectedRoute → /me)

    Register.tsx / Login.tsx
    -> AuthContext.register/login
    -> api.post('/auth/register' or '/auth/login')

    api.ts
    -> request interceptor adds Authorization: Bearer token

    ProtectedRoute.tsx
    -> if !user -> Navigate('/login')

    Backend:
    routes/auth.ts -> services/authService.ts
    middleware/auth.ts authenticate() -> req.user
    GET /auth/me -> getMe(userId)
### 5.3 Cart (Guest + Logged-in + Merge)

    Guest add:
    ProductCard/ProductDetail -> CartContext.addItem()
    -> guestItems state + localStorage('guestCart')

    Logged-in add:
    ProductCard/ProductDetail -> CartContext.addItem()
    -> POST /cart/items -> fetchServerCart()

    Login/Register after guest shopping:
    AuthContext.login/register -> syncGuestCart()
    -> POST /cart/sync (merge)
    -> localStorage guestCart cleared
    -> CartProvider fetchServerCart() -> UI shows server cart

## 6) İleri sprint’ler için genişletme rehberi (bozmadan ekleme)

Bu codebase, sprint’li geliştirmeye uygun katmanlı bir yapı kullanıyor. İleride ekleyeceğiniz her yeni özellik için genelde aynı pattern’i izleyin: Prisma model → service → route → frontend service/api → context/page.

### 6.1 Yeni bir backend özelliği ekleme (ör: Orders)

1. Prisma: schema.prisma içine Order ve OrderItem modellerini ekle.
2. Migration: npx prisma migrate dev --name add_orders
3. Service: backend/src/services/orderService.ts
4. Route: backend/src/routes/orders.ts ve server.ts’de app.use('/api/orders', ordersRoutes)
5. Auth: route’ları authenticate ile koru; role gerekiyorsa authorize('sales_manager') gibi kullan.
6. Frontend: api.ts ile endpoint çağır; pages/Orders.tsx gibi bir sayfa ekle.
### 6.2 Role-based erişim (sales_manager / product_manager)

Schema’da Role enum hazır. Middleware’de authorize() hazır. Şu an UI’da role bazlı sayfa yok, ama altyapı hazır.

- Backend: authorize('product_manager') ile ürün ekleme/silme endpoint’lerini koruyabilirsiniz.
- Frontend: user.role’a göre Navbar’da menü gösterebilirsiniz (Account içinde panel linkleri).
### 6.3 Checkout & Payment (Cart -> Order)

- Şu an Cart.tsx 'Payment flow future sprint' diyor. Bu bilinçli placeholder.
- İleride: /api/orders/checkout endpoint’i eklenir, cartItem’lardan order oluşturulur, stock düşülür (transaction).
- Frontend: Checkout page + form + success page.
### 6.4 Görsellik / UI geliştirme (hocanın tasarım beklentisi)

- Tailwind kullanımı zaten profesyonel bir temel sağlıyor (brand palette).
- Landing’de ‘few products preview’ istenirse: 6 ürün + ‘View all’ sayfası ekleyin.
- ProductDetail’e size/color seçimi gibi alanlar eklemek için Product modelini genişletin.
### 6.5 Test genişletme (kolay puan + güvenlik)

- Backend: cartService için edge-case testleri eklenebilir (stock exceed, merge clamp).
- Frontend: Vitest ile Cart sayfası smoke test, Navbar badge test.
- Her sprintte yeni story eklerken en az 1 test eklemek hem kalite hem ‘development activity’ için iyi.

## 7) “Hocaya hâkimiyet” için pratik sunum planı (2 dakikalık walkthrough)

1. App.tsx: Route’ları ve Providers’ı göster (AuthProvider + CartProvider).
2. api.ts: Token interceptor’ı göster (Authorization header).
3. AuthContext: login/register sonrası syncGuestCart() göster (story 12).
4. CartContext: user varsa server cart, yoksa guest cart mantığını göster.
5. Backend cartService: syncCart() merge logic’i göster (stock clamp).
6. Prisma schema: User/Product/CartItem modellerini göster.
## 8) Ek notlar ve ‘sakın bozmayın’ listesi

- .env dosyaları kişiye özel; repoya commitlenmez. Sadece .env.example repoda kalır.
- DATABASE_URL formatı: postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
- CORS şu an localhost:5173’e izin veriyor; deploy edecekseniz env üzerinden yönetmek daha iyi.
- Guest cart key: localStorage 'guestCart' → isim değiştirirseniz sync ve load etkilenir.
