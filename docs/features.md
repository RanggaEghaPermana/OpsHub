# Feature Overview

OpsHub adalah dashboard operasional UMKM untuk mengelola inventori, penjualan, pelanggan, faktur, pembelian, pengeluaran, laporan, dan audit aktivitas.

## Autentikasi dan Role

- Login multi-role untuk Admin, Kasir/Staff, dan Owner.
- Token auth menggunakan Laravel Sanctum.
- Role-based access control untuk membatasi fitur sensitif.
- Password hashing menggunakan mekanisme Laravel.

## Inventori

- CRUD produk dan kategori.
- Foto produk untuk membantu identifikasi barang.
- SKU, harga, stok, stok minimum, unit, status produk, dan kategori.
- Pencarian dan pagination di daftar produk.
- Import produk dan export CSV.
- Soft delete produk agar data historis tetap aman.

## Stok

- Stok masuk, stok keluar, dan adjustment.
- Riwayat stok dengan jumlah sebelum/sesudah.
- Audit pengguna yang mengubah stok.
- Alert stok menipis berdasarkan minimum stok.
- Restock langsung dari halaman alert stok.

## Penjualan

- Input transaksi penjualan.
- Perhitungan subtotal, diskon, pajak, total, nominal dibayar, dan kembalian.
- Status pembayaran dan status transaksi.
- Pembatalan transaksi dan refund/retur.
- Riwayat transaksi dengan pencarian dan export CSV.

## Faktur

- Generate faktur/nota PDF.
- Nama file faktur mengikuti bahasa yang dipilih.
- Desain faktur menggunakan logo resmi dan tema OpsHub.

## Pelanggan

- CRUD pelanggan.
- Kontak, email, alamat, dan terakhir beli.
- Detail riwayat pembelian pelanggan.
- Export data pelanggan.

## Pembelian dan Supplier

- Mencatat pembelian stok dari supplier.
- Nomor referensi, tanggal pembelian, lokasi, status, dan total.
- CRUD supplier dengan kontak, email, alamat, dan status aktif.

## Pengeluaran

- Pencatatan biaya operasional seperti bahan, sewa, gaji, listrik, dan biaya lain.
- Filter periode dan export CSV.
- Data digunakan untuk laporan laba rugi.

## Laporan

- Laporan penjualan dengan grafik transaksi harian dan status pembayaran.
- Produk terlaris berdasarkan periode.
- Filter tanggal dan export CSV/PDF.
- Laporan laba rugi dengan omzet, harga modal, laba kotor, pengeluaran, dan laba bersih.

## Audit Log

- Riwayat aktivitas sistem menggunakan bahasa umum.
- Mencatat siapa melakukan perubahan, aktivitas apa, target data, dan waktu.

## Pengaturan

- Mode terang, gelap, atau mengikuti sistem.
- Bahasa Indonesia, Inggris, atau mengikuti sistem.
- Pengaturan toko, prefix faktur, pajak default, dan backup database.

## Responsif

- Layout desktop dengan sidebar tetap.
- Layout tablet dan mobile dengan navigasi yang menyesuaikan ukuran layar.
- Tabel berubah menjadi tampilan yang lebih nyaman dibaca di layar kecil.
