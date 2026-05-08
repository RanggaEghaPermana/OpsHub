# UMKM OpsHub

Dashboard operasional untuk UMKM: produk, kategori, stok masuk/keluar, transaksi, pelanggan, invoice PDF, laporan penjualan, audit log, dan multi-role login.

> Repository ini disiapkan sebagai showcase dan source preview. File runtime seperti `.env`, database lokal, credential, storage production, dependency, build output, log, dan hasil test tidak disertakan, sehingga hasil clone tidak langsung bisa dijalankan tanpa konfigurasi environment sendiri.

## Stack

- Backend: Laravel REST API, Sanctum bearer token, DomPDF
- Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts
- Database: MySQL untuk deployment, SQLite dapat dipakai untuk smoke test lokal
- Deploy: backend ke Railway/Render/VPS, frontend ke Vercel

## Fitur Yang Sudah Dibuat

- Login role `admin`, `staff`, `owner` dengan password hashing Laravel.
- RBAC middleware untuk route admin/owner/staff.
- CRUD kategori, produk, pelanggan, dan user.
- Stok masuk, stok keluar, adjustment, alert stok menipis.
- Input transaksi dengan subtotal, diskon, pajak, pembayaran, dan pengurangan stok otomatis.
- Invoice/nota PDF via endpoint `GET /api/sales/{sale}/invoice`.
- Dashboard analytics: omzet, transaksi, pelanggan aktif, produk stok menipis, grafik harian, produk terlaris.
- Audit log untuk create/update/delete produk, kategori, pelanggan, user, transaksi, dan perubahan stok.
- Modal dan toast custom untuk konfirmasi, notifikasi, dan error aplikasi.
- Pengaturan tema `terang`, `gelap`, atau `sistem`, serta bahasa `Indonesia`, `Inggris`, atau `sistem`.
- Security baseline: rate limit login, validation request, Sanctum token auth, role-based access, hashed password, CORS env, dan soft delete produk.

## Dokumentasi Fitur dan Screenshot

Screenshot fitur dapat ditempatkan di `docs/screenshots/` dengan urutan berikut:

- `01-login.png` - Login multi-role dengan tema OpsHub.
- `02-dashboard.png` - Ringkasan omzet, transaksi, pelanggan aktif, stok menipis, dan grafik.
- `03-produk.png` - Manajemen produk, kategori, foto produk, stok, pencarian, import/export.
- `04-stok.png` - Stok masuk, stok keluar, adjustment, dan alert restock.
- `05-transaksi.png` - Input penjualan, diskon, pajak, pembayaran, kembalian, refund/retur.
- `06-pelanggan.png` - Data pelanggan dan riwayat pembelian.
- `07-invoice.png` - Faktur PDF dengan logo resmi.
- `08-laporan.png` - Laporan penjualan, export CSV/PDF, filter tanggal.
- `09-laba-rugi.png` - Omzet, modal, pengeluaran, laba kotor, dan laba bersih.
- `10-audit.png` - Riwayat aktivitas sistem dengan bahasa yang mudah dipahami.
- `11-pengaturan.png` - Tema terang/gelap/sistem, bahasa Indonesia/Inggris, dan pengaturan toko.

## Status Publik

Repository public tetap dapat di-clone oleh siapa pun. Perlindungan yang diterapkan adalah tidak menyertakan file rahasia dan data runtime. Untuk mencegah penggunaan ulang secara legal, repository ini tidak memakai lisensi open-source; hak cipta tetap milik pemilik repository.

## Menjalankan Lokal

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Untuk MySQL lokal:

```bash
docker compose up -d mysql
```

Lalu sesuaikan `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=umkm_opshub
DB_USERNAME=root
DB_PASSWORD=root
```

Migrasi dan seed:

```bash
php artisan migrate:fresh --seed
php artisan serve
```

Akun seed:

- `admin@umkm.test` / `password`
- `kasir@umkm.test` / `password`
- `owner@umkm.test` / `password`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend default membaca API dari `VITE_API_BASE_URL=http://localhost:8000/api`.

## Endpoint Utama

- `POST /api/login`
- `GET /api/dashboard`
- `apiResource /api/products`
- `apiResource /api/categories`
- `apiResource /api/customers`
- `apiResource /api/stock-movements`
- `apiResource /api/sales`
- `GET /api/sales/{sale}/invoice`
- `GET /api/audit-logs`
- `apiResource /api/users`

## Checklist Security Dasar

- Wajib pakai HTTPS di production.
- Set `APP_DEBUG=false` dan `APP_ENV=production`.
- Batasi `FRONTEND_URLS` hanya domain frontend production.
- Gunakan secret DB dan `APP_KEY` dari environment platform.
- Jalankan `composer audit` dan `npm audit` di CI.
- Tambahkan backup database dan log retention.
- Tambahkan policy lebih granular bila staff tidak boleh menghapus data.

## Verifikasi

```bash
cd backend && php artisan test
cd frontend && npm run build
cd frontend && npm run e2e
```
