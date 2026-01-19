# İşlem Yönetim Sistemi

Sembolleri ve alım/satım işlemlerini yönetmek için geliştirilmiş modern bir web uygulaması.

## Teknoloji Stack

- **Framework**: Next.js 14
- **Dil**: TypeScript
- **Stil**: Tailwind CSS
- **Veritabanı**: PostgreSQL
- **ORM**: Prisma
- **UI Kütüphanesi**: Lucide React (ikonlar)
- **Tema**: next-themes (Açık/Koyu mod)

## Özellikler

✅ **Responsive Tasarım** - Mobil, tablet ve masaüstü cihazlarda mükemmel çalışır
✅ **Dark/Light Tema** - Kullanıcı tercihine göre tema değiştirme
✅ **Sembol Yönetimi** - Sembolleri ekle, düzenle ve sil
✅ **İşlem Kayıtları** - Alım/satım işlemlerini kaydet ve takip et
✅ **Kolaylaştırılmış UI** - Sağ tarafta geniş, sol tarafta daraltılabilir menü
✅ **FIFO Bakiye Takibi** - Alış işlemlerinde bakiye hesaplaması

## Proje Yapısı

```
src/
├── app/
│   ├── api/
│   │   ├── symbols/      # Sembol API endpoints
│   │   └── transactions/ # İşlem API endpoints
│   ├── symbols/          # Sembol yönetimi sayfası
│   ├── transactions/     # İşlem kayıtları sayfası
│   ├── reports/          # Raporlar sayfası (şimdilik placeholder)
│   ├── globals.css       # Global stiller
│   └── layout.tsx        # Root layout
├── components/
│   ├── header.tsx        # Üst başlık bileşeni
│   ├── sidebar.tsx       # Sol menü bileşeni
│   └── theme-provider.tsx # Tema sağlayıcısı
└── lib/
    └── prisma.ts         # Prisma client konfigürasyonu

prisma/
└── schema.prisma         # Veritabanı şeması
```

## Kurulum Adımları

### 1. Gereksinimler

- Node.js 18+ 
- PostgreSQL 12+
- npm veya yarn

### 2. PostgreSQL Kurulumu (Windows)

PostgreSQL Windows için:
1. https://www.postgresql.org/download/windows/ adresinden indirin
2. Kurulum sırasında:
   - Kullanıcı adı: `postgres`
   - Şifre: `postgres` (veya tercih ettiğiniz şifre)
   - Port: `5432`

3. PostgreSQL doğru kurulmuş mu kontrol et:
```powershell
psql -U postgres -c "SELECT version();"
```

### 3. Veritabanı Oluşturma

PostgreSQL üzerinde `mywebapp` adlı veritabanı oluşturun:

```powershell
psql -U postgres -c "CREATE DATABASE mywebapp;"
```

### 4. Ortam Değişkenlerini Ayarla

`.env` dosyası zaten oluşturulmuştur. PostgreSQL kurulumunuza göre düzenleyin:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mywebapp"
```

### 5. Prisma Migrasyonlarını Çalıştır

```powershell
npx prisma migrate dev --name init
```

Bu komut:
- Prisma şemasını PostgreSQL'e uygular
- `Symbol` ve `Transaction` tablolarını oluşturur
- Prisma Client'ı generate eder

### 6. Uygulamayı Başlat

```powershell
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışmaya başlayacaktır.

## Veritabanı Şeması

### Symbol Tablosu
| Sütun | Tür | Açıklama |
|-------|-----|----------|
| id | INT | Birincil anahtar (otomatik artış) |
| name | VARCHAR(10) | Sembol adı |
| code1 | VARCHAR(5) | Rapor kodu 1 |
| code2 | VARCHAR(5) | Rapor kodu 2 |
| code3 | VARCHAR(5) | Rapor kodu 3 |
| note | VARCHAR(255) | Notlar |
| createdAt | TIMESTAMP | Oluşturulma tarihi |
| updatedAt | TIMESTAMP | Güncellenme tarihi |

### Transaction Tablosu
| Sütun | Tür | Açıklama |
|-------|-----|----------|
| id | INT | Birincil anahtar (otomatik artış) |
| symbolId | INT | Sembol referansı (Foreign Key) |
| date | TIMESTAMP | İşlem tarihi |
| type | CHAR(1) | B (Alım) veya S (Satım) |
| price | FLOAT | Fiyat |
| quantity | FLOAT | Miktar |
| balance | FLOAT | Alış bakiyesi (Satışlarda NULL) |
| note | VARCHAR(255) | Notlar |
| createdAt | TIMESTAMP | Oluşturulma tarihi |
| updatedAt | TIMESTAMP | Güncellenme tarihi |

## Sayfalar

### 1. Giriş (/)
Uygulamaya giriş sayfası. Özet kartlarla diğer sayfalara hızlı erişim.

### 2. Sembol Tanımları (/symbols)
- Sembolleri görüntüle, ekle, düzenle ve sil
- Rapor kodlarını yönet
- Notlar ekle

### 3. İşlem Kayıtları (/transactions)
- Alım/satım işlemlerini kaydet
- İşlem detaylarını düzenle
- Bakiye takibi (alış işlemleri için)
- İşlemleri sil

### 4. Raporlar (/reports)
Placeholder sayfa. Gelecekte:
- Grafikler
- İstatistikler
- Analiz raporları

## Geliştirme Komutları

```powershell
# Geliştirme sunucusunu başlat (http://localhost:3000)
npm run dev

# Production build
npm run build

# Production build'i çalıştır
npm start

# Linting kontrolü
npm run lint

# Prisma Studio'yu aç (veritabanı yönetimi)
npx prisma studio
```

## Deployment Hazırlığı

### Vercel'e Deploy Etmek İçin

1. GitHub'a push edin
2. https://vercel.com adresine gidin
3. "New Project" tıklayın ve GitHub repository'nizi seçin
4. Vercel Dashboard'dan ortam değişkenlerini ayarlayın:
   ```
   DATABASE_URL=your_postgres_connection_string
   ```
5. Deploy'ı başlatın

### Kendi Sunucuya Deploy Etmek İçin

1. Node.js ve PostgreSQL kurun
2. Repository'yi klonlayın
3. `.env` dosyasını yapılandırın
4. `npm install` çalıştırın
5. `npm run build` çalıştırın
6. PM2 veya similar ile `npm start` başlatın
7. Nginx/Apache'yi reverse proxy olarak yapılandırın

## Sorun Giderme

### "ECONNREFUSED - PostgreSQL bağlantısı başarısız"
- PostgreSQL hizmetinin çalışıp çalışmadığını kontrol edin
- `.env` dosyasındaki DATABASE_URL'i kontrol edin
- Veritabanı adının doğru olduğundan emin olun

### "Prisma migrate hatası"
```powershell
npx prisma db push
```
veya
```powershell
npx prisma migrate resolve --rolled-back migration_name
```

### "Sayfalar boş yükleniyor"
- Tarayıcı konsolu hatasını kontrol edin (F12)
- API endpoints'lerinin çalışıp çalışmadığını kontrol edin
- Prisma Client'ın generate edilmiş olduğundan emin olun

## Lisans

Özel kullanım için oluşturulmuştur.

---

**Sürüm**: 1.1.1
**Son Güncellenme**: 19 ocak 2025


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
