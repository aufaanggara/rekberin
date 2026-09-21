# Dokumentasi Rekberin

Dokumentasi ini menjelaskan kondisi repository Rekberin yang sedang dibaca pada **21 September 2026**. Rekberin adalah marketplace escrow untuk jual-beli akun game, dengan alur transaksi yang melibatkan buyer, seller, dan admin rekber.

## Cara membaca dokumentasi

- [Setup dan pengembangan lokal](setup.md)
- [Arsitektur aplikasi](architecture.md)
- [Kontrak API yang tersedia](api.md)
- [Model data dan migrasi](data-model.md)
- [Alur fitur](flows.md)
- [Testing dan verifikasi](testing.md)
- [Status implementasi dan gap](status.md)

## Ringkasan teknis

| Area | Implementasi saat ini |
|---|---|
| Framework | Next.js 14 App Router |
| UI | React 18, TypeScript strict, TailwindCSS, Radix UI |
| Database | PostgreSQL melalui Prisma; target penggunaan Supabase |
| Auth | NextAuth Credentials + verifikasi password melalui Supabase Auth |
| Session | JWT NextAuth, membawa `userId` dan `role` |
| Client state | Zustand untuk UI/demo lama; hook fetch untuk data API |
| Validasi | Zod pada route handler dan parser response client |
| Chat | API database dengan polling setiap 5 detik |
| Media/PWA | Service worker, manifest, offline page, gambar listing saat ini disimpan sebagai URL/data URL |
| CI | GitHub Actions pada pull request dan push ke `main` |

## Status fungsional singkat

Sudah memiliki implementasi nyata:

- registrasi dan login berbasis Supabase Auth + profil Prisma;
- proteksi route dan role `USER`, `ADMIN`, `SUPER_ADMIN`;
- baca dan buat listing melalui database;
- daftar admin aktif untuk dipilih buyer;
- pembuatan transaksi atomik dari listing yang masih `AVAILABLE`;
- daftar/detail transaksi dengan akses terbatas pada peserta;
- chat transaksi tersimpan di database dan diambil melalui polling;
- test unit, integration test database, HTTP E2E, auth E2E, dan CI workflow.

Masih berupa UI/demo, read-only, atau belum tersedia sebagai API:

- pembayaran QRIS dinamis dan upload bukti pembayaran;
- transisi status setelah `PENDING_PAYMENT`;
- handover/vault akun yang persisten;
- dispute, review/rating, dan resolusi sengketa;
- aksi admin pada transaksi;
- edit/nonaktifkan listing;
- halaman dashboard overview dan direktori admin yang masih mengambil dummy data.

Detail per area ada di [status.md](status.md).

## Sumber kebenaran

Untuk memahami perilaku aplikasi, gunakan urutan berikut:

1. Source code dan skema Prisma pada branch yang sedang digunakan.
2. Kontrak tipe dan parser Zod di `types/` serta `lib/*-api-client.ts`.
3. `Rekberin_AI_Context.md` untuk keputusan produk dan riwayat pengerjaan.
4. `prd/PRD_RekberGG_Final.md` dan `Rekberin_Rencana_Issue.pdf` untuk target produk lama.

Dokumen PRD/context berisi keputusan dan rencana yang beberapa bagiannya belum diwujudkan di kode. Jika ada perbedaan, dokumentasi ini menyebutkan implementasi aktual dan gap-nya secara eksplisit.

## Struktur direktori utama

```text
app/                    Halaman App Router dan route handler API
components/             Komponen UI berdasarkan area fitur
data/                   Dummy data untuk halaman yang belum terintegrasi
hooks/                  Hook client untuk mengambil data API
lib/                    Auth, Prisma, service, DTO, parser, dan utilitas
prisma/                 Schema, migration, dan seed database
scripts/                Script seed identity test dan scraper data
store/                  Zustand store legacy/demo
tests/                  Unit, integration, HTTP E2E, dan auth E2E
types/                  Tipe domain, API, dan view model
docs/                   Dokumentasi teknis repository ini
```

## Catatan keamanan

Jangan commit `.env`, secret Supabase, `NEXTAUTH_SECRET`, credential payment, password akun game, atau data rekening. File `.env` lokal terdeteksi di repository kerja dan sengaja tidak dibaca nilainya maupun disalin ke dokumentasi.
