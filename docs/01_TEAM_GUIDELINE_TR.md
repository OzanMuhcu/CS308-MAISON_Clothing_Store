> Bu dosyayı GitHub reposunda `docs/` klasörü altına koyun.

# CS308 ShopHub (MAISON) — Sprint 1 Stabilization & Team Guideline

Bu doküman, ekibin Sprint-1 için nasıl “çalışan ve üzerine inşa edilebilir” bir temel oluşturduğunu; geçmişte yaşanan problemleri, neden bu yaklaşıma geçildiğini, şu anki kod tabanının (sprint1/ repo) mantığını ve bundan sonra nasıl ilerlenmesi gerektiğini ekip içi ortak bir referans olarak anlatır. Amaç: herkesin aynı sayfada olması ve Sprint 2+ geliştirmelerinde tekrar aynı entegrasyon krizlerinin yaşanmamasıdır.

## 1. Kısa Özet

- Sprint-1’de hedef: profesyonel bir landing + güvenli register/login + auth temeli + guest cart + örnek ürünler ve temel ürün listeleme.
- Geçmişteki ana sorun: “bitmiş/full proje kodu” ile sprint-scope uyuşmadığı için entegrasyon ve çalıştırma (DB/env) sürekli patladı.
- Çözüm: Sprint-1’e uygun, temiz, koşulabilir ve Sprint 2+ için genişletilebilir bir baseline codebase oluşturmak.
- Son durum: Backend + Frontend birlikte çalışıyor; DB seed ürünleri geliyor; register/login token üretiyor; cart çalışıyor; smoke test ile doğrulandı.
## 2. Geçmişte Yaşanan Problemler (Neden Yeni Bir Yaklaşım? )

Sprint-1’i “tam proje” kodundan kırpmaya çalışmak şu sorunları üretti:

- Scope karmaşası: Sprint-1’de görünmemesi gereken ileri modüller (invoice/discount/review vb.) kod tabanına karıştı; neyin gösterilip gösterilmeyeceği belirsizleşti.
- Çalıştırma krizi: Postgres bağlantısı, env değişkenleri ve migration/seed adımları net olmadığı için ürünler gelmedi, login/register çalışmadı.
- Entegrasyon krizi: Herkesin farklı yerden/branch’ten ilerlemesi main’i kırdı; “demo için bir yerden çalışsın” yaklaşımı teknik borcu büyüttü.
- UI kalitesi: Sprint-1’de bile arayüzün ‘derli toplu ve profesyonel’ görünmesi bekleniyordu; hızlı üretilen UI’lar ‘AI vibe’ verdi.
## 3. Alınan Karar: Sprint-1 Baseline’ı Önce Stabilize Etmek

Sprint bazlı geliştirmede en kritik prensip: Sprint 2+ eklemeleri yapılacaksa, önce Sprint-1’in sağlam bir temel olarak sabitlenmesi gerekir. Bu nedenle hedef, ‘tek seferde bitmiş proje’ değil; ‘Sprint-1 seviyesinde koşulabilir, anlaşılır, testli ve genişletilebilir iskelet’ oldu.

## 4. Planlama Aşaması: Ne İstiyoruz?

Sprint-1 kapsamı ekip tarafından netleştirildi. Temel ihtiyaçlar:

- Landing: ürün grid’i + arama/sıralama/filtre temel seviyede, profesyonel UI.
- Auth: register + login + /me endpoint + JWT tabanlı auth foundation.
- Guest cart: login olmadan sepete ekleme; login olunca sepetin korunması (sync).
- Seed data: kıyafet ürünleri ve demo kullanıcılar.
- Runbook: ‘hiç bilmiyoruz’ varsayımıyla adım adım kurulum/çalıştırma.
- Smoke test: herkesin çalıştırdıktan sonra tek tek doğrulayacağı kontrol listesi.
## 5. Yeni Kod Tabanı: Yapı ve Mantık

Repo yapısı monorepo şeklindedir: /backend ve /frontend ayrı çalışır. Backend TypeScript + Express; DB Prisma + PostgreSQL; Frontend Vite + React + Tailwind.

### 5.1 Backend (genel akış)

- src/server.ts: Express uygulaması, route mount, middleware ve CORS.
- src/routes/: auth, products, cart route tanımları.
- src/services/: iş mantığı (authService, productService, cartService).
- src/validators/: Zod şemaları (özellikle auth).
- src/middleware/: JWT auth guard, error handler.
- prisma/schema.prisma + seed.ts: DB modelleri ve örnek veri.
### 5.2 Frontend (genel akış)

- src/services/api.ts: backend’e istek atan ortak client (token ekleme vb.).
- src/context/AuthContext.tsx: login/register/logout + auth state yönetimi.
- src/context/CartContext.tsx: guest cart (localStorage) + server cart senkronizasyonu.
- src/pages/: Landing, ProductDetail, Cart, Login, Register, Account.
- src/components/: Navbar (cart badge), ProtectedRoute vb.
## 6. Neden Bu Kod “Üzerine İnşa Edilebilir”?

Sprint-2’ye geçerken en büyük risk, temel taşların (auth, DB, cart) dağınık olmasıdır. Bu codebase bunu engelleyecek şekilde katmanlı (routes → services → DB) kurulmuştur. İleri sprintlerde (orders/checkout/admin paneller) eklenecek kodlar, mevcut servis/route yapısına doğal şekilde eklenebilir.

## 7. Çalıştırma ve Doğrulama (Sprint-1)

Sprint-1’de “çalışıyor” demek için iki şey şarttır: (1) backend + DB doğru kuruldu, (2) frontend backend’e doğru URL ile erişiyor. Bu yüzden ekip içinde standart doğrulama adımları uygulanmalıdır.

### 7.1 Standart çalışma sırası

- PostgreSQL çalışıyor mu? (pg_isready)
- DB oluşturuldu mu? (createdb clothingstore)
- Backend: npm install → prisma generate → migrate → seed → npm run dev
- Frontend: npm install → npm run dev
- Kontrol: /api/health ve /api/products JSON dönüyor mu?
- UI Smoke: landing ürünleri gösteriyor mu? register/login token üretiyor mu? cart badge artıyor mu?
### 7.2 Sprint-1 Smoke Test Checklist (özet)

- Landing açılır; ürünler listelenir; search/sort/filter çalışır.
- Ürün detay sayfası açılır (SKU/stock/price).
- Guest kullanıcı sepete ekler; cart badge artar; cart sayfasında total görünür.
- Register başarılı olur; login token döner; /account protected route çalışır.
- Login sonrası guest cart korunur/senkronize olur.
## 8. GitHub ile İlgili Endişeler ve Neden Bu Yaklaşım Daha Güvenli?

Geçmişteki en büyük problem, herkesin aynı anda main’e dokunması ve projeyi kırmasıydı. Bu nedenle Sprint-1 baseline sabitlenince, bundan sonra ilerlemek için önerilen yaklaşım: main’i her zaman çalışır tutmak ve herkesin branch/PR üzerinden katkı yapmasıdır. Bu doküman GitHub komutlarını detaylandırmaz; GitHub için ayrı bir rehber hazırlanacaktır.

## 9. Eskiye Göre Avantajlar / Olası Dezavantajlar

### Avantajlar

- Koşulabilir tek kaynak (single source of truth): herkes aynı baseline’dan başlar.
- Daha az entegrasyon krizi: scope belli, runbook belli, smoke test belli.
- Sprint 2+ için temiz genişleme: yeni feature eklemek daha kolay.
- UI ve backend birlikte doğrulanmış: demo riski azalır.
### Olası dezavantajlar (gerçekçi)

- Kurulum adımlarına (DB_URL, migrate/seed) dikkat edilmezse tekrar ‘ürün yok / login yok’ gibi sorunlar yaşanabilir.
- Ekip GitHub branch/PR disiplinine uymazsa main yine kırılabilir (bu yüzden GitHub rehberi kritik).
## 10. Bundan Sonra Nasıl İlerleyeceğiz? (Sprint 2+ yaklaşımı)

Sprint 2 ve sonrası için kapsam her hafta güncellenecek. Ancak genel yöntem sabit kalmalı:

- Yeni sprint başlamadan önce: main’in çalıştığından emin ol (smoke test).
- Sprint backlog maddelerini küçük parçalara böl (UI, API, DB migration, test).
- Her parça için branch aç → küçük commit’ler → PR → merge.
- Merge sonrası: herkes main’i çekip (pull) kendi branch’ini günceller.
- Her sprint sonunda: kısa demo + kısa retro; hangi teknik borç kaldı not edilir.
## 11. Ek: Ekip İçin ‘Bilmiyorsan Bile’ Mini Kılavuz

- Bir şey çalışmıyorsa ilk bakılacak yer: backend terminal log’u + /api/health + /api/products.
- Ürünler gelmiyorsa %90: migrate/seed çalışmamıştır ya da DB_URL yanlış.
- Login çalışmıyorsa önce curl ile /auth/login test et; sonra UI tarafını kontrol et.
- CORS hatası görürsen frontend’in portu ve VITE_API_URL kontrol edilir.
