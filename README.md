# 🛡️ Form chống spam với Google reCAPTCHA v3 + Vercel

Hướng dẫn triển khai form HTML thuần với reCAPTCHA v3 và Vercel Serverless Function.

## 📁 Cấu trúc thư mục

```
VerifyCaptcha/
├── index.html          # Frontend - Form liên hệ
├── api/
│   └── verify.js       # Backend - Vercel Serverless Function
├── vercel.json         # Cấu hình Vercel
└── README.md           # Hướng dẫn này
```

## 🚀 Hướng dẫn cài đặt

### Bước 1: Tạo reCAPTCHA v3 keys

1. Truy cập [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"+"** để tạo site mới
3. Điền thông tin:
   - **Label**: Tên dự án (ví dụ: "My Contact Form")
   - **reCAPTCHA type**: Chọn **reCAPTCHA v3**
   - **Domains**: Thêm domain của bạn
     - Cho local: `localhost`
     - Cho Vercel: `your-project.vercel.app`
4. Click **Submit**
5. Lưu lại:
   - **Site Key** (public) - dùng ở frontend
   - **Secret Key** (private) - dùng ở backend

### Bước 2: Cấu hình Site Key trong Frontend

Mở file `index.html` và thay thế `YOUR_SITE_KEY` ở **2 vị trí**:

```html
<!-- Vị trí 1: Trong thẻ <head> -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

```javascript
// Vị trí 2: Trong thẻ <script>
const RECAPTCHA_SITE_KEY = 'YOUR_SITE_KEY';
```

### Bước 3: Deploy lên Vercel

#### Cách 1: Qua Vercel CLI

```bash
# Cài đặt Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

#### Cách 2: Qua GitHub

1. Push code lên GitHub repository
2. Truy cập [vercel.com](https://vercel.com)
3. Click **"Import Project"**
4. Chọn repository của bạn
5. Click **"Deploy"**

### Bước 4: Cấu hình Environment Variable trên Vercel

⚠️ **QUAN TRỌNG**: Không bao giờ commit Secret Key vào code!

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Thêm biến mới:

| Name | Value | Environment |
|------|-------|-------------|
| `RECAPTCHA_SECRET_KEY` | `your-secret-key-here` | Production, Preview, Development |

5. Click **Save**
6. **Redeploy** project để áp dụng biến mới

## 🔧 Test local với Vercel CLI

```bash
# Chạy local development server
vercel dev

# Mở trình duyệt: http://localhost:3000
```

**Lưu ý khi test local:**
- Tạo file `.env` (đã có trong `.gitignore`):

```env
RECAPTCHA_SECRET_KEY=your-secret-key-here
```

## 📊 Cách hoạt động

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    FRONTEND     │────▶│    BACKEND      │────▶│    GOOGLE       │
│   (index.html)  │     │  (api/verify)   │     │   reCAPTCHA     │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘

1. User submit form
2. Frontend gọi grecaptcha.execute() → nhận token
3. Frontend gửi token + form data đến /api/verify
4. Backend gọi Google API để verify token
5. Google trả về score (0.0 - 1.0)
6. Backend kiểm tra score >= 0.5
7. Backend trả về success/failure cho frontend
```

## 🎯 Giải thích Score

| Score | Ý nghĩa | Hành động |
|-------|---------|-----------|
| 0.9 - 1.0 | Rất chắc chắn là người thật | ✅ Cho phép |
| 0.7 - 0.9 | Có khả năng là người thật | ✅ Cho phép |
| 0.5 - 0.7 | Không chắc chắn | ⚠️ Cần xem xét |
| 0.3 - 0.5 | Có khả năng là bot | ❌ Từ chối |
| 0.0 - 0.3 | Rất chắc chắn là bot | ❌ Từ chối |

**Ngưỡng mặc định trong code: 0.5**

Bạn có thể điều chỉnh trong `api/verify.js`:

```javascript
const scoreThreshold = 0.5; // Tăng để nghiêm ngặt hơn
```

## 🔒 Lưu ý bảo mật

### ✅ Nên làm

- Lưu Secret Key trong Environment Variables
- Validate input ở cả frontend và backend
- Sử dụng HTTPS
- Log các request đáng ngờ
- Rate limiting cho API

### ❌ Không nên làm

- Hardcode Secret Key trong code
- Commit file `.env` lên Git
- Tin tưởng hoàn toàn vào frontend validation
- Bỏ qua score thấp

## 📝 Mở rộng

### Thêm gửi email

Cài đặt SendGrid/Nodemailer và thêm vào `api/verify.js`:

```javascript
// Sau khi verify thành công
if (formData) {
    await sendEmail({
        to: 'admin@example.com',
        subject: `Liên hệ mới từ ${formData.name}`,
        body: formData.message
    });
}
```

### Lưu vào database

```javascript
// Sử dụng MongoDB, PostgreSQL, etc.
await database.contacts.create({
    name: formData.name,
    email: formData.email,
    message: formData.message,
    recaptchaScore: score,
    createdAt: new Date()
});
```

### Tích hợp Slack notification

```javascript
await fetch('https://hooks.slack.com/services/...', {
    method: 'POST',
    body: JSON.stringify({
        text: `📧 Liên hệ mới từ ${formData.name} (${formData.email})`
    })
});
```

## 🐛 Troubleshooting

### Lỗi "reCAPTCHA not loaded"

- Kiểm tra Site Key đã đúng chưa
- Kiểm tra domain đã được thêm vào reCAPTCHA admin

### Lỗi "Invalid secret key"

- Kiểm tra Secret Key trong Environment Variables
- Đảm bảo đã redeploy sau khi thêm biến

### Score luôn thấp

- Có thể do VPN/Proxy
- Thử từ network khác
- Giảm ngưỡng score (cẩn thận với spam)

## 📚 Tài liệu tham khảo

- [Google reCAPTCHA v3 Docs](https://developers.google.com/recaptcha/docs/v3)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

Made with ❤️ for spam-free forms
