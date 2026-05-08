# Security Policy

OpsHub adalah repository showcase/source preview. File rahasia seperti `.env`, database lokal, credential, storage production, dependency, build output, log, dan hasil test tidak disertakan.

## Dukungan Versi

| Versi | Status |
| --- | --- |
| 1.0.x | Didukung untuk perbaikan keamanan dasar |

## Praktik Keamanan Saat Ini

- Password disimpan dengan hashing bawaan Laravel.
- Login menggunakan rate limit.
- API menggunakan token auth Laravel Sanctum.
- Endpoint penting dilindungi role-based access control.
- Input divalidasi di backend sebelum disimpan.
- CORS dikontrol melalui environment production.
- File runtime dan credential tidak masuk Git.

## Checklist Production

- Set `APP_ENV=production`.
- Set `APP_DEBUG=false`.
- Gunakan HTTPS.
- Gunakan `APP_KEY`, credential database, dan secret lain dari environment platform.
- Batasi `FRONTEND_URLS` hanya ke domain production.
- Jalankan `composer audit` dan `npm audit` secara berkala.
- Aktifkan backup database dan log retention.
- Gunakan database user dengan permission minimum yang diperlukan.

## Pelaporan Kerentanan

Jika menemukan celah keamanan, jangan buka issue public berisi detail eksploit. Hubungi pemilik repository secara langsung melalui profil GitHub, lalu sertakan:

- Ringkasan masalah.
- Langkah reproduksi.
- Dampak potensial.
- Saran mitigasi bila ada.
