> Bu dosyayı GitHub reposunda `docs/` klasörü altına koyun.

# CS308 ShopHub — Sprint 1 Runbook & Troubleshooting (Beginner Friendly)

Bu doküman, sprint1/ codebase’ini (backend + frontend + PostgreSQL + Prisma) hiç bilmeyen birinin bile çalıştırabilmesi için hazırlanmış adım adım kılavuzdur. Hem Terminal üzerinden hem de VS Code üzerinden nasıl çalıştırılacağını, ayrıca en sık görülen hataların sebep–çözüm rehberini içerir. En sonda Docker’a kısa bir not vardır (opsiyonel).

## 0) Ön koşullar (5 dakika)

- macOS + Terminal erişimi
- Node.js 20+ (kontrol: node -v)
- npm (kontrol: npm -v)
- PostgreSQL (Homebrew veya Postgres.app)
- VS Code (opsiyonel ama önerilir)
Not: Eğer Node sürümün 20’den küçükse Node 20+ kurmanız gerekir.

## 1) Klasör yapısı: doğru yerdesin mi?

Proje kökünde şu yapıyı görmelisin: sprint1/backend ve sprint1/frontend.

Terminalde kontrol:

cd sprint1 && ls

- backend klasörü görünmeli
- frontend klasörü görünmeli
- README.md görünmeli
## 2) PostgreSQL çalışıyor mu?

### 2.1 Postgres hazır mı kontrol

Terminal:

pg_isready

Çıktı 'accepting connections' olmalı.

### 2.2 Veritabanını oluştur

Bu proje örnek olarak clothingstore isimli DB kullanır.

Terminal:

createdb clothingstore

Eğer 'already exists' derse sorun değil.

## 3) Backend’i çalıştır (Terminal ile)

### 3.1 Backend klasörüne gir ve env hazırla

Terminal:

cd sprint1/backend

cp .env.example .env

### 3.2 .env dosyasını doldur

backend/.env içinde en kritik satır DATABASE_URL’dir.

Şifresiz (Mac’te yaygın) örnek:

DATABASE_URL="postgresql://KULLANICI_ADIN@localhost:5432/clothingstore?schema=public"

KULLANICI_ADIN genelde Terminal’de 'whoami' çıktısıdır.

JWT_SECRET için uzun bir string yaz (en az 32 karakter).

### 3.3 Kurulum + Prisma adımları

Sırayla çalıştır:

npm install

npx prisma generate

npx prisma migrate dev --name init

npm run db:seed

### 3.4 Backend’i başlat

Terminal:

npm run dev

Bu terminal açık kalmalı. Backend genelde http://localhost:4000 adresinde çalışır.

## 4) Backend hızlı kontrol (API)

Yeni bir terminal aç ve şu kontrolleri yap:

- curl http://localhost:4000/api/health
- curl http://localhost:4000/api/products | head
İkinci komutta ürün JSON’u görmelisin. Ürün yoksa seed çalışmamıştır veya DB bağlantısı yanlıştır.

## 5) Frontend’i çalıştır (Terminal ile)

### 5.1 Frontend klasörüne geç ve env hazırla

Terminal:

cd sprint1/frontend

cp .env.example .env

frontend/.env içinde VITE_API_URL benzeri bir satır varsa backend’e işaret ettiğinden emin ol. Örnek: VITE_API_URL=http://localhost:4000/api

### 5.2 Kur ve çalıştır

npm install

npm run dev

Tarayıcıda genelde http://localhost:5173 açılır.

## 6) Sprint 1 Smoke Test (tek tek)

Aşağıdaki sırayla kontrol et:

- Landing açılıyor mu? (ürün grid görünüyor mu?)
- Search/sort/filter çalışıyor mu? (en az fiyat sıralaması)
- Bir ürün detayına giriliyor mu? (/products/:id)
- Guest kullanıcı sepete ekleyebiliyor mu? (Navbar badge artıyor mu?)
- Cart sayfasında qty/total doğru görünüyor mu?
- Register çalışıyor mu? (başarılı olunca login veya home’a yönlenme)
- Login çalışıyor mu? (demo kullanıcı ile veya kayıtlı kullanıcı ile)
- /account gibi korumalı sayfa login olmadan açılmıyor mu?
- Login sonrası guest cart korunuyor/sync oluyor mu?
## 7) VS Code ile çalıştırma (kolay yöntem)

### 7.1 Projeyi VS Code’da aç

VS Code → File → Open Folder → sprint1 klasörünü seç.

### 7.2 İki terminal aç (VS Code içinden)

VS Code menü: Terminal → New Terminal

1. terminal: backend

cd backend

npm run dev

2. terminal: frontend

cd frontend

npm run dev

Not: İlk kez çalıştırıyorsan önce backend’de migrate/seed adımlarını (Bölüm 3.3) yap.

## 8) En sık hatalar ve hızlı çözümler

### 8.1 'Can't reach database server' / ürünler gelmiyor

- Postgres çalışıyor mu? (pg_isready)
- DATABASE_URL doğru mu? Kullanıcı adı doğru mu?
- DB oluşturuldu mu? (createdb clothingstore)
- Migrate + seed çalıştı mı? (prisma migrate, npm run db:seed)
### 8.2 Port zaten kullanımda (EADDRINUSE)

- Backend portu: 4000, Frontend portu: 5173 (genelde)
- Başka bir process bu portu kullanıyorsa kapat veya .env’de PORT’u değiştir
- macOS port kontrol: lsof -i :4000
### 8.3 CORS hatası / frontend 'Network Error'

- frontend .env’de API URL doğru mu? (http://localhost:4000/api)
- Backend CORS origin sadece 5173’e izin veriyor olabilir; frontend portu değiştiyse backend CORS ayarlanmalı
### 8.4 Prisma migrate hataları

- DB boş değilse: npx prisma migrate dev sıfırdan init yapmaya çalışınca hata verebilir
- Geliştirme sırasında en temiz yol: DB’yi düşür-yeniden oluştur (dropdb clothingstore; createdb clothingstore) ve migrate+seed tekrar
### 8.5 Login/Register çalışmıyor

- Önce backend API çalışıyor mu? (/api/health)
- Sonra /api/auth/register ve /api/auth/login endpoint’lerini curl ile test et
- Frontend API URL yanlışsa UI 'Something went wrong' diye kalır (asıl sebep network)
## 9) Küçük Docker notu (opsiyonel)

Docker zorunlu değil. Ancak ekipte herkesin Postgres kurulumuyla uğraşmaması için sadece PostgreSQL’i Docker ile çalıştırmak bazen çok rahatlatır. Bu projede Docker-compose varsa bile Sprint-1 için şart değildir. İleride ekip büyürse veya farklı bilgisayarlarda aynı ortamı garantilemek isterseniz Docker iyi bir seçenek olabilir.

## 10) Yardım isterken ne gönderelim? (en hızlı debug)

- backend/.env içindeki DATABASE_URL satırı (şifre varsa XXX yap)
- backend terminal log çıktısı (hata satırları)
- curl -i http://localhost:4000/api/health çıktısı
- curl -i http://localhost:4000/api/products çıktısı (ilk 5 satır)
- frontend tarayıcı console’daki hata (Network/CORS vb.)
