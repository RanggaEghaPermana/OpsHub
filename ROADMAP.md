# Roadmap

Roadmap ini mencatat arah pengembangan OpsHub setelah MVP.

## Selesai

- Multi-role login untuk Admin, Kasir/Staff, dan Owner.
- Dashboard operasional dengan omzet, transaksi, pelanggan aktif, stok menipis, grafik harian, dan produk terlaris.
- CRUD produk, kategori, pelanggan, supplier, lokasi, user, pembelian, dan pengeluaran.
- Foto produk, pencarian tabel, pagination, import produk, dan export CSV.
- Stok masuk/keluar, adjustment, audit stok, dan alert restock langsung dari halaman stok kritis.
- Transaksi penjualan dengan diskon, pajak, status pembayaran, pembayaran tunai, kembalian, pembatalan, dan refund.
- Invoice/faktur PDF dengan branding OpsHub.
- Laporan penjualan dan laporan laba rugi.
- Audit log dengan bahasa yang mudah dipahami pengguna umum.
- Tema terang/gelap/sistem dan bahasa Indonesia/Inggris/sistem.
- Responsive layout untuk desktop, tablet, dan mobile.

## Prioritas Berikutnya

- Deploy demo frontend dan backend dengan database staging.
- Permission granular per aksi, misalnya boleh refund, hapus produk, atau lihat laba rugi.
- Barcode scanner untuk input SKU saat transaksi.
- Import pelanggan dan supplier dari CSV/Excel.
- Export laporan dalam format XLSX selain CSV/PDF.
- Notifikasi stok menipis berbasis email atau WhatsApp gateway.
- Optimasi query lanjutan untuk dataset besar dan laporan historis.

## Ide Lanjutan

- Multi cabang dengan transfer stok antar lokasi.
- Pembayaran digital dan integrasi payment gateway.
- Integrasi printer thermal untuk nota kasir.
- Dashboard owner berbasis KPI dan periode custom.
- Backup otomatis terjadwal ke object storage.
- Mode offline-first untuk kasir.
