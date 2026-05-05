# Portföy Yönetim Sistemi - İlk Kurulum Talimatları

Tebrikler! Portföy Yönetim Sistemi başarıyla kurulmuştur. Uygulamayı çalıştırmaya başlamadan önce PostgreSQL veritabanını ayarlamanız gerekmektedir.

## ADIM 1: PostgreSQL Kurulumu

### Windows'ta PostgreSQL Kurulması

1. **PostgreSQL İndir**: https://www.postgresql.org/download/windows/ adresine gidin
   
2. **Kurulum Sırasında**:
   - Setup Language: English seçin
   - Installation Directory: Varsayılanı kullanın (C:\Program Files\PostgreSQL\)
   - Components: Tümünü seçili tutun
   - Data Directory: Varsayılanı kullanın
   - **Şifre**: `postgres` yazın (Not: Bunu hatırlayın!)
   - Port: `5432` (varsayılan)
   - Locale: Turkish seçebilirsiniz

3. **Kurulum Tamamlandı**: Next tuşlarına basarak tamamlayın

### PostgreSQL'in Yüklü Olduğunu Kontrol Etme

PowerShell'i yönetici olarak açın ve şu komutu çalıştırın:

```powershell
psql -U postgres -c "SELECT version();"
```

Şifre sorulursa: `postgres` yazın

Başarılı çıkış örneği:
```
PostgreSQL 16.0 (Windows 10) ...
```

---

## ADIM 2: Veritabanı Oluşturma

PowerShell'de aşağıdaki komutu çalıştırın:

```powershell
psql -U postgres -c "CREATE DATABASE mywebapp;"
```

Şifre: `postgres`

Başarı mesajı: `CREATE DATABASE`

---

## ADIM 3: Ortam Ayarlarını Doğrula

Proje klasöründe `.env` dosyası açın ve şunu kontrol edin:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mywebapp"
```

PostgreSQL şifresini farklı yaptıysanız, bunu güncelleyin:
```env
DATABASE_URL="postgresql://postgres:SENIN_SIFRIN@localhost:5432/mywebapp"
```

---

## ADIM 4: Veritabanı Migration'ını Çalıştır

Proje klasöründe PowerShell açın ve şu komutu çalıştırın:

```powershell
npx prisma migrate dev --name init
```

Çıkış örneği:
```
✔ Successfully created migrations folder at prisma/migrations
✔ Your database is now in sync with your schema. Wonderful!

✔ Generated Prisma Client (v7.1.0)
```

---

## ADIM 5: Uygulamayı Başlat

Proje klasöründe PowerShell açın:

```powershell
npm run dev
```

Çıkış örneği:
```
> mywebapp@0.1.0 dev
> next dev

  ▲ Next.js 16.0.7
  - Local:        http://localhost:3000
```

Tarayıcıda açın: **http://localhost:3000**

---

## Başarılı Kurulum Kontrol Listesi

✅ PostgreSQL yüklü ve çalışıyor
✅ mywebapp veritabanı oluşturuldu
✅ `.env` dosyası doğru şekilde ayarlanmış
✅ `npx prisma migrate dev --name init` başarılı oldu
✅ `npm run dev` http://localhost:3000 adresinde uygulamayı açtı
✅ Sembol, İşlem ve Rapor sayfalarına erişebiliyorsunuz
✅ Dark mode toggle düğmesi sol tarafta görünüyor

---

## Uygulamayı Kapatmak

Terminal penceresinde: **CTRL + C** tuşlarına basın

---

## Sorun Giderme

### PostgreSQL kurulmuş mu?
```powershell
psql --version
```

### PostgreSQL hizmeti çalışıyor mu?
**Windows Services** (services.msc) açın ve "postgresql-x64-16" hizmetinin çalışıp çalışmadığını kontrol edin.

### "Connection refused" hatası?
1. PostgreSQL hizmetinin çalışıp çalışmadığını kontrol edin
2. `.env` dosyasındaki DATABASE_URL'i kontrol edin
3. Şifrenin doğru olduğundan emin olun

### Migrasyon hatası?
```powershell
# Veritabanını sıfırla (tüm veriler silinir)
npx prisma migrate reset

# Tekrar migrate et
npx prisma migrate dev --name init
```

---

## Sonra Ne Yapmalı?

1. **Sembol Tanımını Oluştur** (/symbols)
   - En az bir sembol ekleyin (örn: GOLD, SILVER)

2. **İşlem Kayıt Et** (/transactions)
   - Alım (Buy) işlemlerini ekleyin
   - Satım (Sell) işlemlerini ekleyin

3. **Raporlar Kontrol Et** (/reports)
   - Gelecekte buraya grafikler ve istatistikler eklenecek

---

**Başarılı Kurulumları Dileriz!** 🎉
