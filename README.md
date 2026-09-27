# Rekberin

Marketplace akun game dengan negosiasi, pembayaran QRIS Midtrans, dan serah terima akun.

## Menjalankan proyek

1. Salin `.env.example` ke `.env.local` dan isi koneksi PostgreSQL, NextAuth, dan Midtrans.
2. Jalankan `npm install` dan `npx prisma migrate deploy`.
3. Jalankan `npm run dev`.

Perintah `dev` dan `start` menjalankan aplikasi bersama worker yang memeriksa batas konfirmasi handover setiap 30 detik. Untuk deployment yang tidak menjalankan proses worker terus menerus, jadwalkan `POST /api/jobs/handover-expiry` setidaknya setiap menit dengan header `Authorization: Bearer <HANDOVER_CRON_SECRET>`.

## Alur transaksi

1. Buyer membuka listing lalu memilih **Chat seller** atau **Kirim tawaran**. Di desktop chat dan penawaran berdampingan; di mobile keduanya tersedia sebagai tab.
2. Buyer mengirim tawaran. Seller menerima atau menolak. Tawaran yang diterima dapat dilanjutkan buyer ke halaman chat dan pembayaran.
3. Setelah Midtrans mengonfirmasi pembayaran, halaman menjadi chat dan serah terima. Batas konfirmasi buyer adalah dua jam sejak server mengonfirmasi pembayaran.
4. Buyer dan seller dapat berbicara lewat chat web atau menyimpan nomor WhatsApp dan membuka percakapan di WhatsApp. Tidak ada formulir khusus untuk OTP, email, atau kata sandi akun.
5. Buyer memilih **Akun diterima** atau **Laporkan masalah**. Laporan menambahkan admin transaksi ke chat serta menunda batas waktu. Admin dapat melanjutkan atau membatalkan transaksi.
6. Konfirmasi buyer atau berakhirnya dua jam tanpa laporan menyelesaikan transaksi, menandai listing terjual, dan mencatat pencairan dummy ke seller. Pembatalan oleh admin mengembalikan listing ke tersedia dan mencatat pengembalian dummy ke buyer.

Pencairan dan pengembalian dana **hanya simulasi yang tersimpan di database**. Belum ada transfer ke rekening atau e-wallet karena provider payout belum terhubung. Pembayaran QRIS menggunakan konfigurasi Midtrans proyek; gunakan sandbox untuk pengujian.

Untuk pengujian lokal, set `MIDTRANS_QRIS_NTFY_TEST=true`. Saat tautan QRIS sandbox baru tersedia, server mengirim `Midtrans QRIS: <tautan>` melalui POST ke topik publik `https://ntfy.sh/codex-completion-notification`. Fitur ini mati secara default dan kegagalan notifikasi tidak menggagalkan pembayaran.

## Pemeriksaan

```bash
npm run typecheck
npm test
npm run test:integration
npm run build
```

Tes integrasi memerlukan PostgreSQL yang telah menerima migrasi terbaru. File migrasi ada di `prisma/migrations/20260926160000_marketplace_handover_flow`.
