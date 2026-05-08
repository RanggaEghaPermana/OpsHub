# Architecture

OpsHub menggunakan arsitektur frontend dan backend terpisah.

```text
React + TypeScript + Vite
        |
        | REST API + Bearer Token
        v
Laravel API + Sanctum
        |
        v
MySQL / SQLite local testing
```

## Frontend

- Framework: React + TypeScript + Vite.
- Styling: Tailwind CSS dan CSS custom untuk tema OpsHub.
- Chart: Recharts.
- PDF invoice: dihasilkan dari backend, diunduh melalui browser.
- State utama disimpan di React component state dan local storage untuk token, tema, dan bahasa.
- API client berada di `frontend/src/api.ts`.
- Entry app utama berada di `frontend/src/App.tsx`.

## Backend

- Framework: Laravel REST API.
- Auth: Laravel Sanctum bearer token.
- PDF: DomPDF.
- Database: MySQL untuk production/deployment, SQLite untuk local smoke test dan CI.
- Route API berada di `backend/routes/api.php`.
- Controller API berada di `backend/app/Http/Controllers/Api`.
- Model berada di `backend/app/Models`.
- Migration berada di `backend/database/migrations`.

## Modul Utama

- Auth dan user management.
- Produk dan kategori.
- Stok dan stock movement.
- Transaksi penjualan dan sale item.
- Faktur/invoice.
- Pelanggan.
- Supplier dan pembelian.
- Pengeluaran.
- Lokasi cabang/gudang.
- Laporan penjualan dan laba rugi.
- Audit log.
- Pengaturan toko.

## Pola Data

- Transaksi penjualan mengurangi stok dan membuat riwayat stok.
- Refund atau pembatalan mengembalikan stok sesuai item transaksi.
- Pembelian menambah stok dan mencatat supplier/lokasi.
- Pengeluaran masuk ke laporan laba rugi.
- Aktivitas penting dicatat ke audit log.

## Deployment Target

- Frontend: Vercel.
- Backend: Railway, Render, atau VPS.
- Database: MySQL managed service atau MySQL VPS.
- File storage production sebaiknya menggunakan disk yang persistent atau object storage.
