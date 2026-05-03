# CS308 — MAISON Clothing Store
## GitHub Master Guide (Sprint 3–4) — Hiç bilmeyene anlatır gibi, ama “main stabil” odaklı

Bu doküman MAISON repo’sunda GitHub’ı **en güvenli ve en kolay** şekilde kullanmak için hazırlanmıştır.
Ekipte Git tecrübesi az olsa bile, bu rehberi uygularsanız:
- `main` her zaman çalışır kalır,
- sprint’lerde “kim ne yaptı?” net görünür,
- demo öncesi checkpoint almak kolaylaşır,
- gereksiz krizler azalır.

> **Not:** Hocanız “tek maintainer commit atabilir” demişti.  
> Bu rehber, hem “tek kişi maintainer push” hem de “herkes branch + PR” düzenini içerir.

---

# 0) Altın kural (1 cümle)

✅ **Main = Demo sürümü. Main kırılmaz.**

---

# 1) GitHub terimleri (çok kısa sözlük)

- **Repo:** Projenin GitHub’daki evi (CS308_shophub / MAISON)
- **Clone:** Repo’yu bilgisayara indirmek
- **Branch:** Paralel çalışma hattı (story başına)
- **Commit:** Değişiklik kaydı (mantıklı paket)
- **Push:** Commit’leri GitHub’a gönderme
- **Pull:** GitHub’daki güncel main’i çekme
- **PR (Pull Request):** Branch’ini main’e merge etmek için “inceleme isteği”
- **Merge:** PR’ı main’e birleştirme
- **Conflict:** Aynı satırı iki kişi değiştirince çıkan çakışma
- **Tag/Release:** “Checkpoint” (geri dönüş noktası) — demo öncesi çok önemli

---

# 2) Hangi yöntem? (2 ayrı çalışma modeli)

## Model A — En güvenli ve ideal: Branch + PR (önerilen)
- Her story/bug için branch açılır
- PR ile main’e girer
- Testler yeşil olmadan merge edilmez

✅ Artıları:
- main kırılmaz
- kimin ne yaptığı net
- review kültürü oluşur

## Model B — Hızlı ama kontrollü: Tek maintainer commit (hocanın izin verdiği)
- Herkes kodunu maintainer’a yollar (veya aynı bilgisayarda toplarsınız)
- Maintainer tek başına main’e commit/push yapar

✅ Artıları:
- ekip Git bilmezse bile yürür
- zaman kazandırır

⚠️ Eksileri:
- “kim ne yaptı” görünürlüğü azalır  
  (bunu PR/Issue linki ve commit mesajlarıyla telafi edeceğiz)

> Sprint 4 ve sonrası için hedef: Model A’ya geçmek.  
> Şu an “kurtarıcı” olarak Model B kullanılabilir.

---

# 3) GitHub Desktop ile temel akış (en kolay yöntem)

## 3.1 Repo’yu bilgisayara alma (Clone)
1) GitHub Desktop → **File > Clone Repository**
2) URL’den repo’yu seç
3) Local path seç → **Clone**

## 3.2 Main’i güncelleme (Her işe başlamadan önce)
GitHub Desktop üstte:
- **Fetch origin** → sonra gerekirse **Pull origin**

✅ Hedef: main’in en güncel hali sende olsun.

## 3.3 Yeni branch açma (Story için)
GitHub Desktop:
- **Current branch** → **New Branch**

Branch isim standardı (öneri):
- `sprint4/story19-wishlist`
- `sprint4/story23-review-eligibility`
- `sprint4/bug114-cart-merge`
- `tests/backend-add-suite`
- `docs/runbook-update`

> “/” kullanmak iyi olur: branch’ler gruplandırılmış gibi görünür.

## 3.4 Commit atma
GitHub Desktop → **Changes** sekmesi
- Summary (zorunlu)
- Description (opsiyonel)
- **Commit to <branch>**

Commit mesaj formatı (basit ama güçlü):
- `story19: wishlist endpoints + seed`
- `bug114: fix guest cart merge timing`
- `tests(backend): add 40+ unit tests`
- `docs: update runbook for sprint4`

## 3.5 Push
Commit’ten sonra:
- **Push origin** (veya ilk kezse Publish branch)

## 3.6 PR açma
GitHub Desktop sağ üst:
- **Preview Pull Request** veya **Create Pull Request**

PR açıklamasına şunu koy:
- Neyi yaptın?
- Nasıl test ettin? (komutlar)
- Hangi dosyalar değişti? (kısaca)

---

# 4) Terminal ile hızlı akış (isteyene)

## 4.1 Main güncelle
```bash
git checkout main
git pull origin main
```

## 4.2 Branch aç
```bash
git checkout -b sprint4/story19-wishlist
```

## 4.3 Commit + push
```bash
git add -A
git commit -m "story19: wishlist model + endpoints"
git push -u origin sprint4/story19-wishlist
```

---

# 5) Sprint’te doğru çalışma rutini (pratik)

## 5.1 Story başlamadan önce checklist
- main güncel mi?
- backend test PASS mı?
- frontend test PASS mı?
- DB migrate/seed bozuldu mu?

Komutlar:
```bash
cd backend && npm test
cd ../frontend && npm test
```

## 5.2 Story bitince minimum şartlar (DoD)
- Feature çalışıyor
- Testler yeşil
- README/docs gerekirse güncellendi
- PR açıldı (Model A) veya maintainer commit mesajı düzgün (Model B)

---

# 6) “Commit sayısı önemli” — bunu doğru yönetme

Hocanın beklediği “commit sayısı” şu anlama gelir:
- düzenli çalışma
- story’leri parçalara bölme
- test ekleme
- bugfix + docs görünürlüğü

❌ Yanlış:
- boş commit spam
- “typo” ile 20 commit

✅ Doğru:
- 3–6 mantıklı commit (story başına)
Örnek:
1) `story19: prisma models + seed`
2) `story19: wishlist routes`
3) `story19: wishlist UI`
4) `tests: add wishlist unit tests`
5) `docs: update README and runbook`

---

# 7) Branch silme / rename / eski branch’ler

## 7.1 Branch silince commit’ler silinir mi?
- **Merge edilmişse:** commit’ler main history’de durur, branch silinse de kaybolmaz.
- **Merge edilmemişse:** commit’ler branch ile birlikte görünürlüğünü kaybeder ama Git objeleri bir süre repo’da kalabilir (garbage collection).  
  Yine de merge edilmemiş branch’i silmeden önce önemli bir şey var mı kontrol edin.

## 7.2 Eski branch’leri silmek güvenli mi?
Evet, şu durumlarda:
- branch merge olmuşsa
- veya “zaten kullanılmayacak” experimental branch ise

GitHub UI:
- Repo → Branches → çöp kutusu ikonuyla sil

---

# 8) Checkpoint: Tag / Release nasıl alınır? (Demo öncesi altın)

Amaç: “Çalışan sürümü sabitlemek”.

## 8.1 Ne zaman alınır?
- Demo’dan hemen önce (stabil)
- Büyük refactor öncesi
- Sprint sonunda

## 8.2 Tag isim standardı
- `v0.3-stable-sprint3`
- `v0.4-stable-sprint4`

## 8.3 GitHub üzerinden Release oluşturma
1) Repo → **Releases**
2) **Draft a new release**
3) Tag: `v0.4-stable-sprint4`
4) Title: `Stable Sprint 4 Checkpoint`
5) Notes:
   - sprint kapsamı
   - test durumu
   - bilinen bug’lar

> Bu sayede “o günün çalışan kodu” her zaman geri getirilebilir.

---

# 9) Büyük dosyalar ve gizli dosyalar (çok önemli)

## 9.1 Asla commit’lenmeyecekler
- `node_modules/`
- `.env` (gerçek şifre içerir)
- büyük `.mov` demo videoları (Drive’da kalmalı)

✅ commit’lenecekler:
- `.env.example`
- docs markdown dosyaları
- küçük görseller (UI için gerekiyorsa)

## 9.2 .gitignore kontrolü
Repo’da `.gitignore` olduğundan emin olun.
Yoksa ekleyin:
- node_modules
- .env
- dist/build

---

# 10) “Tek maintainer commit” modeli (hocanın izni) — en temiz uygulama

Amaç: herkes Git bilmeden bile katkıyı görünür kılmak.

Önerilen yöntem:
1) Herkes kendi bilgisayarında branch açar (veya sadece çalışır)
2) Kendi işini tamamlayınca:
   - değişen dosyaları listeler
   - kısa test çıktısı verir
3) Maintainer:
   - değişiklikleri toplar
   - tek PR veya tek commit ile main’e geçirir

Maintainer commit mesajları “kim ne yaptı”yı belirtmeli:
- `sprint4: merge story19 (A), story23 (B), tests (C)`
Description:
- A: wishlist endpoints + UI
- B: review eligibility
- C: 25+ tests

---

# 11) Sık sorunlar

## 11.1 PR butonu çıkmıyor
- branch publish edildi mi?
- push yaptın mı?
- remote doğru mu?

## 11.2 Conflict çıktı
- main’i güncellemeden branch açılmış olabilir
- çözüm:
  - main’e pull
  - conflict resolve
  - test çalıştır
  - push

## 11.3 “main’i silmek istemiyorum”
Silme.  
Sadece:
- yeni branch aç
- PR ile merge
- gerekiyorsa tag/release ile checkpoint al

---

### Son güncelleme
Bu GitHub rehberi en son **2026-05-03** tarihinde güncellenmiştir.
