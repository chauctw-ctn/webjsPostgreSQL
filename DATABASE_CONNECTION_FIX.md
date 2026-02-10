# ⚠️ Database Connection Failed

## Error: password authentication failed

Có thể do:
1. **Password không chính xác** hoặc đã hết hạn
2. **User không có quyền** truy cập database
3. Database URL **không đúng format**

## 🔧 Cách khắc phục

### 1. Kiểm tra lại Database URL từ Supabase

1. Đăng nhập vào **Supabase Dashboard**: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Database**
4. Tìm phần **Connection String** → chọn **"Transaction"** mode
5. Copy **Connection pooling string** (port 6543)

Format đúng:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:6543/postgres
```

### 2. Lấy password mới (nếu quên)

1. Trong Supabase Dashboard → **Settings** → **Database**
2. Tìm phần **Database Password**
3. Click **Reset Database Password**
4. Copy password mới
5. Update lại CONNECTION_STRING với password mới

### 3. Kiểm tra Connection Mode

Đảm bảo sử dụng **Transaction Mode** hoặc **Session Mode**:
- ✅ Transaction Mode: `aws-1-ap-southeast-2.pooler.supabase.com:6543`
- ✅ Session Mode: `aws-1-ap-southeast-2.pooler.supabase.com:5432`
- ❌ Direct Connection: không khuyến nghị cho Render

### 4. Test Connection

Sau khi có DATABASE_URL mới:

```bash
# Set environment variable
# PowerShell:
$env:DATABASE_URL="postgresql://postgres...your_new_url"

# hoặc tạo file .env:
DATABASE_URL=postgresql://postgres...your_new_url

# Test connection
node test-postgres-connection.js
```

### 5. Update Render Environment Variables

Sau khi test local thành công:

1. Vào **Render Dashboard**: https://dashboard.render.com/
2. Chọn Web Service của bạn
3. Vào **Environment**
4. Update `DATABASE_URL` với giá trị mới
5. Click **Save Changes**
6. Render sẽ tự động redeploy

## 📝 Checklist

- [ ] Đã kiểm tra Supabase Dashboard
- [ ] Đã copy đúng Connection String (mode Transaction, port 6543)
- [ ] Password đã được reset (nếu cần)
- [ ] Test connection local thành công
- [ ] Đã update DATABASE_URL trong Render

## 🔐 Security Best Practices

1. **KHÔNG commit** DATABASE_URL vào Git
2. **Sử dụng Environment Variables** trong Render
3. **Rotate password** định kỳ
4. **Enable IP restrictions** trong Supabase (nếu cần)

## ✅ Sau khi fix

Chạy lại test:
```bash
node test-postgres-connection.js
```

Bạn sẽ thấy:
```
✅ Connection successful!
✅ Query successful!
🎉 Database is ready to use!
```

## 🆘 Vẫn không được?

Kiểm tra:
1. **Supabase project status** - có thể project đang bị pause
2. **API rate limits** - free tier có giới hạn
3. **Billing** - project có còn active không
4. **Logs** trong Supabase Dashboard → Database → Logs

## Alternative: Tạo Database mới

Nếu không fix được, có thể tạo database mới:

1. Tạo project mới trong Supabase
2. Lấy connection string mới
3. Update DATABASE_URL
4. App sẽ tự động tạo tables và collect data
