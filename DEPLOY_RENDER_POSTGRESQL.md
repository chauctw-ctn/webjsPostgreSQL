# Hướng dẫn Deploy lên Render với PostgreSQL

## Database Connection

**Database URL (Supabase):**
```
postgresql://postgres.llehbswibzhtsqgdulux:L4m0dTFog9nuHqq1@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
```

## Các bước Deploy

### 1. Chuẩn bị Code

✅ Đã hoàn tất:
- Database.js đã hỗ trợ `DATABASE_URL`
- render.yaml đã cấu hình đúng
- .gitignore đã loại trừ database files

### 2. Push code lên GitHub

```bash
# Khởi tạo git (nếu chưa có)
git init

# Add tất cả files
git add .

# Commit
git commit -m "Ready for Render deployment with PostgreSQL"

# Add remote repository (thay YOUR_REPO bằng repo của bạn)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

### 3. Deploy trên Render

#### Bước 3.1: Tạo Web Service
1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository của bạn
4. Cấu hình:
   - **Name:** `camau-water-monitoring`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

#### Bước 3.2: Thêm Environment Variables

Trong phần **Environment**, thêm các biến sau:

**DATABASE_URL** (REQUIRED):
```
postgresql://postgres.llehbswibzhtsqgdulux:L4m0dTFog9nuHqq1@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
```

**NODE_ENV**:
```
production
```

**PORT** (Render tự động set, nhưng có thể add thêm):
```
10000
```

#### Bước 3.3: Deploy
1. Click **"Create Web Service"**
2. Render sẽ tự động build và deploy
3. Đợi 3-5 phút để deployment hoàn tất

### 4. Kiểm tra Deployment

#### 4.1: Kiểm tra Logs
Trong Render Dashboard → Your Service → **Logs**

Bạn sẽ thấy:
```
✅ Đã kết nối tới PostgreSQL database
✅ Bảng tva_data đã sẵn sàng
✅ Bảng mqtt_data đã sẵn sàng
✅ Bảng scada_data đã sẵn sàng
✅ Bảng stations đã sẵn sàng
🚀 Server đang chạy tại port 10000
```

#### 4.2: Test Endpoints

Sau khi deploy xong, bạn sẽ có URL dạng:
```
https://camau-water-monitoring.onrender.com
```

Test các endpoints:
```bash
# Health check
curl https://camau-water-monitoring.onrender.com/api/stations

# Login (nếu có authentication)
curl -X POST https://camau-water-monitoring.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 5. Kiểm tra Database Connection

#### 5.1: Kết nối từ local để kiểm tra
```bash
# Cài psql client
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# Kết nối
psql "postgresql://postgres.llehbswibzhtsqgdulux:L4m0dTFog9nuHqq1@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"

# Kiểm tra tables
\dt

# Kiểm tra data
SELECT COUNT(*) FROM stations;
SELECT * FROM stations LIMIT 5;
```

#### 5.2: Migrate data (nếu có data cũ)
Nếu bạn có data từ SQLite cũ, cần migrate:

1. Export data từ SQLite (local)
2. Import vào PostgreSQL (Supabase)

Xem chi tiết trong phần **Migration** bên dưới.

## Cấu hình Auto-Deploy

### Bật Auto-Deploy từ GitHub
1. Trong Render Dashboard → Your Service → **Settings**
2. Tìm **"Auto-Deploy"**
3. Bật **"Yes"** cho branch `main`

Giờ mỗi khi push code lên GitHub, Render sẽ tự động deploy!

## Environment Variables - Chi tiết

| Variable | Value | Mô tả |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres...` | Connection string đầy đủ |
| `NODE_ENV` | `production` | Môi trường production |
| `PORT` | Auto-assigned | Render tự động gán |

## Troubleshooting

### Lỗi: "connection refused"
**Nguyên nhân:** Database URL không đúng hoặc Supabase blocked connections

**Giải pháp:**
1. Kiểm tra lại DATABASE_URL
2. Trong Supabase Dashboard → Settings → Database, kiểm tra connection pooler
3. Đảm bảo sử dụng **Pooler connection** (port 6543) không phải direct connection (port 5432)

### Lỗi: "SSL connection required"
**Nguyên nhân:** Supabase yêu cầu SSL

**Giải pháp:** Đã được fix trong database.js với `ssl: { rejectUnauthorized: false }`

### Lỗi: "too many connections"
**Nguyên nhân:** Free tier Supabase giới hạn connections

**Giải pháp:**
1. Giảm `max` trong connection pool (database.js, dòng 18)
2. Sử dụng **Transaction Pooler** mode trong Supabase

### App chạy nhưng không có data
**Nguyên nhân:** Database mới, chưa có data

**Giải pháp:**
1. App sẽ tự động crawl data sau khi khởi động
2. Đợi 5-10 phút để data được collect
3. Hoặc trigger manually qua API endpoints

## Migration Data từ SQLite

Nếu bạn có data cũ trong SQLite local:

### Option 1: Export/Import thủ công
```bash
# 1. Export từ SQLite (local)
sqlite3 water_monitoring.db .dump > data_backup.sql

# 2. Chỉnh sửa data_backup.sql
# - Thay đổi syntax SQLite → PostgreSQL
# - INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY
# - REAL → DOUBLE PRECISION
# - DATETIME → TIMESTAMP

# 3. Import vào PostgreSQL
psql "postgresql://postgres.llehbswibzhtsqgdulux:..." < data_backup.sql
```

### Option 2: Để app tự động thu thập
App sẽ tự động crawl data từ các nguồn:
- TVA data
- MQTT data  
- SCADA data

Chỉ cần đợi vài phút sau khi deploy.

## Monitoring & Maintenance

### 1. Xem Logs
Render Dashboard → Your Service → **Logs**

### 2. Database Management
Supabase Dashboard → Database → **Table Editor**

### 3. Backup Database
```bash
# Backup toàn bộ database
pg_dump "postgresql://postgres.llehbswibzhtsqgdulux:..." > backup_$(date +%Y%m%d).sql

# Backup chỉ schema
pg_dump --schema-only "postgresql://postgres..." > schema.sql

# Backup chỉ data
pg_dump --data-only "postgresql://postgres..." > data.sql
```

### 4. Clean Old Data
App tự động cleanup theo cấu hình `MAX_RECORDS` trong database.js:
- TVA: 100,000 records
- MQTT: 100,000 records  
- SCADA: 100,000 records

## Useful Links

- **Render Dashboard:** https://dashboard.render.com/
- **Supabase Dashboard:** https://supabase.com/dashboard
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Node pg:** https://node-postgres.com/

## Security Notes

⚠️ **QUAN TRỌNG:**

1. **KHÔNG commit DATABASE_URL** vào Git
2. **KHÔNG share DATABASE_URL** công khai
3. Thay đổi password trong credentials nếu bị lộ
4. Sử dụng Environment Variables trong Render
5. Enable IP restrictions trong Supabase nếu cần

## Next Steps

Sau khi deploy thành công:

1. ✅ Test tất cả API endpoints
2. ✅ Đợi data được collect tự động
3. ✅ Kiểm tra database có data chưa
4. ✅ Set up monitoring/alerting
5. ✅ Backup database định kỳ
6. ✅ Document API endpoints
7. ✅ Thêm logging/analytics nếu cần

## Support

Nếu gặp vấn đề, kiểm tra:
1. Render Logs
2. Supabase Dashboard → Database → Logs
3. GitHub Issues
