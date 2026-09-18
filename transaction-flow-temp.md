# Catatan Implementasi Transaction Flow

Status: selesai dan diverifikasi pada branch `ibrahim/transaction-flow`.

## Scope issue

- Buyer `USER` yang sudah login dapat memulai transaksi dari listing `AVAILABLE`.
- Transaksi menghubungkan buyer, seller, admin, dan listing.
- Status awal transaksi adalah `PENDING_PAYMENT`.
- Status listing berubah menjadi `IN_TRANSACTION` saat transaksi berhasil dibuat.
- Buyer, seller, dan admin yang terkait dapat membuka data transaksi kembali.
- Pengguna yang tidak terkait menerima `404` pada detail transaksi.
- QRIS, handover, dispute, chat, notifikasi, dan perubahan status lanjutan tidak diimplementasikan pada issue ini.

## Backend dan data

- `POST /api/transactions`: autentikasi buyer, validasi role, listing, self-purchase, admin aktif, conditional listing claim, dan pembuatan transaksi.
- `GET /api/transactions`: daftar transaksi berdasarkan relasi buyer/seller/admin dari session user.
- `GET /api/transactions/[id]`: detail participant-only; anonymous `401`, non-participant/not-found `404`.
- `GET /api/admins`: pilihan `ADMIN`/`SUPER_ADMIN` dengan `AdminProfile.isActive=true`.
- `GET /api/listings`: daftar listing Prisma.
- `POST /api/listings`: pembuatan listing oleh session `USER`; seller diambil dari session, bukan request.
- `GET /api/listings/[id]`: detail listing Prisma.
- Service `createTransactionForBuyer` menjalankan update listing dan create transaction di dalam satu Prisma transaction.
- Conditional `updateMany` pada listing menjamin hanya satu buyer berhasil saat terjadi request bersamaan.
- Schema/migration tidak diubah; relasi dan enum yang diperlukan sudah tersedia.

## Kontrak API

- `adminId` pada request/response transaksi adalah `User.id`, bukan `AdminProfile.id`.
- DTO publik hanya mengekspos field user/admin yang dibutuhkan UI.
- `AdminProfile.fee` tidak berada dalam DTO transaksi publik dan tidak diwajibkan parser Zod.
- Fee transaksi masih memakai default schema yang sudah ada; tidak mengambil kebijakan baru dari `AdminProfile.fee`.
- JSON listing lama dinormalisasi agar row legacy tetap aman dirender oleh marketplace.

## Frontend

- `BuyPanel` memuat admin aktif, membuat transaksi, menangani `401`, error, retry, loading, dan redirect ke detail transaksi.
- Marketplace, detail listing, dan form pembuatan listing memakai API/Prisma; target flow tidak lagi mengambil listing dari dummy/localStorage.
- Daftar/detail transaksi buyer dan seller memakai hook API dan view model publik.
- Daftar/detail transaksi admin memakai API nyata serta memvalidasi role dan assignment admin.
- Semua halaman transaksi nyata bersifat read-only untuk payment/handover/dispute/chat sesuai batas scope.
- Login memakai NextAuth Credentials; password diverifikasi oleh Supabase Auth, lalu identitas/role dicocokkan dengan user Prisma.
- Login mempertahankan callback URL internal, feedback error, loading state, autofill, dan kontrol tampil/sembunyikan password.

## Test identity provisioning

- `npm run auth:check`: read-only readiness check untuk test identity di Prisma dan Supabase Auth.
- `npm run auth:seed`: sinkronisasi idempoten test identity yang didefinisikan di `scripts/seed-test-auth.ts`.
- Test identity buyer, seller, admin, dan unrelated super-admin sudah disinkronkan.
- Password tidak dicatat dalam dokumen ini; gunakan konfigurasi script/environment.

## Verifikasi final

- `npm test`: 6 unit tests lulus.
- `npm run test:integration`: 2 PostgreSQL integration tests lulus.
- Integration test membuktikan persistence relasi/status dan single-winner concurrent listing claim.
- `npm run test:e2e`: lulus.
- E2E membuktikan login NextAuth/Supabase, seller membuat listing, buyer membuat transaksi, transaksi dibuka kembali, listing menjadi `IN_TRANSACTION`, buyer/seller/admin dapat membaca transaksi, dan non-participant ditolak.
- Fixture listing/transaksi integration dan E2E dibersihkan otomatis.
- `npm run typecheck`: lulus.
- `npm run build`: lulus.
- `git diff --check`: lulus; hanya warning line-ending Git pada working tree Windows.

## Dampak ke issue dependensi

- DEV-06 belum dinyatakan selesai: login/session yang dibutuhkan DEV-01 aktif, tetapi register/logout dan seluruh proteksi route bukan bagian commit ini.
- DEV-07 belum dinyatakan selesai: create/read listing aktif, tetapi edit/deactivate/ownership mutation belum tersedia.
- DEV-08 belum dinyatakan selesai: marketplace listing untuk transaction flow sudah memakai database, tetapi seluruh admin-directory page tidak diaudit sebagai selesai.
- DEV-13/DEV-14/DEV-15 belum dinyatakan selesai penuh: daftar/detail transaksi nyata aktif, tetapi statistik, listing management seller, dan aksi status admin lanjutan tetap issue terpisah.
