# Deployment Notes

Dokumen ini merangkum langkah deployment OpsHub secara umum.

## Frontend

Target yang disarankan: Vercel.

Environment:

```env
VITE_API_BASE_URL=https://api-domain-kamu.com/api
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

## Backend

Target yang disarankan: Railway, Render, atau VPS.

Environment penting:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api-domain-kamu.com
FRONTEND_URLS=https://frontend-domain-kamu.com
SANCTUM_STATEFUL_DOMAINS=frontend-domain-kamu.com

DB_CONNECTION=mysql
DB_HOST=
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
```

Setup production:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Checklist

- HTTPS aktif untuk frontend dan backend.
- CORS hanya mengizinkan domain frontend production.
- `APP_DEBUG=false`.
- Database credential tidak disimpan di repository.
- Storage produk/invoice memakai storage persistent.
- Backup database aktif.
- Log retention disiapkan.
