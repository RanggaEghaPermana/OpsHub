# Changelog

Semua perubahan penting OpsHub dicatat di file ini.

Format mengikuti prinsip ringkas dari Keep a Changelog, tanpa mengikat project ke semantic versioning penuh selama fase MVP.

## 1.0.0 - MVP Showcase

### Added

- Backend Laravel REST API dengan autentikasi token Sanctum.
- Frontend React + TypeScript dengan desain OpsHub, mode terang/gelap/sistem, dan bahasa Indonesia/Inggris/sistem.
- Multi-role login untuk Admin, Kasir/Staff, dan Owner.
- Manajemen produk, kategori, pelanggan, supplier, lokasi, user, pembelian, dan pengeluaran.
- Foto produk, pencarian, pagination, import produk, dan export CSV.
- Stok masuk/keluar, adjustment, riwayat stok, dan alert restock.
- Transaksi penjualan dengan subtotal, diskon, pajak, pembayaran, kembalian, pembatalan, dan refund.
- Faktur PDF dengan logo resmi.
- Dashboard analytics, laporan penjualan, laporan laba rugi, dan audit log.
- Dokumentasi fitur dengan screenshot di README.

### Security

- Password hashing menggunakan mekanisme Laravel.
- Rate limit login.
- Validasi input backend dan frontend.
- Role-based access control untuk endpoint utama.
- File `.env`, database lokal, dependency, build output, log, dan storage runtime dikecualikan dari repository.

### Documentation

- README showcase dengan galeri fitur.
- Roadmap, changelog, security policy, dokumentasi fitur, dan arsitektur.
