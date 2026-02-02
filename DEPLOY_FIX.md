# Hướng dẫn Deploy lên Render.com

## Lỗi SQLite3 "invalid ELF header"

### Nguyên nhân
SQLite3 là native module, cần được compile cho từng platform cụ thể. Module được compile trên Windows không chạy được trên Linux (Render).

### Giải pháp đã áp dụng

#### 1. ✅ Rebuild sqlite3 trên server
- Đã thêm `.npmrc` để force rebuild native modules
- Đã tạo `build.sh` script để rebuild sqlite3 trong quá trình deploy
- Đã cập nhật `package.json` với postinstall hook

#### 2. ✅ Cấu hình Render.yaml
- Build command: `bash build.sh`
- Health check path: `/api/stations`
- Persistent disk cho SQLite database
- Node version: 18.19.0 (LTS)

### Các bước deploy

1. **Commit và push code:**
```bash
git add .
git commit -m "Fix SQLite3 deployment for Render"
git push
```

2. **Trên Render Dashboard:**
   - Deploy sẽ tự động trigger
   - Kiểm tra logs để đảm bảo sqlite3 rebuild thành công
   - Chờ build hoàn tất (~2-3 phút)

3. **Verify deployment:**
   - Mở URL của app
   - Kiểm tra `/api/stations` endpoint
   - Xem logs: "✅ Đã kết nối tới SQLite database"

### Troubleshooting

#### Nếu vẫn gặp lỗi ELF header:

**Option A: Clear build cache**
```bash
# Trên Render Dashboard:
Settings → Clear build cache & deploy
```

**Option B: Manual rebuild**
Thêm vào render.yaml:
```yaml
buildCommand: |
  npm install
  npm rebuild --build-from-source sqlite3
  node -e "require('sqlite3')"
```

#### Nếu cần chuyển sang PostgreSQL (recommended cho production):

1. **Tạo PostgreSQL database trên Render:**
   - Dashboard → New → PostgreSQL
   - Copy connection string

2. **Cài đặt pg module:**
```bash
npm install pg
```

3. **Thay đổi database.js:**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

4. **Thêm DATABASE_URL vào render.yaml:**
```yaml
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: camau-water-db
      property: connectionString
```

### Files đã tạo/sửa đổi:

1. ✅ `.npmrc` - Config npm rebuild
2. ✅ `build.sh` - Build script cho Render
3. ✅ `render.yaml` - Config deployment
4. ✅ `package.json` - Thêm postinstall script
5. ✅ `database.js` - Error handling tốt hơn

### Kiểm tra deployment

```bash
# Check SQLite3 version
node -e "const sqlite3 = require('sqlite3'); console.log(sqlite3.VERSION);"

# Test database connection
node -e "const db = require('./database.js');"
```

### Logs cần xem

✅ **Build logs:**
```
🔨 Rebuilding sqlite3 for Linux...
✅ Verifying sqlite3...
SQLite3 version: X.X.X
✅ Build completed successfully!
```

✅ **Runtime logs:**
```
✅ Đã kết nối tới SQLite database
✅ Bảng tva_data đã sẵn sàng
✅ Bảng mqtt_data đã sẵn sàng
🚀 Server đang chạy tại: http://...
```

## Lưu ý

- SQLite3 version 5.1.7 đã được test trên Node 18.x
- Build time tăng ~30-60s do rebuild native module
- Database file được lưu persistent trên disk
- Backup database định kỳ bằng cách download file `.db`
