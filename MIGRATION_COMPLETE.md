# Migration từ SQLite sang PostgreSQL - Hoàn tất ✅

## Tóm tắt các thay đổi

### Files đã chỉnh sửa:

1. **database.js** - Chuyển đổi hoàn toàn sang PostgreSQL
   - Thay thế `sqlite3` → `pg` (node-postgres)
   - Sử dụng Connection Pool thay vì single database instance
   - Tất cả functions giờ là `async/await`
   - Query placeholders: `?` → `$1, $2, ...`
   - SQL syntax đã cập nhật cho PostgreSQL

2. **package.json** - Cập nhật dependencies
   - Thêm: `pg@^8.11.3`
   - Xóa: `sqlite3@^5.1.7`
   - Xóa build script không còn cần thiết

3. **Files mới tạo:**
   - `POSTGRESQL_SETUP.md` - Hướng dẫn chi tiết cài đặt
   - `.env.example` - Template cho cấu hình database

### Các thay đổi kỹ thuật quan trọng:

#### 1. Connection Management
```javascript
// CŨ (SQLite):
const db = new sqlite3.Database(dbPath);

// MỚI (PostgreSQL):
const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'water_monitoring',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
});
```

#### 2. Query Execution
```javascript
// CŨ (SQLite):
db.run(sql, [param1, param2], (err) => { ... });

// MỚI (PostgreSQL):
await pool.query(sql, [param1, param2]);
```

#### 3. Data Types
```sql
-- CŨ (SQLite):
id INTEGER PRIMARY KEY AUTOINCREMENT
value REAL
timestamp DATETIME

-- MỚI (PostgreSQL):
id SERIAL PRIMARY KEY
value DOUBLE PRECISION
timestamp TIMESTAMP
```

#### 4. Date/Time Functions
```sql
-- CŨ (SQLite):
WHERE timestamp >= datetime('now', '-2 hours')

-- MỚI (PostgreSQL):
WHERE timestamp >= NOW() - INTERVAL '2 hours'
```

#### 5. DISTINCT ON (PostgreSQL feature)
```sql
-- MỚI - Lấy record mới nhất cho mỗi station+parameter:
SELECT DISTINCT ON (station_name, parameter_name)
    *
FROM tva_data
WHERE timestamp >= NOW() - INTERVAL '2 hours'
ORDER BY station_name, parameter_name, timestamp DESC
```

## Các bước triển khai:

### 1. Cài đặt PostgreSQL
```bash
# Download và cài đặt từ:
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql
```

### 2. Tạo Database
```bash
psql -U postgres
CREATE DATABASE water_monitoring;
\q
```

### 3. Cài đặt dependencies
```bash
npm install pg
npm uninstall sqlite3
```

### 4. Cấu hình environment
```bash
# Tạo file .env từ template
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
```

### 5. Chạy ứng dụng
```bash
npm start
```

## Tương thích ngược

✅ **Tất cả các files khác KHÔNG CẦN THAY ĐỔI**

Các files sau vẫn hoạt động bình thường:
- `server.js` - Đã sử dụng async/await
- `check-station-types.js` - Đã sử dụng async/await
- `check-scada-status.js` - Đã sử dụng async/await
- `save-scada-to-db.js` - Đã sử dụng async/await

## Lợi ích của PostgreSQL

1. **Hiệu năng cao hơn** với concurrent writes
2. **Scalability tốt hơn** cho dữ liệu lớn
3. **Advanced features**: JSONB, Full-text search, Geospatial
4. **Better transaction support**
5. **Robust backup/restore tools**
6. **Industry standard** cho production systems

## Kiểm tra hoạt động

```bash
# Kết nối database
psql -U postgres -d water_monitoring

# Kiểm tra bảng
\dt

# Xem dữ liệu
SELECT COUNT(*) FROM stations;
SELECT COUNT(*) FROM tva_data;
SELECT COUNT(*) FROM mqtt_data;
SELECT COUNT(*) FROM scada_data;
```

## Troubleshooting

### Lỗi kết nối:
```
Error: password authentication failed for user "postgres"
```
**Giải pháp:** Kiểm tra lại password trong file `.env`

### Lỗi database không tồn tại:
```
Error: database "water_monitoring" does not exist
```
**Giải pháp:** Tạo database trước: `CREATE DATABASE water_monitoring;`

### Lỗi module không tìm thấy:
```
Error: Cannot find module 'pg'
```
**Giải pháp:** Chạy `npm install`

## Support

Xem thêm tài liệu chi tiết trong [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)
