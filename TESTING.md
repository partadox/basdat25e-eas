# CE Exam System - Testing Guide

## Manual Testing Checklist

### 🔐 Authentication Testing

#### ✅ Valid NRP Login
- [ ] Test dengan NRP: `5024221048`
- [ ] Verify confirmation dialog muncul
- [ ] Check redirect ke halaman ujian
- [ ] Verify student info terpampang

#### ❌ Invalid NRP Testing
- [ ] Test dengan NRP kosong
- [ ] Test dengan NRP < 10 digit: `123456789`
- [ ] Test dengan NRP > 10 digit: `12345678901`
- [ ] Test dengan NRP non-numeric: `abcd123456`
- [ ] Test dengan NRP tidak terdaftar: `9999999999`

#### 🚫 Security Testing
- [ ] Test akses ulang setelah submit
- [ ] Test multiple login attempt
- [ ] Test dengan NRP sudah submit

### ⏰ Timer Testing

#### ⏱️ Timer Functionality
- [ ] Verify timer start setelah login
- [ ] Check countdown accuracy (compare dengan waktu sistem)
- [ ] Test warning notification 15 menit sebelum habis
- [ ] Test warning notification 5 menit sebelum habis
- [ ] Test auto-submit saat waktu habis

#### 🕐 Time Validation
- [ ] Test login sebelum waktu ujian dimulai
- [ ] Test login saat ujian sedang berlangsung
- [ ] Test login setelah waktu ujian habis

### 💾 Data Persistence Testing

#### 🔄 Auto-Save
- [ ] Type jawaban dan wait 30 seconds
- [ ] Verify "Tersimpan otomatis" status
- [ ] Refresh browser dan check jawaban masih ada
- [ ] Test auto-save saat typing (2 seconds delay)

#### 📝 Manual Save
- [ ] Type jawaban dan manually submit
- [ ] Check confirmation dialog
- [ ] Verify redirect ke success page
- [ ] Check database record

#### 🔁 Session Recovery
- [ ] Login dan type jawaban
- [ ] Refresh browser
- [ ] Verify auto-login dan jawaban restored
- [ ] Check timer continues correctly

### 📱 Responsive Design Testing

#### 💻 Desktop Testing
- [ ] Test di Chrome, Firefox, Safari
- [ ] Verify layout pada resolusi 1920x1080
- [ ] Check all buttons accessible
- [ ] Test keyboard navigation

#### 📱 Mobile Testing
- [ ] Test di mobile devices (iPhone, Android)
- [ ] Check touch interface
- [ ] Verify text readability
- [ ] Test landscape/portrait orientation

#### 📟 Tablet Testing
- [ ] Test di iPad/Android tablet
- [ ] Check intermediate layout
- [ ] Verify touch targets adequate size

### 🛡️ Security Testing

#### 🚫 Disabled Functions
- [ ] Test right-click context menu (should be disabled)
- [ ] Test F12 developer tools (should be disabled)
- [ ] Test Ctrl+Shift+I (should be disabled)
- [ ] Test Ctrl+U view source (should be disabled)
- [ ] Test copy/paste shortcuts (should be disabled)

#### 🔒 SEB Compatibility
- [ ] Test dalam Safe Exam Browser
- [ ] Verify no external navigation possible
- [ ] Check security headers
- [ ] Test kiosk mode compatibility

### 🌐 API Testing

#### 📡 Endpoint Testing
Test all API endpoints dengan tools seperti Postman:

##### Login Endpoint
```
POST /api/exam.php?action=login
Content-Type: application/json

{
  "nrp": "5024221048"
}
```

##### Save Answer Endpoint
```
POST /api/exam.php?action=save_answer
Content-Type: application/json

{
  "nrp": "5024221048",
  "answer": "Test answer content"
}
```

##### Submit Exam Endpoint
```
POST /api/exam.php?action=submit_exam
Content-Type: application/json

{
  "nrp": "5024221048",
  "answer": "Final answer content"
}
```

##### Check Session Endpoint
```
GET /api/exam.php?action=check_session&nrp=5024221048
```

### 🔍 Error Handling Testing

#### 💥 Network Errors
- [ ] Test dengan internet connection interrupted
- [ ] Test dengan slow network
- [ ] Verify graceful error messages
- [ ] Check retry mechanisms

#### 🗄️ Database Errors
- [ ] Test dengan database connection failed
- [ ] Test dengan database timeout
- [ ] Verify error logging
- [ ] Check fallback mechanisms

#### 🖥️ Server Errors
- [ ] Test dengan server overload
- [ ] Test dengan PHP errors
- [ ] Check error page display
- [ ] Verify user-friendly messages

### ⚡ Performance Testing

#### 🚀 Load Testing
- [ ] Test dengan 10 concurrent users
- [ ] Test dengan 50 concurrent users
- [ ] Test dengan 100 concurrent users
- [ ] Monitor server response times
- [ ] Check database performance
- [ ] Verify auto-save tidak conflict

#### 📊 Monitoring
- [ ] Check server CPU usage
- [ ] Monitor memory consumption
- [ ] Track database query performance
- [ ] Verify log file sizes

### 📋 Content Testing

#### 📄 Exam Content
- [ ] Verify all soal terpampang dengan benar
- [ ] Check ERD image loads properly
- [ ] Verify logo images display correctly
- [ ] Check text formatting (bold, italic, code)
- [ ] Test long content scrolling

#### 🎨 UI/UX Testing
- [ ] Check color scheme consistency
- [ ] Verify font readability
- [ ] Test button hover effects
- [ ] Check loading animations
- [ ] Verify success/error message styling

## Automated Testing Scripts

### Database Connection Test
```bash
#!/bin/bash
mysql -h localhost -u root -p -e "SELECT 1 FROM peserta LIMIT 1;" ce_exam_system
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
fi
```

### API Health Check
```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/exam.php?action=exam_data)
if [ $response -eq 200 ]; then
    echo "✅ API endpoint healthy"
else
    echo "❌ API endpoint failed (HTTP $response)"
fi
```

### Docker Container Health Check
```bash
#!/bin/bash
status=$(docker inspect --format='{{.State.Health.Status}}' ce-exam-system)
if [ "$status" = "healthy" ]; then
    echo "✅ Container healthy"
else
    echo "❌ Container unhealthy: $status"
fi
```

## Test Data

### Sample Test Users
```sql
-- Additional test users
INSERT INTO peserta (kelas, nrp, name) VALUES 
('BASDAT-25E', '5024221001', 'Test User 1'),
('BASDAT-25E', '5024221002', 'Test User 2'),
('BASDAT-25E', '5024221003', 'Test User 3'),
('BASDAT-25E', '5024221004', 'Test User 4'),
('BASDAT-25E', '5024221005', 'Test User 5');
```

### Sample Answers for Testing
```
1. CPMK-4 (25%)
a. Memisahkan data ke dalam tabel Artis, Album, dan Lagu adalah praktik normalisasi yang baik karena:
- Menghindari redundansi data
- Memastikan integritas referensial
- Memudahkan maintenance data
- Mengikuti prinsip Third Normal Form (3NF)

b. CREATE INDEX idx_artis_nama ON Artis(nama_artis);
   CREATE INDEX idx_album_artis ON Album(id_artis);
   CREATE INDEX idx_lagu_album ON Lagu(id_album);

2. CPMK-5 (25%)
CREATE TABLE Konser (
    id_konser INT AUTO_INCREMENT PRIMARY KEY,
    nama_konser VARCHAR(255) NOT NULL,
    tanggal_acara DATE NOT NULL
);

CREATE TABLE StokTiket (
    id_stok INT AUTO_INCREMENT PRIMARY KEY,
    id_konser INT NOT NULL,
    kategori_tiket VARCHAR(50) NOT NULL,
    harga DECIMAL(10,2) NOT NULL,
    stok_tersedia INT NOT NULL,
    FOREIGN KEY (id_konser) REFERENCES Konser(id_konser)
);

CREATE TABLE PembelianTiket (
    id_pembelian INT AUTO_INCREMENT PRIMARY KEY,
    id_pengguna INT NOT NULL,
    id_stok INT NOT NULL,
    jumlah INT DEFAULT 1,
    total_bayar DECIMAL(10,2) NOT NULL,
    waktu_pembelian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_stok) REFERENCES StokTiket(id_stok)
);
```

## Testing Environment Setup

### Local Testing
1. Start system: `docker-compose up -d`
2. Access: `http://localhost`
3. phpMyAdmin: `http://localhost:8080`

### Production Testing
1. Deploy to staging environment
2. Test with production-like data
3. Performance testing dengan load
4. Security scanning

## Bug Reporting Template

```markdown
## Bug Report

**Environment:** Production/Staging/Development
**Browser:** Chrome 91.0.4472.124
**Device:** Desktop/Mobile/Tablet
**User Agent:** [Browser user agent]

**Steps to Reproduce:**
1. Login dengan NRP 5024221048
2. Type answer dalam textarea
3. Wait for auto-save
4. Refresh browser

**Expected Result:**
Answer should be restored after refresh

**Actual Result:**
Answer field is empty after refresh

**Error Messages:**
Console shows: "Session check error: 404 Not Found"

**Screenshots:**
[Attach screenshots if applicable]

**Additional Information:**
- Network tab shows failed API calls
- localStorage contains exam_nrp key
- Database shows start_time but no answer saved
```

## Performance Benchmarks

### Target Performance Metrics
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Auto-save Time**: < 1 second
- **Timer Accuracy**: ±1 second per hour
- **Concurrent Users**: 100+ without degradation

### Monitoring Tools
- **Application Performance**: New Relic, Datadog
- **Database Performance**: MySQL Workbench, phpMyAdmin
- **Server Monitoring**: htop, iostat, netstat
- **Log Analysis**: tail, grep, awk

---

*Update testing checklist ini seiring dengan development sistem.*
