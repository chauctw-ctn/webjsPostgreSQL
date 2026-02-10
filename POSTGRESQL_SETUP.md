# Hướng dẫn chuyển sang PostgreSQL

## 1. Cài đặt PostgreSQL

### Windows:
1. Tải PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Cài đặt và nhớ mật khẩu của user `postgres`
3. PostgreSQL sẽ chạy tự động trên port 5432

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Mac (Homebrew)
brew install postgresql
```

## 2. Tạo Database

```bash
# Đăng nhập PostgreSQL
psql -U postgres

# Tạo database mới
CREATE DATABASE water_monitoring;

# Thoát
\q
```

## 3. Cài đặt Node.js Package

```bash
# Cài đặt pg (PostgreSQL client cho Node.js)
npm install pg

# Gỡ bỏ sqlite3 (không cần nữa)
npm uninstall sqlite3
```

## 4. Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc project:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=water_monitoring
PGUSER=postgres
PGPASSWORD=your_password_here
```

Hoặc export trực tiếp trong terminal:

### Windows (PowerShell):
```powershell
$env:PGHOST="localhost"
$env:PGPORT="5432"
$env:PGDATABASE="water_monitoring"
$env:PGUSER="postgres"
$env:PGPASSWORD="your_password"
```

### Linux/Mac:
```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=water_monitoring
export PGUSER=postgres
export PGPASSWORD=your_password
```

## 5. So sánh SQLite vs PostgreSQL

| Tính năng | SQLite | PostgreSQL |
|-----------|--------|------------|
| Loại | File-based | Client-Server |
| Concurrent writes | Hạn chế | Tốt |
| Scalability | Nhỏ | Lớn |
| Data types | Hạn chế | Phong phú |
| Transactions | Basic | Advanced |
| Performance | Tốt cho nhỏ | Tốt cho lớn |

## 6. Khởi động ứng dụng

```bash
# Chạy server
node server.js
```

Database sẽ tự động tạo các bảng khi lần đầu chạy.

## 7. Kiểm tra kết nối

```bash
# Kết nối vào database
psql -U postgres -d water_monitoring

# Xem danh sách bảng
\dt

# Xem dữ liệu
SELECT * FROM stations LIMIT 5;
SELECT COUNT(*) FROM tva_data;
SELECT COUNT(*) FROM mqtt_data;
SELECT COUNT(*) FROM scada_data;
```

## 8. Backup & Restore

### Backup:
```bash
pg_dump -U postgres water_monitoring > backup.sql
```

### Restore:
```bash
psql -U postgres water_monitoring < backup.sql
```

## 9. Tips & Troubleshooting

### Lỗi: "password authentication failed"
- Kiểm tra lại password trong `.env`
- Reset password: `ALTER USER postgres WITH PASSWORD 'new_password';`

### Lỗi: "could not connect to server"
- Kiểm tra PostgreSQL service đang chạy:
  - Windows: Services → postgresql-x64-xx
  - Linux: `sudo systemctl status postgresql`

### Lỗi: "database does not exist"
- Tạo database: `CREATE DATABASE water_monitoring;`

### Performance tuning:
```sql
-- Tăng connection pool size trong database.js nếu cần
-- Tạo thêm indexes cho queries hay dùng
CREATE INDEX idx_custom ON table_name(column_name);
```

## 10. Migration từ SQLite (nếu có data cũ)

Nếu bạn có data trong SQLite và muốn chuyển sang PostgreSQL:

```bash
# Export từ SQLite
sqlite3 water_monitoring.db .dump > sqlite_dump.sql

# Chỉnh sửa file (thay đổi syntax SQLite → PostgreSQL)
# Sau đó import vào PostgreSQL
psql -U postgres -d water_monitoring -f sqlite_dump.sql
```

Hoặc viết script Node.js để đọc từ SQLite và ghi vào PostgreSQL.
