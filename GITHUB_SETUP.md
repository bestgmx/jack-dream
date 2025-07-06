# راهنمای اتصال به GitHub

## مرحله 1: ایجاد مخزن در GitHub

1. به [github.com](https://github.com) بروید
2. وارد حساب کاربری خود شوید
3. روی "New repository" کلیک کنید
4. تنظیمات:
   - **Repository name**: `jack-dream`
   - **Description**: `Jack Dream - React + Node.js Application`
   - **Visibility**: Public
   - **Initialize**: تیک نزنید (کد موجود داریم)
5. روی "Create repository" کلیک کنید

## مرحله 2: اتصال مخزن محلی به GitHub

بعد از ایجاد مخزن، این دستورات را در ترمینال اجرا کنید:

```bash
# اتصال به مخزن GitHub (URL را با URL مخزن خود جایگزین کنید)
git remote add origin https://github.com/YOUR_USERNAME/jack-dream.git

# ارسال کد به GitHub
git branch -M main
git push -u origin main
```

## مرحله 3: بررسی اتصال

```bash
# بررسی remote ها
git remote -v

# بررسی وضعیت
git status
```

## مرحله 4: به‌روزرسانی‌های بعدی

```bash
# اضافه کردن تغییرات
git add .

# ثبت تغییرات
git commit -m "Update description"

# ارسال به GitHub
git push
```

## نکات مهم

- URL مخزن را از صفحه GitHub کپی کنید
- نام کاربری خود را در URL جایگزین کنید
- اگر از SSH استفاده می‌کنید، URL متفاوت خواهد بود
- بعد از اتصال، Render.com می‌تواند مخزن را متصل کند 