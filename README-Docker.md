# 🐳 Docker Deployment Guide

Bu rehber, OMT Turnuva Yönetim Sistemi'ni Docker ile nasıl çalıştıracağınızı açıklar.

## 📋 Gereksinimler

- Docker (v20.10+)
- Docker Compose (v2.0+)
- En az 2GB RAM
- En az 1GB disk alanı

## 🚀 Hızlı Başlangıç

### 1. Otomatik Kurulum (Önerilen)

```bash
# Kurulum scriptini çalıştır
./scripts/docker-setup.sh
```

### 2. Manuel Kurulum

```bash
# 1. Uploads klasörünü oluştur
mkdir -p public/uploads

# 2. Environment dosyasını kopyala
cp .env.docker .env.production

# 3. Production ortamını başlat
docker-compose up -d
```

## 🛠️ Kullanılabilir Komutlar

### Production Ortamı

```bash
# Başlat
docker-compose up -d

# Durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f

# Yeniden başlat
docker-compose restart

# Veritabanını sıfırla
docker-compose down -v
docker-compose up -d
```

### Development Ortamı

```bash
# Development ortamını başlat (hot reload ile)
docker-compose -f docker-compose.dev.yml up -d

# Development ortamını durdur
docker-compose -f docker-compose.dev.yml down
```

## 🔧 Konfigürasyon

### Environment Variables

`.env.production` dosyasını düzenleyerek aşağıdaki ayarları yapılandırabilirsiniz:

```env
# Veritabanı
DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/omt_tournament"

# Güvenlik
NEXTAUTH_SECRET="your-very-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# E-posta (opsiyonel)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Port Ayarları

- **Uygulama**: http://localhost:3000
- **Veritabanı**: localhost:5432
- **Development**: http://localhost:3001 (dev ortamında)

## 📁 Volume Yönetimi

### Kalıcı Veriler

- **Veritabanı**: `postgres_data` volume'unda saklanır
- **Yüklenen Dosyalar**: `./public/uploads` klasöründe saklanır

### Backup

```bash
# Veritabanı backup'ı
docker-compose exec postgres pg_dump -U postgres omt_tournament > backup.sql

# Backup'ı geri yükle
docker-compose exec -T postgres psql -U postgres omt_tournament < backup.sql
```

## 🔍 Troubleshooting

### Yaygın Sorunlar

1. **Port zaten kullanımda**
   ```bash
   # Çalışan servisleri kontrol et
   docker ps
   # Portu kullanan servisi durdur
   docker-compose down
   ```

2. **Veritabanı bağlantı hatası**
   ```bash
   # Container'ları yeniden başlat
   docker-compose restart
   # Logları kontrol et
   docker-compose logs postgres
   ```

3. **Disk alanı yetersiz**
   ```bash
   # Kullanılmayan image'ları temizle
   docker system prune -a
   ```

### Logları İnceleme

```bash
# Tüm servislerin logları
docker-compose logs -f

# Sadece uygulama logları
docker-compose logs -f app

# Sadece veritabanı logları
docker-compose logs -f postgres
```

## 🚀 Production Deployment

### 1. Güvenlik Ayarları

```bash
# Güçlü şifreler kullan
# .env.production dosyasında:
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
POSTGRES_PASSWORD="$(openssl rand -base64 32)"
```

### 2. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. SSL Sertifikası

```bash
# Let's Encrypt ile SSL
certbot --nginx -d yourdomain.com
```

## 📊 Monitoring

### Health Check

```bash
# Uygulama durumu
curl http://localhost:3000/api/health

# Container durumu
docker-compose ps
```

### Resource Usage

```bash
# CPU ve RAM kullanımı
docker stats

# Disk kullanımı
docker system df
```

## 🔄 Güncelleme

```bash
# 1. Yeni kodu çek
git pull origin main

# 2. Image'ı yeniden build et
docker-compose build --no-cache

# 3. Servisleri yeniden başlat
docker-compose up -d
```

## 📞 Destek

Sorun yaşıyorsanız:

1. Logları kontrol edin: `docker-compose logs -f`
2. Container durumunu kontrol edin: `docker-compose ps`
3. GitHub Issues'da sorun bildirin

---

**Not**: Production ortamında mutlaka güvenlik ayarlarını yapılandırın ve güçlü şifreler kullanın.