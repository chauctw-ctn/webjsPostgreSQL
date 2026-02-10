# Quick Start Guide - Deploy lên Render

## 🚀 Các bước nhanh

### 1️⃣ Test Connection với Database (LOCAL)

```bash
# Cài dependencies
npm install

# Test kết nối PostgreSQL
node test-postgres-connection.js
```

Nếu thành công, bạn sẽ thấy:
```
✅ Connection successful!
✅ Query successful!
✅ All tests passed!
🎉 Database is ready to use!
```

### 2️⃣ Chạy Local với Supabase Database

Tạo file `.env`:
```env
DATABASE_URL=postgresql://postgres.llehbswibzhtsqgdulux:L4m0dTFog9nuHqq1@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
NODE_ENV=development
```

Chạy server:
```bash
npm start
```

Truy cập: http://localhost:3000

### 3️⃣ Deploy lên Render

#### A. Push code lên GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### B. Tạo Web Service trên Render
1. Vào https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Connect GitHub repo
4. Cấu hình:
   - **Name:** `camau-water-monitoring`
   - **Runtime:** `Node`
   - **Build:** `npm install`
   - **Start:** `node server.js`

#### C. Thêm Environment Variables
Trong phần **Environment**, thêm:

```
DATABASE_URL = postgresql://postgres.llehbswibzhtsqgdulux:L4m0dTFog9nuHqq1@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres

NODE_ENV = production
```

#### D. Deploy!
Click **Create Web Service** và đợi 3-5 phút.

### 4️⃣ Kiểm tra Deployment

Sau khi deploy xong, bạn sẽ có URL:
```
https://camau-water-monitoring.onrender.com
```

Test endpoints:
```bash
# Health check
curl https://camau-water-monitoring.onrender.com/api/stations

# Get stations data
curl https://camau-water-monitoring.onrender.com/api/map-data
```

## 📋 Checklist

- [ ] Test connection local: `node test-postgres-connection.js`
- [ ] Chạy server local thành công
- [ ] Code đã push lên GitHub
- [ ] Web Service đã tạo trên Render
- [ ] DATABASE_URL đã set trong Render Environment
- [ ] Deploy thành công (check Logs)
- [ ] Test URL production
- [ ] Database có data (có thể đợi 5-10 phút để app crawl data)

## 🔧 Troubleshooting

### Lỗi: "Cannot find module 'pg'"
```bash
npm install
```

### Server không khởi động được
Check logs trong Render Dashboard → Logs

### Không connect được database
Kiểm tra DATABASE_URL trong Environment Variables

### App chạy nhưng không có data
Đợi 5-10 phút để app tự động crawl data từ nguồn

## 📚 Tài liệu chi tiết

- [DEPLOY_RENDER_POSTGRESQL.md](DEPLOY_RENDER_POSTGRESQL.md) - Hướng dẫn đầy đủ
- [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md) - Setup PostgreSQL local
- [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md) - Chi tiết migration

## 🆘 Cần giúp đỡ?

1. Kiểm tra Render Logs
2. Kiểm tra Supabase Dashboard
3. Test connection local trước
4. Đọc error messages cẩn thận

## ✅ Hoàn tất!

Bây giờ app của bạn đã chạy trên Render với PostgreSQL từ Supabase! 🎉
