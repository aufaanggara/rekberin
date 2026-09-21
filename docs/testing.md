# Testing dan Verifikasi

## Test suite

| Suite | Perintah | Cakupan |
|---|---|---|
| Unit | `npm test` | Parser DTO, policy transaksi, participant access, timeline, single-winner helper |
| Database integration | `npm run test:integration` | Persistence relasi/status dan race condition claim listing di PostgreSQL |
| Transaction HTTP E2E | `npm run test:e2e` | Login seller/buyer/admin, create listing, create/reopen transaction, access peserta, reject non-peserta |
| Auth E2E | `npm run test:auth:e2e` | Register, duplicate email/username, password salah, session, middleware admin, role, logout |
| TypeScript | `npm run typecheck` | TypeScript strict check tanpa emit |
| CI build | `npm run build` | Generate Prisma client dan production build Next.js |

## Verifikasi yang dijalankan saat penyusunan dokumen

Pada branch saat ini:

- `npm run typecheck` berhasil.
- `npm test` berhasil dengan 6 test lulus.

Integration/E2E membutuhkan database, Supabase Auth, dan konfigurasi environment aktif. Jalankan suite tersebut setelah identity test dan server dependency siap; test integration/E2E membuat fixture temporer dan memiliki cleanup di akhir.

## Cakupan unit test saat ini

Unit test memeriksa:

- parser response listing/admin/transaction menerima bentuk valid dan menolak bentuk rusak;
- data admin publik boleh memiliki field nullable tanpa membocorkan fee privat;
- timeline mempertahankan sejarah pembayaran/handover saat status menjadi disputed/cancelled;
- anonymous user ditolak;
- role selain `USER` tidak dapat memulai transaksi;
- self-purchase ditolak;
- listing non-`AVAILABLE` ditolak;
- admin tidak aktif ditolak;
- participant check dan helper claim listing.

## Cakupan database/integration test

Integration test membuktikan:

- buyer, seller, admin, dan listing tersimpan pada transaksi yang sama;
- status transaksi awal `PENDING_PAYMENT`;
- listing berubah menjadi `IN_TRANSACTION`;
- dua buyer bersamaan hanya menghasilkan satu transaksi;
- request kedua mendapatkan `TransactionApiError` status `409`.

## Cakupan E2E yang diharapkan

E2E transaction menguji alur nyata dari seller membuat listing sampai buyer membuat transaksi. Auth E2E menguji batas route dan session. Kedua suite bergantung pada service eksternal/database, sehingga hasilnya harus dicatat bersama commit dan environment yang dipakai.

## Gap testing

Belum ada test otomatis untuk:

- mutation status payment/handover/dispute karena endpoint belum ada;
- upload bukti bayar atau attachment chat;
- review/rating;
- dashboard overview yang masih dummy;
- PWA offline secara browser;
- authorization detail pada mutation listing karena edit/deactivate belum tersedia.

## Checklist regresi manual

- [ ] Guest dapat browse listing publik.
- [ ] Guest diarahkan ke login saat memulai transaksi.
- [ ] User biasa dapat register/login/logout.
- [ ] User tidak dapat membuka `/admin`.
- [ ] User tidak dapat membeli listing miliknya sendiri.
- [ ] Dua request buyer ke listing yang sama hanya menghasilkan satu transaksi.
- [ ] Buyer/seller/admin yang tepat dapat membuka detail transaksi.
- [ ] User yang tidak terkait menerima halaman/detail tidak tersedia.
- [ ] Chat polling menampilkan pesan baru dan menutup input untuk transaksi terminal.
- [ ] Service worker tidak mencegat endpoint `/api`.
