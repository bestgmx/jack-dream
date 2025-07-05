# چک‌لیست سریع استقرار

## ✅ آماده‌سازی پروژه (انجام شده)
- [x] بک‌اند برای Render.com آماده شده
- [x] فرانت‌اند برای ParsPack.com آماده شده
- [x] فایل‌های محیطی ایجاد شده
- [x] پروژه ساخته شده
- [x] فایل ZIP برای ParsPack آماده شده

## 🔄 مراحل بعدی (انجام دهید)

### 1. استقرار بک‌اند در Render.com
1. به [render.com](https://render.com) بروید
2. حساب کاربری ایجاد کنید
3. "New Web Service" ایجاد کنید
4. مخزن GitHub را متصل کنید
5. Root Directory: `backend`
6. Build Command: `npm install`
7. Start Command: `npm start`
8. متغیرهای محیطی اضافه کنید:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
9. URL بک‌اند را کپی کنید

### 2. به‌روزرسانی URL بک‌اند
1. فایل `env.production` را ویرایش کنید
2. URL بک‌اند را در `VITE_API_URL` قرار دهید
3. دوباره پروژه را بسازید: `npm run build`
4. فایل ZIP جدید ایجاد کنید: `zip -r frontend-deploy.zip dist/`

### 3. استقرار فرانت‌اند در ParsPack.com
1. به [parspack.com](https://parspack.com) بروید
2. حساب کاربری ایجاد کنید
3. فایل `frontend-deploy.zip` را آپلود کنید
4. دامنه انتخاب کنید
5. سایت را منتشر کنید

## 📁 فایل‌های آماده
- `frontend-deploy.zip`: فایل آماده برای ParsPack
- `backend/`: پوشه آماده برای Render
- `DEPLOYMENT.md`: راهنمای کامل
- `env.production`: فایل محیطی (نیاز به ویرایش)

## 🔗 لینک‌های مفید
- [Render.com](https://render.com)
- [ParsPack.com](https://parspack.com)
- [GitHub](https://github.com) (برای اتصال مخزن)

## ⚠️ نکات مهم
1. URL بک‌اند را در فرانت‌اند به‌روزرسانی کنید
2. متغیرهای محیطی را در Render تنظیم کنید
3. CORS را بررسی کنید
4. عملکرد سایت را تست کنید 