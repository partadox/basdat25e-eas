# CE Exam System - Environment Configuration Guide

## 🔒 Security Guidelines

### File .env
File `.env` berisi konfigurasi sensitif dan **TIDAK BOLEH** di-commit ke repository.

### Template Files Available:
- `.env.example` - Template untuk development/production
- `.env.local.example` - Template khusus development lokal  
- `.env.production` - Template untuk production deployment

## 🛠️ Setup Instructions

### 1. Development Setup
```bash
# Copy template
cp .env.example .env

# Edit dengan database lokal
nano .env
```

### 2. Production Setup  
```bash
# Copy production template
cp .env.production .env

# Edit dengan konfigurasi production
nano .env
```

### 3. Required Environment Variables
```env
# Database (REQUIRED)
DB_HOST=your_database_host
DB_PORT=3306
DB_NAME=ce_exam_system
DB_USER=your_database_user
DB_PASS=your_secure_password

# Application
APP_ENV=production
APP_DEBUG=false
TZ=Asia/Jakarta
```

## 🚨 Security Reminders

- ✅ DO: Use `.env.example` as template
- ✅ DO: Keep real credentials in `.env` only
- ❌ DON'T: Commit `.env` to git
- ❌ DON'T: Share database credentials in code
- ❌ DON'T: Use default/weak passwords

## 🔄 Deployment Checklist

- [ ] Database credentials configured
- [ ] `.env` file created from template
- [ ] Strong passwords used
- [ ] `APP_DEBUG=false` in production
- [ ] Database connection tested
