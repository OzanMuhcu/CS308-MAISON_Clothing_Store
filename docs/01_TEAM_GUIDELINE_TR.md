# CS308 — MAISON Clothing Store
## Team Guideline (Sprint 3–4 sonrası: Stabil Main + Sprint Disiplini)

Bu doküman, MAISON projesinde ekip içi **ortak çalışma standardını** belirler. Amaç:
- `main` her zaman **demo-ready** kalsın,
- sprint’ler ilerlerken **regression** (eski akışların bozulması) yaşanmasın,
- herkesin katkısı (commit / test / bug / backlog) **görünür** olsun,
- yeni gelen biri “nereden başlayacağını” bilsin.

> **Kaynak doğruluk sırası:**  
> 1) Kod (backend/ frontend/)  
> 2) Root README.md  
> 3) `docs/` (bu dokümanlar)  
> Dokümanlar zamanla eskiyebilir; şüphede kalınca kodu kontrol edin.

---

# 1) Kısa özet (bugünkü durum)

MAISON, CS308 kapsamında geliştirilen bir **kıyafet e-ticaret** uygulamasıdır:
- **Backend:** Node + TS + Express + Prisma + PostgreSQL  
- **Frontend:** React + TS + Vite + Tailwind  
- **Test:** Backend Jest, Frontend Vitest

Sprint 3 ile birlikte temel satın alma akışı tamamlandı:
- Cart → Checkout → Payment (mock)
- Order oluşturma + stock düşme + cart finalize
- Invoice PDF + email (Ethereal / SMTP)

Sprint 4 odağı:
- Wishlist
- Reviews / Ratings / Comments (pending/approve)
- Role bazlı manager akışları (sprint scope’a göre)
- Bug fix’ler + test aktivitesi

---

# 2) Neden bu guideline? (geçmişte yaşananlar)

İlk sprintlerde ana problemler:
- “Tek doğru çalışan baseline” yoktu; backend/frontend uyumu bozuluyordu.
- DB/env/migrate/seed adımları net olmadığı için “ürün yok / login yok” gibi krizler yaşandı.
- GitHub’ta herkes aynı anda main’e dokununca **main kırıldı**.
- “Bitmiş proje kodunu kırpma” denemeleri integration’ı daha da zorlaştırdı.

Bu yüzden yaklaşım şu oldu:
- Önce çalışan, temiz ve genişletilebilir bir baseline,
- Sonra sprint’ler branch/PR ile güvenli şekilde eklenir.

---

# 3) Ana prensipler (değişmez kurallar)

## 3.1 Main kutsaldır
- `main` = “bugün demo varsa buradan demo alınır”
- `main` kırık kalamaz.
- PR’siz büyük değişiklik main’e girmez (acil hotfix hariç).

## 3.2 Sprint = küçük adımlar + test + dokümantasyon
Her story/bug için:
- küçük parçalar halinde geliştirme,
- unit test ekleme,
- README/docs güncelleme,
- kısa manual test checklist.

## 3.3 Regression (eski akışları bozmak) en büyük risk
Sprint 3 sonrası **asla bozulmaması gereken akışlar**:

1) Guest cart → login/register sonrası **hemen** merge olmalı (gecikmeli “sonradan gelme” yok)  
2) Logout sonrası guest view’da user cart görünmemeli  
3) Login tekrar → user cart persistence çalışmalı  
4) Out-of-stock ürünler aranabilir ama sepete eklenemez  
5) Checkout/Payment mock: kart bilgisi DB’ye yazılmaz  
6) Order success: stock düşer, cart sadece success sonrası temizlenir  
7) Invoice PDF indirilebilir olmalı; email testte Ethereal olabilir

Bu maddeler demo öncesi manuel checklist’te kontrol edilir.

---

# 4) Sprint başı → sprint sonu çalışma akışı

## 4.1 Sprint başı (1 saatlik standart)
1) Sprint backlog’u netleşir (TA/instructor ile).  
2) Her story/bug için GitHub Issue açılır (label: backend/frontend/test/docs/bug).  
3) “Owner” atanır (1 kişi).  
4) Her story için:
   - backend değişikliği var mı?
   - frontend değişikliği var mı?
   - DB migration gerekiyor mu?
   - test gerekecek mi?
   hızlıca yazılır.

## 4.2 Sprint içinde (günlük güvenli akış)
1) Main güncelle:
```bash
git checkout main
git pull origin main
```

2) Story için branch aç:
- `sprint4/story19-wishlist`
- `sprint4/bug114-cart-merge`

3) Kod değiştir → test et → commit et:
- `cd backend && npm test`
- `cd frontend && npm test`

4) Push + PR:
- PR açıklamasında: “ne değişti, nasıl test edildi”

5) Merge sonrası:
- herkes `git pull` yapar

## 4.3 Sprint sonu (demo öncesi)
- Demo checklist (bkz Bölüm 8) uygulanır.
- “Stable checkpoint” tag/release alınabilir (örn `v0.4-stable-sprint4`).

---

# 5) Rollerin sorumlulukları (pratik)

## 5.1 Scaffold / Integration Owner (gerekirse)
- Büyük birleşmelerde (birçok PR) merge sırasını yönetir.
- Main’i kırmayacak şekilde integration branch kullanabilir.

## 5.2 Story Owner
- Kendi story’sinin:
  - implementation’ı
  - testleri
  - docs/README güncellemeleri
  - manual test checklist’i
  sorumluluğunu taşır.

## 5.3 Reviewer
- PR’ı hızlıca kontrol eder:
  - testler çalışıyor mu?
  - gereksiz dosya girmiş mi? (.env, node_modules)
  - eski akışları bozuyor mu?

---

# 6) “Definition of Done” (Done demek ne demek?)

Bir story/bug “DONE” sayılması için:
1) Feature çalışıyor (UI + API akışı)  
2) Unit test eklendi (veya gerekçesi yazıldı)  
3) Regression yok (Sprint 3 kritik akışlar bozulmadı)  
4) README/docs gerekliyse güncellendi  
5) PR’da kısa test planı var

---

# 7) Development Activities (ders puanı için görünürlük)

Ders değerlendirmesinde genelde şu aktiviteler görünür olmalı:
- Commit (kişi başı hedef: **≥5**)
- Unit test (demo başı hedef: **≥25 yeni test case**)
- Bug report (Issue)
- Backlog item’ı (Issue/Project board)

**Doğru yöntem:**  
“Boş commit spam” yerine küçük ama gerçek işler:
- test ekleme
- bug fix
- docs update
- küçük UI polish

---

# 8) Demo Checklist (10 dakikalık hızlı kontrol)

## Backend hızlı kontrol
- `GET /api/health` OK
- `GET /api/products` boş değil
- `cd backend && npm test` PASS

## Frontend hızlı kontrol
- Landing ürünleri gösteriyor
- Search + sort + category filter çalışıyor
- Cart add/remove/qty çalışıyor
- Login/register çalışıyor
- `cd frontend && npm test` PASS

## Sprint 3 kritik akış
- Guest → cart add
- Login → cart merge hemen
- Checkout → Payment → Success
- Order oluşuyor, stock düşüyor, cart temizleniyor
- Invoice PDF indiriliyor
- Email: Ethereal preview log geliyor (real SMTP yoksa normal)

---

# 9) Dokümantasyon kuralı (docs/ nasıl güncellenecek?)

- Root README: “kullanıcı/TA repo ana sayfaya girince” görür.
- docs/: takım içi rehberler (runbook, github guide, code map).
- Değişiklik yapınca docs commit’i ayrı atılabilir:
  - `docs: update runbook for sprint4`
  - `docs: update code map`

---

# 10) Sık hatalar (mini rehber)

- Ürün yok → migrate/seed yapılmamış veya DB_URL yanlış
- jest yok → backend npm install yapılmamış
- invoice email gerçek mail’e gelmiyor → Ethereal test; SMTP env gerekir
- cart merge gecikmeli → AuthContext sync sırası bozulmuş olabilir

---

### Son güncelleme
Bu guideline en son **2026-05-03** tarihinde güncellenmiştir.
