> Bu dosyayı GitHub reposunda `docs/` klasörü altına koyun.

# CS308_shopHub — GitHub MASTER REHBERİ (V2)
Stabil Sprint 1 Koduna Geçiş + Çoklu/Solo Güncelleme + Sıfırdan Git/GitHub Kullanımı

Bu belge iki kritik işi çözer:
1) Şu an GitHub’da duran ‘eski/karmakarışık’ repo durumunu KAYBETMEDEN, yeni stabil Sprint 1 kod tabanına güvenli şekilde taşımak.
2) Ekip Git/GitHub bilmiyorsa bile sprint’leri bozmadan yürütebilmek için adım adım bir çalışma standardı oluşturmak.

Belge aşırı detaylıdır; amacı “kim neyi, nerede, hangi sırayla yapacak” sorusunu tamamen bitirmektir.

## 0) En kısa karar: Repo’yu nasıl stabil Sprint 1’e taşıyacağız?

İki pratik senaryo var. İkisi de çalışır. Yeni başlayan ekip için %95 ihtimalle Senaryo A en güvenlisidir.

### Senaryo A — Tek kişi (Scaffold Owner) tüm baseline’ı taşır (ÖNERİLEN)

- Bir kişi yeni sprint1 stabil kodunu repo’ya getirir (branch + PR ile).
- Diğerleri, main kırılmadan ‘küçük ama gerçek’ PR’larla katkı yapar (test, docs, UI polish, bug fix, issue/backlog).
- Avantaj: En az merge conflict, en az risk, en hızlı sonuç.
### Senaryo B — Çoklu taşıma (bundle/bölüm bölüm taşıma)

- Baseline taşınırken ekip üyeleri ‘bundle’lara ayrılır; herkes kendi bundle’ını ayrı branch’te taşır.
- Hepsi önce bir ‘integration branch’te birleşir, en son main’e alınır.
- Avantaj: “herkesin katkısı” daha görünür olabilir; dezavantaj: daha fazla merge riski.
Bu rehberde iki senaryoyu da sıfırdan anlatıyorum.

## 1) Çok önemli kurallar (Kırmızı çizgiler)

- Force-push YAPMA (history rewrite) → yeni başlayan ekipte repo’yu bozmanın en hızlı yolu.
- .env ASLA commitlenmez. Sadece .env.example commitlenir.
- node_modules ASLA commitlenmez.
- Main her zaman çalışır durumda kalmalı: merge öncesi smoke test.
- Herkes işe başlamadan önce: main’e pull.
- Her feature değişikliği branch + PR ile (mümkünse).
## 2) Git/GitHub 101 — Zihinsel model (çok basit)

### Git = bilgisayardaki zaman makinesi

Commit = fotoğraf çekmek. Commit mesajı = fotoğrafın etiketi. İstersen geçmiş fotoğraflara dönebilirsin.

### GitHub = internet üzerindeki kopya

Push = fotoğrafları GitHub’a yollamak. Pull = GitHub’daki yeni fotoğrafları bilgisayara almak.

### Branch = paralel evren

Main bozulmasın diye ayrı bir hatta çalışırsın. İş bitince PR ile main’e eklersin.

### PR = ‘ben yaptım, main’e alalım mı?’

Review + test + merge ile güvenli birleşme sağlar.

## 3) Mevcut repo’yu kaybetmeden yedekleme (Her senaryoda yapılacak)

Repo üzerinde ne yaparsanız yapın, önce yedek alın. Bu, geri dönüş garantinizdir.

### 3.1 Yedek: ‘archive branch’ oluşturma

    # Repo klasöründe
    git checkout main
    git pull origin main

    # Eski main’i yedekle
    git checkout -b archive/pre-sprint1-stable
    git push -u origin archive/pre-sprint1-stable

    # main’e geri dön
    git checkout main

### 3.2 Yedek: Tag koyma (opsiyonel ama aşırı faydalı)

Tag = ‘şu commit tam şu anki hâl’ etiketi. Geri dönmek çok kolaylaşır.

    git tag pre-stable-2026-04-01
    git push origin pre-stable-2026-04-01

## 4) SENARYO A — Tek kişi tüm repo’yu stabil Sprint 1’e taşır (en güvenli yöntem)

Bu yöntem yeni başlayan ekipler için en doğru yol. Çünkü baseline tek bir noktadan doğru şekilde yerleşir. Sonra herkes katkıyı PR’larla ekler. Böylece ‘hem çalışır main’ hem de ‘herkesin katkısı’ birlikte sağlanır.

### 4.1 Scaffold Owner seçimi (5 dk)

- Repo owner/admin erişimi olmalı veya maintainer yetkisi olmalı.
- Terminal + VS Code kullanabilmeli (çok ileri seviye değil).
- Sakin ve dikkatli biri olmalı: adımları birebir yapacak.
### 4.2 Hazırlık: sprint1 stabil klasörü hazır mı? (2 dk)

Scaffold Owner’ın bilgisayarında, zip’ten çıkan stabil sprint1 klasörü hazır olmalı. İçinde şunlar olmalı:

- backend/ (prisma/schema.prisma + seed.ts dahil)
- frontend/ (Vite + React + Tailwind)
- README.md
- .gitignore
NOT: node_modules yok. .env yok. Bu normal ve doğru.

### 4.3 Adım adım migrasyon (Terminal ile)

Aşağıdaki adımlar, GitHub’daki main’i PR ile stabil Sprint 1’e dönüştürür.

1. Repo’yu klonla.
2. Yeni baseline branch’i aç.
3. sprint1 içeriğini repo köküne kopyala ve eskileri replace et.
4. Lokal smoke test yap (önerilir).
5. Commit + push.
6. PR aç ve main’e merge et.
7. Main’e sprint1-stable tag koy.
8. Takıma ‘main güncellendi’ duyurusu yap, herkes pull etsin.
### 4.3.1 Repo’yu klonla

    cd ~/Desktop
    git clone https://github.com/OzanMuhcu/CS308_shophub.git
    cd CS308_shophub

### 4.3.2 Baseline branch aç

    git checkout main
    git pull origin main
    git checkout -b baseline/sprint1-stable

### 4.3.3 Dosyaları taşı (Finder ile kopyala-yapıştır)

Finder’da iki pencere aç:

- Pencere 1: zip’ten çıkan sprint1/ klasörü
- Pencere 2: klonladığın CS308_shophub/ klasörü (repo kökü)
sprint1 içinden şunları seçip repo köküne kopyala: backend/, frontend/, README.md, .gitignore

Mac sorarsa ‘Replace’ seç. Bu, eski karmaşık yapıyı temizleyip stabil yapıyı koyacak.

Sonra terminalde kontrol:

    git status
### 4.3.4 Repo hijyeni kontrol (çok kritik)

Aşağıdakiler asla repoya girmemeli:

- backend/.env ve frontend/.env
- backend/node_modules ve frontend/node_modules
- dist/, build/, coverage/
Kontrol için:

    # Eğer yanlışlıkla varsa görebilirsin
    git status

    # Şüpheli büyük klasör var mı?
    ls -la backend | head
    ls -la frontend | head

### 4.3.5 Lokal smoke test (merge’den önce önerilir)

Scaffold Owner merge etmeden önce 10 dk ayırıp çalıştırırsa, main’i kırma riski dramatik şekilde düşer.

    # Backend
    cd backend
    cp .env.example .env
    # .env içinde DATABASE_URL'ı düzelt
    npm install
    npx prisma generate
    npx prisma migrate dev --name init
    npm run db:seed
    npm run dev

Yeni terminal:

    # Frontend
    cd ../frontend
    cp .env.example .env
    npm install
    npm run dev

Hızlı test:

- http://localhost:4000/api/health
- http://localhost:4000/api/products (12 ürün)
- http://localhost:5173 (Landing)
- Guest cart add → cart badge
- Register/Login → token ve account
### 4.3.6 Commit + push

    cd .. # repo köküne dön
    git add -A
    git commit -m "scaffold: Sprint 1 stable baseline (MAISON)"
    git push -u origin baseline/sprint1-stable

### 4.3.7 GitHub UI üzerinden PR açma (tık tık)

1. GitHub repo sayfasına gir.
2. Pull requests sekmesine gir.
3. New pull request.
4. Base: main seç.
5. Compare: baseline/sprint1-stable seç.
6. Title: Scaffold: Sprint 1 stable baseline
7. Description: 'Eski main archive/pre-sprint1-stable branch'inde yedeklendi. Bu PR stabil sprint1 baseline taşır.'
8. Create pull request.
9. Merge pull request → Confirm merge.
### 4.3.8 Merge sonrası yapılacaklar

    # Kendi bilgisayarında main'e dönüp güncelle
    git checkout main
    git pull origin main

GitHub’da tag:

    git tag sprint1-stable
    git push origin sprint1-stable

Takıma mesaj: “main güncellendi, herkes git pull yapsın.”

## 5) SENARYO B — Çoklu güncelleme (bundle/bölüm bölüm taşıma)

Bu yöntem daha riskli ama mümkün. Buradaki amaç: “herkesin baseline’a katkısı daha görünür olsun” veya tek kişiye yük binmesin. Bunun için ‘integration branch’ kullanacağız: önce orada birleşecek, en son main’e alınacak.

### 5.1 Çoklu taşımanın temel prensibi

- Asla herkes main’e aynı anda push yapmaz.
- Herkes kendi branch’inde çalışır.
- Herkes PR’ını ‘integration branch’ içine açar (main’e değil).
- Integration branch stabil hale gelince integration → main PR yapılır.
### 5.2 Roller

- Integration Owner: integration branch’i açar, PR’ları merge eder, conflict çözer (1 kişi).
- Bundle Owners: kendi bundle’larını taşır (diğer kişiler).
- Reviewer: en az 1 kişi PR’ları gözden geçirir (aynı kişi olabilir).
### 5.3 Adım adım akış (çoklu)

1. Integration Owner: main’i yedekler (archive branch/tag).
2. Integration Owner: integration/sprint1-stable branch açar ve GitHub’a push eder.
3. Bundle Owners: integration branch’inden kendi branch’lerini açar.
4. Her Bundle Owner: sprint1.zip’ten sadece kendi bundle’ına ait dosyaları repo’ya taşır.
5. Her Bundle Owner: commit + push + PR (target: integration/sprint1-stable).
6. Integration Owner: README’deki merge order’a göre PR’ları sırayla merge eder.
7. Integration Owner: integration branch’te smoke test yapar.
8. Integration Owner: integration → main PR açar ve merge eder.
### 5.4 Bundle paylaşımı (pratik ve çakışmayı azaltan)

README’de 6 bundle önerisi var. Çoklu taşıma için daha da netleştiriyoruz:

- Bundle A (Backend Core): prisma/ + server.ts + config/ + middleware/ + routes/ + services/ + validators/
- Bundle B (Frontend Core): App.tsx + main.tsx + services/api.ts + context/ + routing guard
- Bundle C (UI Pages): pages/ + components/ (Landing, ProductDetail, Cart, Login, Register, Account)
- Bundle D (Docs & Hygiene): README.md + .gitignore + env.example kontrolleri + small fixes
- Bundle E (Tests): backend tests + frontend smoke tests
Not: Yeni başlayan ekipte aynı dosyayı iki kişi taşımasın. Eğer taşıyacaksa ‘tek owner’ seçin.

### 5.5 Merge order (conflict azaltmak için)

- 1) Backend Core (Bundle A)
- 2) Frontend Core (Bundle B)
- 3) UI Pages (Bundle C)
- 4) Docs & Hygiene (Bundle D)
- 5) Tests (Bundle E)
Her merge sonrası: integration owner kısa smoke test yapar (health, products, landing).

### 5.6 Çoklu yöntemin en büyük riski ve çözümü

Risk: aynı dosyayı iki kişinin değiştirmesi → conflict. Çözüm: Dosya sahipliği + merge order + integration branch.

Ek kural: Herkes PR açmadan önce integration’ı kendi branch’ine merge etsin:

    git checkout your-branch
    git fetch origin
    git merge origin/integration/sprint1-stable

## 6) ‘Herkesin katkısı görünmeli’ gereksinimi için güvenli katkı planı (Baseline bozmadan)

Dersin değerlendirme tarafında commit/test/bug/backlog gibi aktiviteler önemli olabilir. Baseline’ı tek kişi getirince endişe şu: “diğerleri katkısız mı görünecek?”

Çözüm: Baseline merge olduktan sonra herkes 1–2 küçük ama gerçek PR yapar. Bu PR’lar baseline’ı BOZMAZ, sadece iyileştirir.

### 6.1 Güvenli PR örnekleri (Sprint 1 üstü polish)

- UI polish: spacing/typography düzeltme, responsive iyileştirme, hata mesajlarının tutarlılığı.
- Docs: runbook + troubleshooting ekleme, kısa video linki, ‘how to run’ netleştirme.
- Tests: auth edge-case testleri, cart sync edge-case testleri, frontend smoke test genişletme.
- Bug fix: küçük bir bug’ı Issue açıp Fix PR ile kapatma.
- Backlog: GitHub Issues + labels + milestones düzeni kurma (Projects).
### 6.2 Her kişi için “1 saatlik katkı PR” şablonu

1. Issue aç (örn: [UI] Improve register error states).
2. Branch aç: feature/issue-12-register-errors
3. Küçük değişiklik yap
4. Test et (smoke)
5. Commit + push
6. PR aç (Fixes #12 yaz)
## 7) Günlük kullanım (Hiç bilmeyen için, sıfırdan)

### 7.1 İşe başlamadan önce (her gün)

    git checkout main
    git pull origin main

### 7.2 Yeni iş için branch aç

    git checkout -b feature/sprint2-something

### 7.3 Değişiklik yap → commit

    git add -A
    git commit -m "feat: sprint2 something"

### 7.4 Push ve PR

    git push -u origin feature/sprint2-something

Sonra GitHub UI: Pull requests → New → base main, compare senin branch → Create PR.

## 8) VS Code ile Git (tık tık)

- VS Code → Open Folder → repo klasörünü aç.
- Sol menü: Source Control (branch ikonu).
- Değişiklikleri Stage (+) yap → commit mesajı yaz → Commit.
- Push/Sync: Değişiklikleri GitHub’a gönder.
- Sol alt: branch adına tıkla → Create new branch.
Not: VS Code kullanırken de en kritik şey: işe başlamadan önce Pull yapmak.

## 9) GitHub Web UI ile PR/Merge (çok basit)

1. Repo → Pull requests → New pull request
2. Base: main, Compare: senin branch
3. PR açıklaması: ne yaptın? nasıl test ettin?
4. Review (en az 1 kişi)
5. Merge pull request
6. Merge sonrası herkes main’i pull eder
## 10) Merge conflict (korkma, çözülür)

Conflict = aynı satır iki farklı şekilde değişmiş. Git bunu otomatik birleştiremez. Çözüm: VS Code conflict UI.

- Accept Current: senin branch’i tutar
- Accept Incoming: main’deki değişikliği tutar
- Accept Both: ikisini birden tutar (sonra düzenlersin)
    # conflict çözdükten sonra
    git add <file>
    git commit -m "merge: resolve conflict"
    git push

## 11) En sık hatalar ve net çözümler

### 11.1 non-fast-forward (push rejected)

Sebep: GitHub’da senin çekmediğin yeni commit var. Çözüm: pull → conflict varsa çöz → push.

    git pull origin main
    git push origin main
### 11.2 Yanlışlıkla .env commit

Kritik: secret sızdırma riski. Hemen kaldır ve secret değiştir.

    git rm --cached backend/.env frontend/.env
    echo ".env" >> .gitignore
    git add .gitignore
    git commit -m "chore: remove env files"
    git push
### 11.3 node_modules commit

    git rm -r --cached backend/node_modules frontend/node_modules
    echo "node_modules/" >> .gitignore
    git add .gitignore
    git commit -m "chore: remove node_modules"
    git push
### 11.4 Büyük dosya (zip/video) repoya kondu

Büyük dosyaları repoya koymak yerine Drive/Release kullanın. Repo şişerse herkesin işleri yavaşlar.

### 11.5 Yanlış branch’te çalıştım

    # Değişiklikleri kaybetmeden yeni branch'e taşıma
    git checkout -b feature/correct-branch
    git add -A
    git commit -m "wip: move work to correct branch"
    git push -u origin feature/correct-branch

## 12) Sprint’li düzenin GitHub karşılığı (Issue/Labels/Milestones)

### 12.1 Issue açma standardı

- Başlık: [FE] Add size filter to product list
- Açıklama: amaç + done kriteri + ekran görüntüsü gerekiyorsa
- Labels: frontend/backend/test/docs/bug
- Assignee: işi yapacak kişi
### 12.2 Milestone (Sprint 2, Sprint 3…)

Milestone = bu sprintte bitecek işler. Sprint başında milestone açıp issue’ları içine koyabilirsiniz.

### 12.3 GitHub Projects (opsiyonel ama çok iyi)

Kanban gibi: Todo / In progress / Review / Done. Yeni başlayan ekipte bile işleri toparlar.

## 13) PR kalite standardı (Merge’den önce kontrol)

- Kod çalışıyor (backend + frontend).
- Smoke test geçti: /api/health, /api/products, landing, cart, auth.
- Yeni env var geldiyse .env.example güncellendi.
- .env commitlenmedi.
- node_modules yok.
- PR açıklamasında ‘ne yaptım / nasıl test ettim’ var.
## 14) Geri dönüş planı (main bozulursa)

Main bozulursa panik yok. Yedek branch/tag sayesinde geri dönmek mümkün.

- Son merge commit’i Revert (GitHub UI’de Revert butonu).
- Tag’li noktaya dönüp yeni PR ile tekrar sabitlemek.
- archive/pre-sprint1-stable branch’inden kıyaslama yapmak.
## 15) Ek: Komut kopya kartı (en sık kullanılanlar)

    # Gün başı
    git checkout main
    git pull origin main

    # Yeni iş
    git checkout -b feature/my-task

    # Kaydet
    git add -A
    git commit -m "feat: my-task"

    # Gönder
    git push -u origin feature/my-task
