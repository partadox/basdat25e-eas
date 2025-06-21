# CE Exam System

Sistem ujian online untuk Departemen Teknik Komputer, Fakultas Teknologi Elektro dan Informatika Cerdas - ITS.

## 📋 Deskripsi

Sistem ujian online yang dirancang khusus untuk lingkungan aman dengan dukungan Safe Exam Browser (SEB). Sistem ini mengelola ujian dengan timer otomatis, auto-save, dan berbagai fitur keamanan untuk mencegah kecurangan.

## 🏗️ Teknologi Stack

- **Backend**: PHP 8.2 Native
- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Database**: MySQL 8.0+
- **Containerization**: Docker
- **Web Server**: Apache 2.4

## ✨ Fitur Utama

### 🔐 Keamanan
- **One-time attempt**: Setiap peserta hanya bisa mengikuti ujian sekali
- **SQL Injection Protection**: Menggunakan prepared statements
- **XSS Protection**: Input sanitization dan output encoding
- **SEB Compatibility**: Optimasi untuk Safe Exam Browser
- **Session Management**: Secure session handling dengan localStorage
- **Anti-cheating**: Disable developer tools, right-click, keyboard shortcuts

### ⏰ Manajemen Waktu
- **Real-time Timer**: Countdown timer dengan peringatan
- **Auto Submit**: Otomatis submit saat waktu habis
- **Time Validation**: Validasi waktu mulai ujian
- **Timezone Support**: Menggunakan timezone Asia/Jakarta

### 💾 Penyimpanan Data
- **Auto Save**: Jawaban tersimpan otomatis setiap 30 detik
- **Manual Save**: Save otomatis saat user mengetik
- **Session Recovery**: Recovery session jika refresh browser
- **Data Integrity**: Transaksi database yang aman

### 🎨 User Experience
- **Responsive Design**: Tampilan optimal di berbagai device
- **User-friendly Interface**: Interface yang mudah dipahami
- **Real-time Feedback**: Status penyimpanan dan timer
- **Accessibility**: Support untuk pembaca layar dan keyboard navigation

## 📁 Struktur Proyek

```
exam_system/
├── api/
│   └── exam.php                 # API endpoint untuk semua operasi
├── assets/
│   ├── css/
│   │   └── style.css           # Styling utama
│   ├── js/
│   │   └── app.js              # JavaScript aplikasi
│   └── images/
│       ├── Logo ITS.png        # Logo Institut Teknologi Sepuluh Nopember
│       ├── Logo CE.png         # Logo Departemen Teknik Komputer
│       └── erd.png             # Entity Relationship Diagram
├── config/
│   └── Database.php            # Konfigurasi database dan utility
├── index.html                  # Halaman utama aplikasi
├── database.sql                # Schema database dan data awal
├── Dockerfile                  # Konfigurasi Docker container
├── apache.conf                 # Konfigurasi Apache web server
├── .env.example               # Template environment variables
└── README.md                  # Dokumentasi ini
```

## 🗄️ Schema Database

### Tabel `kelas`
Menyimpan informasi kelas ujian.

| Field | Type | Description |
|-------|------|-------------|
| name | VARCHAR(50) PK | Nama kelas (contoh: BASDAT-25E) |
| year | INT | Tahun ajaran |
| semester | ENUM | GASAL atau GENAP |
| teacher | VARCHAR(100) | Nama dosen pengampu |
| datetime_open | DATETIME | Waktu buka ujian |
| duration | INT | Durasi ujian dalam menit |

### Tabel `peserta`
Menyimpan data peserta ujian.

| Field | Type | Description |
|-------|------|-------------|
| id | INT AI PK | ID unik peserta |
| kelas | VARCHAR(50) FK | Referensi ke tabel kelas |
| nrp | VARCHAR(20) | Nomor Registrasi Pokok |
| name | VARCHAR(100) | Nama lengkap peserta |
| answer | LONGTEXT | Jawaban ujian |
| start_time | DATETIME | Waktu mulai ujian |
| submit_time | DATETIME | Waktu submit ujian |
| is_submitted | BOOLEAN | Status submit |
| ip_address | VARCHAR(45) | IP address peserta |

### Tabel `log`
Menyimpan log aktivitas peserta.

| Field | Type | Description |
|-------|------|-------------|
| id | INT AI PK | ID unik log |
| nrp | VARCHAR(20) | NRP peserta |
| ip | VARCHAR(45) | IP address |
| dt_access | TIMESTAMP | Waktu akses |
| action | VARCHAR(50) | Jenis aksi |
| user_agent | TEXT | Browser user agent |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- MariaDB/MySQL Server
- Database `ce_exam_system` sudah dibuat dan memiliki data

### Setup Database
```sql
-- 1. Buat database
CREATE DATABASE ce_exam_system;
USE ce_exam_system;

-- 2. Import schema
-- Jalankan isi file database.sql

-- 3. Verifikasi data
SELECT * FROM kelas;
SELECT * FROM peserta;
```

### Setup Aplikasi
```bash
# 1. Clone repository
git clone <repository-url>
cd exam_system

# 2. Setup environment
cp .env.example .env

# 3. Edit .env dengan konfigurasi database Anda
nano .env
# Update DB_HOST, DB_USER, DB_PASS dengan nilai yang sesuai

# 4. Build dan jalankan
docker-compose up -d

# 5. Akses aplikasi
# URL: http://localhost:8080
# Test NRP: 5024221048
```

### Konfigurasi Database
Update file `.env` dengan konfigurasi database Anda:
```env
DB_HOST=your_database_host
DB_PORT=3306
DB_NAME=ce_exam_system
DB_USER=your_username
DB_PASS=your_password
```

⚠️ **PENTING**: Jangan pernah commit file `.env` ke repository. File ini berisi kredensial database yang sensitif.

### 1. Setup Database
```sql
-- Jalankan script database.sql di MySQL server
mysql -u root -p < database.sql
```

### 2. Konfigurasi Environment
```bash
# Copy file environment
cp .env.example .env

# Edit konfigurasi sesuai kebutuhan
nano .env
```

### 3. Docker Deployment

#### Build dan Run dengan Docker Compose (Recommended)
```bash
# Clone atau download project
git clone <repository-url>
cd exam_system

# Setup environment
cp .env.example .env

# Build dan start semua services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f exam-system
```

#### Build Image Manual
```bash
docker build -t ce-exam-system .
```

#### Run Container Manual (untuk external database)
```bash
docker run -d \
  --name ce-exam-system \
  -p 80:80 \
  -e DB_HOST=your_mysql_host \
  -e DB_NAME=ce_exam_system \
  -e DB_USER=your_mysql_user \
  -e DB_PASS=your_mysql_password \
  -e APP_ENV=production \
  -e TZ=Asia/Jakarta \
  ce-exam-system
```

### Production Deployment

Untuk deployment production dengan monitoring dan security yang enhanced:

```bash
# 1. Setup production environment
cp .env.production .env
# Edit .env dengan konfigurasi production yang sesuai

# 2. Deploy dengan production compose
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify deployment
./health-check.sh --detailed

# 4. Setup SSL certificates (if not using Coolify)
# Copy SSL certificates to ssl_certs volume

# 5. Configure monitoring
# Access Grafana: http://localhost:3000
# Access Prometheus: http://localhost:9090
```

### Environment-specific Commands

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# Staging (using production config with different env)
cp .env.production .env.staging
# Edit staging-specific values
docker-compose -f docker-compose.prod.yml --env-file .env.staging up -d
### 4. Coolify Deployment
Untuk deployment di Coolify:

1. **Create New Project**
   - Pilih "Docker Compose" sebagai deployment method
   - Upload repository atau paste docker-compose.yml

2. **Environment Variables**
   ```env
   DB_HOST=mysql
   DB_NAME=ce_exam_system
   DB_USER=exam_user
   DB_PASS=your_secure_password
   APP_ENV=production
   APP_DEBUG=false
   TZ=Asia/Jakarta
   ```

3. **Domain Configuration**
   - Set domain yang akan digunakan (contoh: exam.yourdomain.com)
   - Enable SSL certificate (Let's Encrypt)
   - Set redirect HTTP to HTTPS

4. **Deployment**
   - Click "Deploy" untuk memulai deployment
   - Monitor logs untuk memastikan deployment berhasil
   - Test akses ke domain yang telah dikonfigurasi

5. **Post-Deployment**
   - Verify database connection
   - Test login dengan sample NRP
   - Check auto-save functionality
   - Monitor container health

### 5. Monitoring & Health Checks

Sistem dilengkapi dengan script monitoring komprehensif:

```bash
# Run health check sekali
./health-check.sh

# Continuous monitoring
./health-check.sh --continuous

# Quick container check
./health-check.sh --quick

# Show container status
./health-check.sh --status

# View recent logs
./health-check.sh --logs
```

#### Production Monitoring Stack
Pada deployment production tersedia:
- **Prometheus**: Metrics collection (http://localhost:9090)
- **Grafana**: Dashboard monitoring (http://localhost:3000)
- **Health Check Script**: Automated system monitoring
- **Log Aggregation**: Centralized logging

## 🛠️ Scripts dan Tools

### Setup Script
Script otomatis untuk setup sistem:
```bash
chmod +x setup.sh
./setup.sh
```

Fitur setup script:
- ✅ Validasi Docker dan Docker Compose
- ⚙️ Setup environment file
- 🏗️ Build Docker image
- 🗄️ Konfigurasi database (Docker Compose atau external)
- 🚀 Deploy dan start services
- ✅ Verifikasi deployment

### Health Check Script
Monitoring komprehensif sistem:
```bash
# Make executable
chmod +x health-check.sh

# Different monitoring modes
./health-check.sh                    # Detailed health check
./health-check.sh --quick           # Quick container check
./health-check.sh --continuous      # Real-time monitoring
./health-check.sh --status          # Container status
./health-check.sh --logs            # Recent logs
```

Features health check:
- 🐳 Container status monitoring
- 🌐 Web service accessibility
- 🗄️ Database connectivity
- 🔌 API endpoint testing
- 💻 System resource usage
- 📊 Recent activity analysis
- 🚨 Issue detection dan alerting

### Available Commands

#### Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose build --no-cache
```

#### Production
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Scale application (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale exam-system=3

# Update production
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

#### Database Management
```bash
# Backup database
docker exec ce-exam-mysql mysqldump -u exam_user -pexam_password ce_exam_system > backup.sql

# Restore database
docker exec -i ce-exam-mysql mysql -u exam_user -pexam_password ce_exam_system < backup.sql

# Access MySQL shell
docker exec -it ce-exam-mysql mysql -u exam_user -pexam_password ce_exam_system
```

#### Maintenance
```bash
# View container resource usage
docker stats

# Clean up unused resources
docker system prune -f

# Update all containers
docker-compose pull && docker-compose up -d

# Reset everything (CAUTION: destroys data)
docker-compose down -v --remove-orphans
```

### Environment Variables (Database Lokal)
| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | host.docker.internal | MySQL host (untuk koneksi dari container ke host) |
| DB_NAME | ce_exam_system | Database name |
| DB_USER | root | MySQL username |
| DB_PASS | (empty) | MySQL password |
| APP_ENV | production | Application environment |
| TZ | Asia/Jakarta | Timezone |

**Catatan**: Gunakan `host.docker.internal` sebagai DB_HOST untuk koneksi dari container Docker ke database MySQL yang berjalan di host machine.

### SEB (Safe Exam Browser) Configuration
Sistem ini dioptimalkan untuk SEB dengan konfigurasi:
- Disable right-click context menu
- Disable developer tools (F12, Ctrl+Shift+I)
- Disable copy/paste shortcuts
- Disable browser refresh confirmation
- Security headers untuk mencegah iframe embedding

### Apache Security Headers
```apache
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy strict-origin-when-cross-origin
```

## 🔄 Flow Sistem

### 1. Proses Login
1. Peserta memasukkan NRP (10 digit)
2. Sistem validasi format NRP
3. Cek apakah peserta terdaftar di kelas
4. Cek apakah sudah pernah submit
5. Cek waktu ujian (belum/sudah dimulai)
6. Set start_time jika belum ada
7. Redirect ke halaman ujian

### 2. Proses Ujian
1. Load soal dan data peserta
2. Start timer countdown
3. Auto-save jawaban setiap 30 detik
4. Manual save saat user mengetik
5. Warning notification 15 menit & 5 menit sebelum habis
6. Auto-submit saat waktu habis

### 3. Proses Submit
1. Konfirmasi submit dari user
2. Update jawaban final ke database
3. Set is_submitted = TRUE
4. Set submit_time
5. Clear session
6. Redirect ke halaman sukses

### 4. Session Recovery
1. Cek localStorage untuk NRP tersimpan
2. Validasi session di server
3. Cek apakah waktu masih tersisa
4. Recovery jawaban yang tersimpan
5. Continue timer dari waktu tersisa

## 📊 API Endpoints

### POST /api/exam.php?action=login
Login peserta ke sistem ujian.

**Request:**
```json
{
  "nrp": "5024221048"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "nrp": "5024221048",
    "name": "Nama Peserta",
    "kelas": "BASDAT-25E",
    "teacher": "Arta Kusuma Hernanda, M.T",
    "start_time": "2025-06-25 07:30:00",
    "duration": 120,
    "answer": null
  }
}
```

### POST /api/exam.php?action=save_answer
Simpan jawaban sementara.

**Request:**
```json
{
  "nrp": "5024221048",
  "answer": "Jawaban lengkap peserta..."
}
```

### POST /api/exam.php?action=submit_exam
Submit jawaban final.

**Request:**
```json
{
  "nrp": "5024221048",
  "answer": "Jawaban final peserta..."
}
```

### GET /api/exam.php?action=check_session&nrp=5024221048
Cek session yang ada.

### GET /api/exam.php?action=exam_data
Get data ujian.

## 🛡️ Security Features

### Input Validation
- **NRP Format**: Harus 10 digit angka
- **SQL Injection**: Menggunakan prepared statements
- **XSS Prevention**: htmlspecialchars() untuk semua input
- **CSRF Protection**: Token validation untuk form submission

### Session Security
- **Secure Cookie**: HttpOnly dan Secure flags
- **Session Timeout**: Otomatis logout setelah waktu habis
- **IP Validation**: Cek IP address untuk setiap request
- **Browser Fingerprinting**: User agent validation

### Database Security
- **Prepared Statements**: Mencegah SQL injection
- **Transaction Management**: ACID compliance
- **Connection Encryption**: SSL/TLS untuk koneksi database
- **Access Control**: Role-based database access

### Client-side Security
- **Disable DevTools**: Mencegah inspect element
- **Disable Copy/Paste**: Mencegah copy jawaban
- **Disable Print**: Mencegah print halaman
- **Disable Select**: Mencegah select text (kecuali textarea)

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

### Mobile Optimizations
- Touch-friendly buttons (44px minimum)
- Readable font sizes (16px minimum)
- Optimized image sizes
- Swipe gestures disabled
- Zoom disabled untuk consistency

## 🔍 Monitoring & Logging

### Application Logs
- Login attempts (success/failed)
- Answer save operations
- Submit operations
- Session timeouts
- Security violations

### Database Logs
- All user actions logged in `log` table
- IP address tracking
- Timestamp untuk setiap aktivitas
- User agent information

### Error Handling
- Graceful error messages untuk user
- Detailed error logs untuk admin
- Automatic retry untuk network failures
- Fallback mechanisms untuk critical operations

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login dengan NRP valid
- [ ] Login dengan NRP invalid
- [ ] Login dengan NRP yang sudah submit
- [ ] Auto-save functionality
- [ ] Manual submit
- [ ] Auto-submit saat waktu habis
- [ ] Session recovery setelah refresh
- [ ] Timer accuracy
- [ ] Responsive design di berbagai device
- [ ] SEB compatibility

### Load Testing
Sistem dapat menangani:
- 100+ concurrent users
- Auto-save setiap 30 detik
- Database optimization dengan indexing
- Connection pooling untuk performance

## 🚨 Troubleshooting

### Container Issues

#### Service tidak start
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs exam-system
docker-compose logs mysql

# Restart services
docker-compose restart
```

#### Database connection failed
```bash
# Check MySQL is ready
docker-compose logs mysql | grep "ready for connections"

# Test database connection
docker exec ce-exam-mysql mysql -u exam_user -pexam_password -e "SELECT 1;"

# Reset database if needed
docker-compose down -v
docker-compose up -d
```

#### Port already in use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3306

# Kill process or change port in docker-compose.yml
# Example: change "80:80" to "8000:80"
```

### Application Issues

#### Session Not Found
```bash
# Clear browser data
# Open Developer Tools > Application > Storage > Clear Storage

# Or clear localStorage specifically
localStorage.clear();

# Restart container
docker-compose restart exam-system
```

#### Timer Not Working
```bash
# Check timezone in container
docker exec ce-exam-system date

# Should show Asia/Jakarta timezone
# If not, rebuild container:
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Auto-save Failed
```bash
# Check API endpoint
curl -X GET "http://localhost/api/exam.php?action=exam_data"

# Check network in browser
# F12 > Network tab > look for failed requests

# Check container logs
docker-compose logs -f exam-system
```

### Performance Issues

#### Slow Database
```bash
# Check MySQL performance
docker exec ce-exam-mysql mysqladmin -u root -prootpassword processlist

# Monitor MySQL logs
docker-compose logs -f mysql

# Increase MySQL resources in docker-compose.yml:
# --innodb_buffer_pool_size=512M
# --max_connections=300
```

#### High Memory Usage
```bash
# Check container resource usage
docker stats

# Increase memory limits if needed
# Add to docker-compose.yml under exam-system:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

### Development Issues

#### File Permission Errors
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .

# For WSL users
sudo mount -t drvfs C: /mnt/c -o metadata,uid=1000,gid=1000
```

#### Environment Variables Not Working
```bash
# Check .env file exists
ls -la .env

# Verify environment variables in container
docker exec ce-exam-system printenv | grep DB_

# Recreate .env from template
cp .env.example .env
# Edit .env file with correct values
```

### Production Issues

#### SSL Certificate Problems
```bash
# For Coolify deployment
# Check domain DNS settings
nslookup your-domain.com

# Verify SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check Coolify logs for certificate renewal
```

#### High Traffic Issues
```bash
# Scale containers (in production)
docker-compose up -d --scale exam-system=3

# Use load balancer (nginx)
# Add nginx service to docker-compose.yml
```

### Quick Fixes

#### Complete Reset
```bash
# Nuclear option - destroys all data
docker-compose down -v --remove-orphans
docker system prune -f
docker-compose up -d
```

#### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Backup Before Major Changes
```bash
# Backup database
docker exec ce-exam-mysql mysqldump -u root -prootpassword ce_exam_system > backup_$(date +%Y%m%d).sql

# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz .
```

## 📈 Performance Optimization

### Database Optimization
- Indexing pada kolom yang sering di-query
- Connection pooling
- Query optimization
- Regular maintenance

### Caching Strategy
- Browser caching untuk static assets
- Apache mod_expires untuk cache headers
- Gzip compression untuk text files

### Front-end Optimization
- Minified CSS dan JavaScript
- Optimized images
- Lazy loading untuk images
- Reduced HTTP requests

## 🔄 Update & Maintenance

### Regular Tasks
- Database backup harian
- Log rotation mingguan
- Security updates bulanan
- Performance monitoring

### Backup Strategy
```bash
# Database backup
mysqldump -u root -p ce_exam_system > backup_$(date +%Y%m%d).sql

# File backup
tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/html
```

### Update Process
1. Backup database dan files
2. Test update di staging environment
3. Maintenance mode enable
4. Deploy update
5. Verify functionality
6. Maintenance mode disable

## 📞 Support & Contact

### Development Team
- **Lead Developer**: [Your Name]
- **Database Admin**: [DBA Name]
- **System Admin**: [SysAdmin Name]

### Documentation
- API Documentation: `/docs/api.md`
- Database Schema: `/docs/schema.md`
- Deployment Guide: `/docs/deployment.md`

### Issue Reporting
Gunakan template berikut untuk melaporkan issue:
```
**Environment:** Production/Staging/Development
**Browser:** Chrome/Firefox/Safari + Version
**Device:** Desktop/Tablet/Mobile
**Steps to Reproduce:**
1. ...
2. ...
3. ...
**Expected Result:**
**Actual Result:**
**Error Messages:**
**Screenshots:** (if applicable)
```

## 📄 License

Sistem ini dikembangkan untuk Departemen Teknik Komputer ITS. 
Hak cipta dilindungi undang-undang.

---

*Dokumentasi ini akan terus diperbarui seiring dengan perkembangan sistem.*
