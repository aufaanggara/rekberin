# Setup dan Pengembangan Lokal

## Prasyarat

- Node.js 20, sesuai workflow CI.
- npm.
- PostgreSQL yang dapat diakses Prisma. Konfigurasi saat ini ditujukan untuk Supabase PostgreSQL.
- Project Supabase dengan Auth aktif jika ingin menjalankan register/login.
- Browser modern untuk menguji PWA dan service worker.

## Instalasi

Jalankan dari direktori `rekberin/`:

```bash
npm install
npx prisma generate
```

`npm install` menjalankan `postinstall` yang juga memanggil `prisma generate`. Perintah eksplisit tetap berguna ketika schema atau dependency berubah.

Repository saat ini **belum memiliki `.env.example`**, walaupun README lama menyebut file tersebut. Buat `.env.local` secara lokal dan isi variabel berikut tanpa memasukkan nilainya ke Git:

| Variabel | Dipakai oleh | Keterangan |
|---|---|---|
| `DATABASE_URL` | Prisma | URL koneksi pooled PostgreSQL |
| `DIRECT_URL` | Prisma | URL koneksi direct untuk migration |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client/Auth | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth | Anon key yang aman untuk client sesuai kebijakan Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/auth/register`, script auth | Secret server-side; jangan expose ke browser |
| `NEXTAUTH_URL` | NextAuth/Next config | URL aplikasi, misalnya `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth | Secret signing/encryption session |
| `NEXT_PUBLIC_SITE_NAME` | Konfigurasi lokal | Nama site; saat ini tidak menjadi dependency utama route |
| `NEXT_PUBLIC_SITE_URL` | Konfigurasi lokal | URL site; saat ini tidak menjadi dependency utama route |
| `UPLOADTHING_SECRET` | Konfigurasi yang direncanakan | Dependency ada, tetapi route upload aktif belum tersedia |
| `UPLOADTHING_APP_ID` | Konfigurasi yang direncanakan | Dependency ada, tetapi route upload aktif belum tersedia |

Jangan menyalin `.env` yang ada ke dokumentasi. Gunakan secret manager pada deployment.

## Database

Migration yang sudah ada menggunakan provider PostgreSQL:

```bash
npx prisma migrate deploy
```

Untuk development yang sengaja ingin menyamakan schema tanpa migration:

```bash
npm run prisma:push
```

Seed data development:

```bash
npm run prisma:seed
```

Seed membuat user demo, admin profile, dan satu listing. Data dan password seed hanya untuk development; jangan gunakan pada lingkungan produksi.

Perintah berguna lainnya:

```bash
npm run prisma:generate
npx prisma studio
```

## Menjalankan aplikasi

```bash
npm run dev
```

Aplikasi tersedia di `http://localhost:3000` secara default. Untuk build production lokal:

```bash
npm run build
npm run start
```

`next.config.mjs` menormalisasi `NEXTAUTH_URL`. Jika nilainya kosong, aplikasi mencoba `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, lalu fallback ke `http://localhost:3000` agar prerender tidak gagal karena URL kosong.

## Identity untuk testing

Script `scripts/seed-test-auth.ts` menyediakan dua mode:

```bash
npm run auth:check
npm run auth:seed
```

- `auth:check` hanya memeriksa kesiapan identity test di Prisma dan Supabase Auth.
- `auth:seed` menyinkronkan identity test ketika dijalankan dengan `--apply` melalui script npm.
- Script memerlukan `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `DATABASE_URL`.
- Password test diambil dari `TEST_USER_PASSWORD` atau default development script. Jangan membawa password tersebut ke dokumen, commit, atau deployment.

## Script npm

| Perintah | Tujuan |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Generate Prisma client dan build Next.js |
| `npm run start` | Menjalankan build production |
| `npm run typecheck` | TypeScript check tanpa emit |
| `npm test` | Unit test transaksi |
| `npm run test:integration` | Integration test PostgreSQL |
| `npm run test:e2e` | HTTP E2E alur listing-transaksi |
| `npm run test:auth:e2e` | E2E register/login/authorization/logout |
| `npm run prisma:seed` | Seed development |
| `npm run scrape:pesdb` | Mengambil data katalog PESDB ke output JSON; cek opsi script sebelum dipakai |

## Troubleshooting

### Build gagal pada Prisma engine

Pastikan `npx prisma generate` dapat mengunduh atau menemukan engine Prisma, lalu periksa `DATABASE_URL` dan `DIRECT_URL`. Build menjalankan generate secara otomatis, sehingga error engine biasanya merupakan masalah dependency/network/credential, bukan route UI.

### Login gagal

Login melakukan dua pemeriksaan: password diverifikasi Supabase Auth, lalu user dengan email yang sama harus ada di tabel Prisma `User`. Periksa bahwa identity Supabase dan row Prisma sudah tersinkron.

### `NEXTAUTH_URL` kosong atau tidak valid

Isi `NEXTAUTH_URL` dengan URL lengkap. Fallback di `next.config.mjs` membantu build, tetapi konfigurasi deployment tetap sebaiknya eksplisit.

### Data listing tiba-tiba dummy

`useListings` memakai `dummyListings` sebagai fallback ketika request atau parsing API gagal. Periksa error server/database terlebih dahulu; fallback ini sengaja menjaga UI tetap tampil tetapi dapat menyamarkan kegagalan integrasi.
