# CS308 — MAISON Clothing Store
## Runbook & Troubleshooting (Sprint 3–4, Beginner Friendly)

Bu doküman MAISON projesini (frontend + backend + PostgreSQL + Prisma) hiç bilmeyen birinin bile **sıfırdan güvenli şekilde çalıştırabilmesi** için hazırlanmıştır.
Ayrıca Sprint 3–4 sırasında en çok yaşanan hataların (DB bağlantısı, seed, port, test, email, image) hızlı çözüm rehberini içerir.

> Repo yapısı (güncel):
> - `backend/` (Node + Express + TypeScript + Prisma + Jest)
> - `frontend/` (React + Vite + TypeScript + Vitest)
> - `docs/` (takım dokümantasyonları)

---

# 0) Hızlı özet (en hızlı çalıştırma)

1) PostgreSQL’i aç (Postgres.app / brew service)  
2) DB oluştur: `maison_sprint3` (veya mevcut DB)  
3) Backend: `.env` → migrate → seed → dev  
4) Frontend: `.env` → dev  
5) Testler: backend `npm test`, frontend `npm test`

---

# 1) Ön koşullar (5–10 dk)

## macOS için gerekli araçlar
- Node.js (tercihen **18+ / 20+**)  
  Kontrol: `node -v`
- npm  
  Kontrol: `npm -v`
- PostgreSQL (Postgres.app önerilir)
- VS Code (opsiyonel)
- GitHub Desktop (opsiyonel)

> Not: `jest: command not found` görürsen %99 “backend’de npm install yapılmamıştır”.

---

# 2) Repo klasöründe doğru yerde misin?

Terminal:
```bash
cd CS308-MAISON_Clothing_Store
ls
```

Şunları görmelisin:
- `backend/`
- `frontend/`
- `docs/`
- `README.md`

---

# 3) PostgreSQL + Yeni DB oluşturma (güvenli yöntem)

## 3.1 PostgreSQL çalışıyor mu?
Terminal:
```bash
pg_isready
```
`accepting connections` görmelisin.

## 3.2 Yeni DB oluştur (önerilen)
Sprint3’te DB snapshot + order/invoice işleri büyüdüğü için en temiz yöntem:
- “Her sprint milestone” için ayrı DB veya en azından ayrı bir “fresh DB”.

Örnek DB adı (siz kullanmışsınız): **maison_sprint3**

Terminal:
```bash
createdb maison_sprint3
```

Zaten varsa:
- `already exists` → sorun değil.

## 3.3 Kullanıcı adını öğren (DB URL için)
Terminal:
```bash
whoami
```
Örn: `polatcanpolat`

---

# 4) Backend’i çalıştırma (Terminal)

## 4.1 Backend’e gir + env hazırlığı
```bash
cd backend
cp .env.example .env
```

## 4.2 backend/.env: DATABASE_URL nasıl yazılır?
Format:
```text
postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
```

**Postgres.app çoğu zaman şifresizdir:**
```env
DATABASE_URL="postgresql://polatcanpolat@localhost:5432/maison_sprint3?schema=public"
```

Eğer Postgres’te kullanıcı/şifre varsa:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/maison_sprint3?schema=public"
```

Diğer env:
```env
JWT_SECRET="en-az-32-karakter-uzun-random-string"
PORT=4000
```

## 4.3 Install + Prisma (sıfırdan kurulum sırası)
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

> Notlar:
> - `migrate dev` DB şemasını kurar/günceller  
> - `db:seed` örnek ürünleri, kategorileri, demo data’yı basar  
> - Seed çalışmazsa genelde “prisma.seed ayarı” eksiktir (aşağıdaki Troubleshooting’e bak)

## 4.4 Backend’i başlat
```bash
npm run dev
```

Backend genelde:
- `http://localhost:4000`
- API base: `http://localhost:4000/api`

## 4.5 Backend hızlı health kontrol
Yeni terminal aç:
```bash
curl -i http://localhost:4000/api/health
curl -i http://localhost:4000/api/products
```

---

# 5) Frontend’i çalıştırma (Terminal)

## 5.1 Frontend’e gir + env hazırlığı
```bash
cd ../frontend
cp .env.example .env
```

Frontend `.env` içinde genelde:
```env
VITE_API_URL=http://localhost:4000/api
```

## 5.2 Install + dev
```bash
npm install
npm run dev
```

Tarayıcı:
- `http://localhost:5173`

---

# 6) Test çalıştırma (Sprint 3–4 için kritik)

## 6.1 Backend unit test (Jest)
```bash
cd backend
npm test
```

Beklenen: PASS + toplam test sayısı.

> `jest: command not found` → `cd backend && npm install` yap.

## 6.2 Frontend test (Vitest)
```bash
cd frontend
npm test
```

Not: React Router “Future Flag Warning” gibi uyarılar çıkabilir; test PASS ise genelde blocker değildir.

---

# 7) Sprint 3 Demo Checklist (hızlı manuel kontrol)

## Auth + Cart
- Guest olarak ürün ekle → cart doluyor mu?
- Login/Register ol → guest cart item’ları **hemen** görünür mü?
- Logout ol → guest cart “sıfırlanıyor” mu?
- Tekrar login ol → user cart geri geliyor mu?

## Checkout + Payment (Story 13/15)
- Cart → Checkout (order summary) açılıyor mu?
- Checkout → Payment route doğru çalışıyor mu?
- Payment validation (card/expiry/cvv) hem FE hem BE tarafında çalışıyor mu?

## Orders + Stock (Story 16)
- Payment success → order oluşuyor mu?
- Stock azalıyor mu?
- Order success sonrası cart temizleniyor/finalize oluyor mu?

## Invoice + Email (Story 17)
- Payment success ekranında invoice görünüyor mu?
- PDF oluşuyor mu?
- Email gönderimi:
  - Ethereal test inbox’a düşüyor mu?
  - Gerçek mail’e gitmiyorsa “Email Troubleshooting” bölümüne bak

## Address (Story 14)
- Account/Profile içinde address update var mı?
- Checkout’ta address snapshot logic doğru mu? (profil değişse eski order address değişmemeli)

---

# 8) En sık hatalar ve çözümleri (Troubleshooting)

## 8.1 “Products yok / boş geliyor”
Sebep:
- Seed çalışmadı
- DB yanlış
- migrate yapılmadı

Çözüm:
```bash
cd backend
npx prisma migrate dev
npm run db:seed
```
DB URL’yi kontrol et: `.env` içindeki DBNAME doğru mu?

---

## 8.2 “Port in use” (EADDRINUSE)
- Backend: 4000
- Frontend: 5173

Portu kim kullanıyor?
```bash
lsof -i :4000
lsof -i :5173
```

Çözüm:
- O process’i kapat veya `.env` ile port değiştir

---

## 8.3 Prisma seed hatası: “add prisma.seed property…”
Bu hata gelirse Prisma, seed komutunun nasıl çalıştırılacağını bilmiyor demektir.

Çözüm (backend/package.json):
- `prisma` alanı eklenmeli:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Sonra tekrar:
```bash
npm run db:seed
```

---

## 8.4 “Can’t reach database server” / P1001 / P1003
Sebep:
- Postgres çalışmıyor
- DATABASE_URL yanlış

Çözüm:
- `pg_isready`
- `.env` DATABASE_URL kullanıcı/port/db adı doğru mu?
- DB gerçekten var mı?
```bash
psql -l
```

---

## 8.5 “Image unavailable / bazı ürünlerin fotosu yok”
En sık sebep:
- Seed’de URL/asset path hatalı
- Frontend’te fallback image mantığı tetikleniyor

Kontrol:
- `/api/products` çıktısında `imageUrl` alanı dolu mu?
- Dolu ama UI’da yoksa: frontend image render/host sorunu olabilir.
- Boşsa: seed data düzeltilecek.

---

## 8.6 Email Ethereal’da var ama gerçek mail’e gelmiyor

**Varsayılan davranış:** `SMTP_HOST` veya `SMTP_USER` boşsa → Ethereal test hesabı kullanılır.
Backend konsolunda şunu görürsünüz:
```
[Email] Sending invoice INV-xxxx via Ethereal (test) …
[Email] Ethereal preview URL: https://ethereal.email/message/…
```
Bu URL’yi tarayıcıda açınca email önizlemesini görebilirsiniz.

**Gmail ile gerçek mail göndermek için:**

1. Google hesabında 2 Adımlı Doğrulama’yı aç.
2. Google Hesabı → Güvenlik → Uygulama Şifreleri → yeni şifre oluştur (isim: “MAISON”).
   16 karakterlik şifre alırsınız — boşluksuz kullanın.
3. `backend/.env` dosyasını şu şekilde düzenle:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sizin-adresiniz@gmail.com
SMTP_PASS=abcdabcdabcdabcd
SMTP_FROM=”MAISON <sizin-adresiniz@gmail.com>”
```
4. Backend’i yeniden başlat: `npm run dev`

**Başarı logları (backend konsolunda):**
```
[Email] Sending invoice INV-xxxx via real SMTP (smtp.gmail.com) …
[Email] Invoice sent via real SMTP to musteri@example.com (messageId: …)
```

**Hata logları:**
```
[Email] Failed to send invoice INV-xxxx (real SMTP): Error: …
```
→ Uygulama şifresini kontrol et; 2FA açık mı? Şifrede boşluk var mı?

Not: Hata olsa bile sipariş oluşturulur; sadece email gitmez.

---

## 8.7 npm audit “moderate vulnerabilities”
Bu uyarı “çalışmayı” genelde bozmaz.
Körlemesine `npm audit fix --force` yapmak risklidir (breaking change).

Sprint demo öncesi öneri:
- Şimdilik dokunma
- İstenirse later: audit raporu çıkarıp kontrollü güncelle

---

# 9) VS Code ile çalıştırma (en rahat yöntem)

1) VS Code → Open Folder → `CS308-MAISON_Clothing_Store`
2) Terminal → New Terminal (2 adet aç)
3) Terminal-1:
```bash
cd backend
npm run dev
```
4) Terminal-2:
```bash
cd frontend
npm run dev
```

---

# 10) Yardım isterken ne paylaşalım? (hızlı debug seti)

- backend `.env` içindeki DATABASE_URL satırı (şifreyi XXXXX yap)
- backend terminal error log
- `curl -i http://localhost:4000/api/health` çıktısı
- `curl -i http://localhost:4000/api/products` (ilk 20 satır)
- tarayıcı console’daki hata
- ilgili test çıktısı (jest/vitest)
## Testleri Çalıştırma (Hızlı Kontrol)

**Backend (Jest)**
```bash
cd backend
npm test
```
Beklenen: `PASS ...` ve en sonda tüm testlerin geçtiğini görmelisiniz.

**Frontend (Vitest)**
```bash
cd frontend
npm test
```
Beklenen: `Test Files ... passed` ve tüm testlerin geçtiğini görmelisiniz.

Not: React Router “Future Flag Warning” gibi uyarılar testleri **fail** ettirmez; sadece ileri sürüm davranış değişiklikleri için bilgilendirmedir.

