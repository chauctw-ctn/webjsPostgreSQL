# 🚀 Hướng Dẫn Deploy Lên Render.com

## ✅ Đã Chuẩn Bị
- ✓ Cập nhật `package.json` với Node.js version
- ✓ Cập nhật `server.js` để sử dụng PORT từ environment
- ✓ Tạo file `.gitignore`
- ✓ Tạo file `render.yaml` cho cấu hình tự động

## 📝 Các Bước Deploy

### Bước 1: Push Code Lên GitHub

```powershell
# 1. Khởi tạo Git repository (nếu chưa có)
git init

# 2. Add tất cả files
git add .

# 3. Commit
git commit -m "Deploy to Render - Initial commit"

# 4. Tạo repository mới trên GitHub
# Truy cập: https://github.com/new
# Đặt tên: camau-water-monitoring
# Không cần chọn README, .gitignore (đã có)

# 5. Link và push lên GitHub (thay YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/camau-water-monitoring.git
git branch -M main
git push -u origin main
```

### Bước 2: Deploy Trên Render.com

1. **Đăng nhập Render**
   - Truy cập: https://dashboard.render.com/
   - Đăng nhập bằng GitHub

2. **Kết nối GitHub**
   - Click **"Connect GitHub"** nếu chưa kết nối
   - Cho phép Render truy cập repositories

3. **Tạo Web Service**
   - Click **"New +"** → **"Web Service"**
   - Chọn repository: `camau-water-monitoring`

4. **Cấu hình Service**
   - **Name**: `camau-water-monitoring` (hoặc tên bạn muốn)
   - **Region**: `Singapore` (gần Việt Nam nhất)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm rebuild sqlite3`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. **Environment Variables** (Optional)
   - Click **"Advanced"**
   - Có thể thêm:
     ```
     NODE_ENV=production
     ```

6. **Deploy**
   - Click **"Create Web Service"**
   - Đợi ~2-5 phút để build và deploy

### Bước 3: Kiểm Tra Deployment

Sau khi deploy thành công:

1. **URL của bạn**: `https://camau-water-monitoring.onrender.com`
2. **Kiểm tra logs**: Click vào service → Tab "Logs"
3. **Test endpoints**:
   - Trang chủ: `https://your-app.onrender.com/`
   - API: `https://your-app.onrender.com/api/stations`
   - Stats: `https://your-app.onrender.com/stats.html`

## ⚠️ Lưu Ý Quan Trọng

### 1. Database SQLite
- **Vấn đề**: Render Free Plan có ephemeral filesystem (dữ liệu mất khi restart)
- **Giải pháp**:
  - Option A: Nâng cấp lên Starter Plan ($7/tháng) có persistent disk
  - Option B: Chuyển sang PostgreSQL (Render cung cấp free PostgreSQL 90 ngày)
  - Option C: Dùng external DB như [Turso](https://turso.tech/) (SQLite-as-a-Service, free 9GB)

### 2. Auto Sleep (Free Plan)
- App sẽ sleep sau **15 phút không hoạt động**
- Khi có request mới, app sẽ wake up (~30 giây cold start)
- **Giải pháp**: Nâng cấp lên Starter Plan để không sleep

### 3. MQTT Connection
- Đảm bảo MQTT broker cho phép kết nối từ IP của Render
- Nếu MQTT broker yêu cầu authentication, thêm vào Environment Variables:
  ```
  MQTT_HOST=your-broker.com
  MQTT_PORT=1883
  MQTT_USERNAME=username
  MQTT_PASSWORD=password
  ```

## 🔄 Cập Nhật Ứng Dụng

Sau khi đã deploy, mỗi khi bạn push code mới lên GitHub:

```powershell
git add .
git commit -m "Update: mô tả thay đổi"
git push
```

Render sẽ tự động build và deploy lại ứng dụng.

## 📊 Giám Sát

- **Logs**: Xem trong Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics (CPU, Memory, Requests)
- **Health Check**: Render tự động ping `/` để kiểm tra app còn hoạt động

## 💰 Chi Phí

### Free Plan
- ✅ 750 giờ/tháng miễn phí
- ✅ SSL/TLS tự động
- ✅ Deploy tự động từ GitHub
- ⚠️ App sleep sau 15 phút không dùng
- ⚠️ Không persistent disk

### Starter Plan ($7/tháng)
- ✅ Không sleep
- ✅ Persistent disk (SSD)
- ✅ Custom domain
- ✅ Priority support

## 🆘 Troubleshooting

### Lỗi: "Build failed"
```powershell
# Kiểm tra logs để xem lỗi cụ thể
# Thường do thiếu dependencies hoặc lỗi syntax
```

### Lỗi: "invalid ELF header" (SQLite3)
```powershell
# Lỗi này do SQLite3 build trên Windows không tương thích với Linux
# Giải pháp: Rebuild SQLite3 trên server
# Đảm bảo Build Command là: npm install && npm rebuild sqlite3
```

### Lỗi: "Application failed to respond"
```powershell
# Kiểm tra xem server có đang lắng nghe đúng PORT không
# Render inject PORT qua environment variable
```

### Database không lưu dữ liệu
```
# Do Free Plan không có persistent storage
# Cần nâng cấp Plan hoặc dùng external database
```

## 📞 Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Deploy Node.js Guide](https://render.com/docs/deploy-node-express-app)

---

**Hoàn thành! 🎉**

App của bạn đã sẵn sàng trên internet tại: `https://your-app.onrender.com`
