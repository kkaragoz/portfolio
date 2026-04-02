
# İŞLEM YÖNETİM SİSTEMİ - DEPLOYMENT & KURULUM REHBERİ

## ✨ Tamamlanan Özellikler

### Teknoloji Stack
✅ Next.js 14.0.7
✅ TypeScript
✅ Tailwind CSS 4
✅ Prisma 7.1.0 (PostgreSQL Adapter)
✅ next-themes (Dark/Light Mode)
✅ Lucide React (İkonlar)
✅ Node.js Modules

### UI Bileşenleri
✅ Responsive Sidebar (Genişletilir/Daraltılabilir)
✅ Header (Tema Toggle + Navigation)
✅ Theme Provider (Açık/Koyu Mod Desteği)
✅ Mobile-First Design
✅ Tablet Desteği
✅ Desktop Desteği

### Veritabanı Şeması
✅ Symbol Tablosu
  - id (Primary Key, Auto Increment)
  - name (VARCHAR 10)
  - code1, code2, code3 (VARCHAR 5 - Raporlama)
  - note (VARCHAR 255)
  - createdAt, updatedAt (Timestamps)

✅ Transaction Tablosu
  - id (Primary Key, Auto Increment)
  - symbolId (Foreign Key → Symbol)
  - date (DateTime)
  - type (CHAR 1: B/S)
  - price, quantity, balance (Float)
  - note (VARCHAR 255)
  - createdAt, updatedAt (Timestamps)

### API Endpoints
✅ GET /api/symbols - Tüm sembolleri getir
✅ POST /api/symbols - Yeni sembol ekle
✅ PATCH /api/symbols/[id] - Sembolü güncelle
✅ DELETE /api/symbols/[id] - Sembolü sil

✅ GET /api/transactions - Tüm işlemleri getir
✅ POST /api/transactions - Yeni işlem ekle
✅ PATCH /api/transactions/[id] - İşlemi güncelle
✅ DELETE /api/transactions/[id] - İşlemi sil

### Sayfalar
✅ / (Giriş Ekranı)
  - Hoş geldin mesajı
  - Kısa başlangıç rehberi
  - Hızlı bağlantılar

✅ /symbols (Sembol Yönetimi)
  - Sembol tablosu görünümü
  - Ekle / Düzenle / Sil işlemleri
  - Form validasyonu
  - Responsive tablo

✅ /transactions (İşlem Kayıtları)
  - İşlem tablosu
  - Alım/Satım ayrımı (B/S)
  - Bakiye takibi
  - Ekle / Düzenle / Sil işlemleri
  - Responsive form

✅ /reports (Raporlar)
  - Placeholder sayfası
  - Gelecek geliştirmeler için hazır

---


---

## 🚀 GELİŞTİRME ORTAMI KURULUMU

### 1. PostgreSQL Kurulu mu?
Konsolda çalıştırın:
```powershell
psql -U postgres -c "SELECT version();"
```
Şifre: postgres

### 2. Veritabanı Oluştur
```powershell
psql -U postgres -c "CREATE DATABASE portfolio;"
```

### 3. Ortam Değişkenlerini Kontrol Et
Proje kökünde `.env` dosyasında:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/portfolio"
```

### 4. Bağımlılıkları Kur
```powershell
npm install
```

### 5. Prisma Migrasyonu
```powershell
npx prisma migrate dev --name init
```

### 6. Geliştirme Sunucusunu Başlat
```powershell
npm run dev
```
Tarayıcıda açın: **http://localhost:3000**

---

## 🏭 PRODUCTION DEPLOY ADIMLARI

### 1. Production Ortamı İçin .env.production
```env
DATABASE_URL="postgresql://kullanici:sifre@host:5432/portfolio"
NODE_ENV="production"
```

### 2. Production Build ve Çalıştırma
```powershell
npm run build
npm start
```

### 3. Reverse Proxy (Nginx) Örneği
```nginx
server {
  listen 80;
  server_name senin-domain.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### 4. SSL (Let's Encrypt ile önerilir)
Production ortamında HTTPS zorunlu olmalıdır.

### 5. Yedekleme & Geri Yükleme
**Yedek Al:**
```powershell
pg_dump -U postgres -d portfolio -F c -f backup_$(Get-Date -Format yyyyMMdd).dump
```
**Geri Yükle:**
```powershell
pg_restore -U postgres -d portfolio -c backup_YYYYMMDD.dump
```

---

### ADIM 5: Uygulamayı Başlat
```powershell
npm run dev
```

Tarayıcıda açın: **http://localhost:3000**

---

## 📋 PROJE YAPISI

```
c:\webapp\portfolio\
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── symbols/
│   │   │   │   ├── route.ts (GET/POST)
│   │   │   │   └── [id]/route.ts (PATCH/DELETE)
│   │   │   └── transactions/
│   │   │       ├── route.ts (GET/POST)
│   │   │       └── [id]/route.ts (PATCH/DELETE)
│   │   ├── symbols/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── page.tsx (Giriş)
│   │   ├── layout.tsx (Root Layout)
│   │   └── globals.css
│   ├── components/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── theme-provider.tsx
│   └── lib/
│       └── prisma.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .env
├── README.md
└── SETUP.md
```

---

## 🔧 GELIŞTIRME KOMUTLARI

```powershell
# Geliştirme sunucusunu başlat
npm run dev

# Production build et
npm run build

# Production'ı çalıştır
npm start

# Linting
npm run lint

# Prisma Studio (Veritabanı Arayüzü)
npx prisma studio

# Prisma Migration Oluştur
npx prisma migrate dev --name migration_name

# Veritabanını Sıfırla (TÜM VERİ SİLİNİR)
npx prisma migrate reset
```

---

## 📊 VERİTABANI BAĞLANTISI

- **Provider**: PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: portfolio
- **User**: postgres
- **Adapter**: @prisma/adapter-pg

---

## 🎨 TEMA DÖNÜŞÜMLERİ

Sağ üstteki ay/güneş ikonuna tıklayarak tema değiştirebilirsiniz:
- **Açık Tema**: Beyaz arka plan, koyu yazı
- **Koyu Tema**: Koyu arka plan, açık yazı
- **Sistem Tercihi**: İşletim sistemi ayarını izle

---

## 📱 RESPONSİVNESS

Uygulama aşağıdaki cihazlarda test edilmiştir:
✅ Mobil (< 640px) - Hamburger menü
✅ Tablet (640px - 1024px) - Responsive grid
✅ Desktop (> 1024px) - Full layout

---


## 🔐 GÜVENLİK & PRODUCTION NOTLARI

> **UYARI:** Bu uygulama varsayılan olarak kimlik doğrulama içermez ve tüm veriler açıktır. Production ortamında aşağıdaki önlemleri mutlaka alın:

- [ ] Kimlik doğrulama ekleyin (örn. NextAuth.js, Auth0)
- [ ] HTTPS zorunlu yapın (SSL/TLS)
- [ ] Ortam değişkenlerini gizli tutun (.env dosyalarını paylaşmayın)
- [ ] Rate limiting ve brute-force koruması ekleyin
- [ ] CORS ayarlarını sıkılaştırın
- [ ] Veritabanı erişim izinlerini minimumda tutun
- [ ] Gereksiz API endpointlerini kapatın
- [ ] Loglama ve hata izleme (örn. Sentry) entegre edin
- [ ] Yedekleme otomasyonu kurun

---

---


## 🛠️ HATA AYIKLAMA & LOG

### PostgreSQL Bağlantı Hatası
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
Çözüm:
1. PostgreSQL hizmetini kontrol edin
2. Services (services.msc) → postgresql-x64-16 → Başlat
3. Portu kontrol edin (varsayılan 5432)

### Prisma Hatası
```
Error: Prisma schema validation failed
```
Çözüm:
```powershell
npx prisma generate
```

### API Endpoints Çalışmıyor
1. Tarayıcı F12 → Console → Hataları kontrol et
2. Network sekmesinde API çağrılarını görün

3. `.env` dosyasını kontrol et
4. Sunucu loglarını ve terminal çıktısını incele
5. Gerekirse `npm run lint` ve `npm run build` ile hataları tespit et

---


## 🎯 GELİŞTİRMEDE SONRAKİ ADIMLAR

1. **Sembol Ekle** (/symbols)
   - En az 1 sembol oluştur
   - Rapor kodlarını ekle

2. **İşlem Kaydet** (/transactions)
   - Alım işlemi ekle
   - Satım işlemi ekle

3. **Raporlar Geliştir** (/reports)
   - Chart.js/Recharts kütüphanesi ekle
   - Grafik bileşenleri oluştur
   - İstatistikler hesapla

4. **Authentication** (İsteğe Bağlı)
   - NextAuth.js veya Auth0 entegre et
   - Kullanıcı yönetimi ekle
   - Veri izinlendirmesi

---


## 📦 YÜKLÜ ANA PAKETLER

- next@16.0.7
- react@19.2.0
- react-dom@19.2.0
- @prisma/client@7.1.0
- @prisma/adapter-pg@7.1.0
- next-themes@0.4.6
- lucide-react@0.556.0
- tailwindcss@4
- typescript@5
- pg (PostgreSQL driver)

---


---

## 📚 REFERANSLAR & EK DÖKÜMANLAR

- [README.md](README.md): Genel proje açıklaması ve kullanım
- [SETUP.md](SETUP.md): Detaylı kurulum ve PostgreSQL yönergeleri
- [Prisma Belgeleri](https://www.prisma.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)


Bu proje özel kullanım amacıyla oluşturulmuştur.

---


✨ **Başarılı Geliştiriciler Dileriz!** ✨

Sorularınız varsa README.md ve SETUP.md dosyalarına bakın.
