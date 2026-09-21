# Status Implementasi dan Gap

Status berikut disusun dari source code branch yang sedang digunakan, bukan dari klaim “sudah selesai” pada README lama atau target PRD.

## Matrix fitur

| Fitur/issue | Status aktual | Bukti utama |
|---|---|---|
| DEV-05 Database | Selesai sebagai fondasi | `prisma/schema.prisma`, migration, `prisma/seed.ts` |
| DEV-06 Auth dan role | Sebagian besar tersedia | `lib/auth.ts`, auth routes, `middleware.ts`, auth E2E |
| DEV-07 Listing management | ✅ Selesai (Create, read, edit, deactivate) | `app/api/listings/`, `CreateListingForm.tsx` |
| DEV-08 Marketplace integration | Listing marketplace memakai API; direktori admin belum | `useListings.ts`, `ListingsExplorer.tsx`, `/rekber` |
| DEV-01 Transaction flow | Create/read tersedia | `lib/transactions.ts`, transaction routes, transaction E2E |
| DEV-02 QRIS/payment | Belum terhubung | `PaymentModal.tsx` masih `useStore`/simulasi; tidak ada payment route/model |
| DEV-03 Handover | Belum terhubung | `AccountVaultPanel.tsx` dan checklist masih local/demo |
| DEV-04 Dispute | Belum terhubung | `DisputeModal.tsx`/store lokal; tidak ada mutation route |
| DEV-09 Chat | API + polling tersedia | `messages/route.ts`, `TransactionChat.tsx` |
| DEV-10 Review/rating | Model/dummy UI ada; API belum | `Review` schema, dummy review components |
| DEV-11 Notification/page states | Loading/error ada pada beberapa API page; notifikasi fitur inti belum | hooks dan toast UI |
| DEV-12 CI/CD | Workflow tersedia | `.github/workflows/ci.yml` |
| DEV-13/14 User dashboard | Transaction pages API; overview/listing management masih dummy | `/user/transactions/*` vs `/user/page.tsx` |
| DEV-15 Admin dashboard | Transaction pages API read-only; overview/action masih dummy | `/admin/transactions/*` vs `/admin/page.tsx` |
| DEV-16 Statistik | UI statistik ada, tetapi dashboard overview memakai dummy | `/admin/page.tsx`, `/user/page.tsx` |

## Yang sudah kuat

### Transaction creation

- Validasi role, listing, self-purchase, admin aktif, dan status tersedia dilakukan di server.
- Claim listing dan insert transaksi atomik.
- Race condition diuji di integration test.
- DTO publik tidak mengembalikan data privat yang tidak diperlukan UI.
- Detail transaksi menyamarkan transaksi milik user lain sebagai `404`.

### Auth

- Password tidak diverifikasi dari kolom Prisma melainkan melalui Supabase Auth.
- JWT NextAuth membawa `userId` dan `role`.
- Middleware dan route API sama-sama memiliki guard.
- Callback URL login dibatasi ke path internal yang diawali satu `/`.

### Chat

- Sender diambil dari session server.
- Akses dibatasi pada tiga peserta transaksi.
- Pesan tidak dapat dikirim ketika transaksi `COMPLETED` atau `CANCELLED`.
- Client menggunakan polling, sesuai keputusan MVP.

## Gap prioritas tinggi sebelum production

1. **Status transaction mutation**: tambahkan route server-side dengan state machine eksplisit untuk konfirmasi pembayaran, mulai/selesai handover, buyer confirmation, cancel, dan dispute.
2. **Payment model dan proof**: pisahkan payment attempt/proof dari `proofUrls`, hubungkan provider sandbox, expiry, webhook/polling, dan audit log.
3. **Credential vault**: jangan menyimpan password akun game di Zustand/localStorage; gunakan storage terenkripsi dan access control per transaksi.
4. **Listing ownership mutation**: implementasikan edit/deactivate dengan `sellerId` dari session, bukan body client.
5. **Replace dummy pages**: migrasikan `/`, `/user`, `/admin`, `/rekber`, review listing, dan admin profile ke API atau tandai sebagai prototype secara visual.
6. **Remove stale data contracts**: migration telah menghapus `User.whatsapp`, tetapi `types/index.ts`, dummy data, dan beberapa admin page masih merujuknya.
7. **Chat attachment**: tentukan storage, ukuran/jenis file, metadata, dan cara menyimpan URL; jangan menganggap preview lokal sebagai upload berhasil.
8. **Review/dispute schema and routes**: enforce participant, terminal state, uniqueness, rating bounds, resolution actor, dan audit trail.

## Gap keamanan dan operasional

- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai di server. Pastikan import service client tidak masuk client bundle.
- Default placeholder pada `lib/supabase.ts` membantu build tetapi dapat menyamarkan konfigurasi environment yang hilang; deployment harus fail-fast atau memiliki health check.
- `AdminProfile.bankAccounts` dan `fee` perlu kebijakan exposure yang konsisten. Hindari menampilkan data rekening privat di route publik.
- `logs` dan `checklist` masih JSON tanpa schema database; validasi terstruktur diperlukan sebelum menjadi dasar pencairan dana.
- Service worker menyimpan dokumen navigasi yang berhasil di cache; evaluasi apakah halaman transaksi privat boleh dicache pada versi production.
- README menyatakan `.env.example` tersedia, tetapi file tersebut tidak ada di repository. Tambahkan template tanpa secret untuk onboarding.

## Catatan konflik dokumentasi lama

- Nama produk aktif adalah **Rekberin**; **RekberGG** adalah nama legacy/PRD.
- PRD lama memuat brainstorming buyer tanpa login dan admin dengan fee individual. Keputusan context terbaru menetapkan buyer harus login dan admin adalah internal platform; kode transaksi mengikuti aturan buyer login.
- README lama menggambarkan backend sebagai “siap disambungkan”, tetapi branch sekarang sudah memiliki sebagian integrasi API. Sebaliknya, beberapa klaim fitur UI di README masih belum berarti mutation backend tersedia.
- Context progress dan issue summary tidak selalu memakai status yang sama dengan source branch. Untuk perubahan berikutnya, perbarui status setelah memeriksa code dan test, bukan hanya riwayat issue.

## Rekomendasi urutan pekerjaan berikutnya

```text
1. Tetapkan state machine + API mutation transaksi
2. Tambahkan payment/payment-proof persistence sandbox
3. Hubungkan admin/buyer actions ke mutation dengan authorization server
4. Persist handover/dispute/review dan audit activity
5. Migrasikan dashboard/direktori dari dummy ke API
6. Tambahkan test untuk setiap transition dan authorization boundary
7. Tambahkan .env.example, health check, dan review cache PWA privat
```
