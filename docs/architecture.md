# Arsitektur Aplikasi

## Gambaran lapisan

```text
Browser
  │
  ├─ Next.js App Router pages
  ├─ Client components + hooks + parser Zod
  │
  └─ Next.js Route Handlers (/app/api)
       │
       ├─ NextAuth session / Supabase Auth
       ├─ Validasi Zod dan authorization
       ├─ Service/DTO di lib/
       └─ Prisma Client
             │
             └─ PostgreSQL/Supabase
```

UI lama masih memiliki jalur kedua untuk demo:

```text
Page/component lama
  └─ data/dummy.ts + store/useStore.ts + localStorage
```

Karena kedua jalur masih hidup, data pada dashboard overview, direktori admin, dan beberapa modal dapat berbeda dari data API.

## Teknologi dan tanggung jawab

| Komponen | Lokasi | Tanggung jawab |
|---|---|---|
| App Router | `app/` | Route halaman dan route handler API |
| Auth | `lib/auth.ts`, `app/api/auth/`, `middleware.ts` | Credentials, JWT, role guard |
| Supabase | `lib/supabase.ts` | Verifikasi password dan admin Auth API saat register |
| Prisma | `lib/prisma.ts`, `prisma/` | Akses PostgreSQL, schema, migration, seed |
| Listing service | `lib/listings.ts` | Include seller, normalisasi JSON lama, DTO listing |
| Transaction service | `lib/transactions.ts` | Guard transaksi, atomic listing claim, DTO transaksi |
| Client hooks | `hooks/` | Fetch data tanpa cache dan state loading/error |
| View model | `lib/transaction-view-model.ts` | Membentuk timeline/checklist yang aman dirender UI |
| Global demo state | `store/useStore.ts` | Dummy listing/transaksi/chat/vault untuk UI lama |
| Design system | `components/ui/`, `app/globals.css`, `tailwind.config.ts` | Button, Card, Badge, warna, layout |
| PWA | `app/manifest.ts`, `public/sw.js`, provider service worker | Installable shell dan offline fallback |
| CI | `.github/workflows/ci.yml` | `npm ci`, typecheck, build |

## Route map

### Halaman

| Route | Akses | Sumber data saat ini |
|---|---|---|
| `/` | Publik | Dummy featured/stats pada komponen landing |
| `/login` | Publik | NextAuth Credentials |
| `/register` | Publik | `POST /api/auth/register` |
| `/listings` | Publik | API listing melalui `useListings`, fallback dummy |
| `/listings/[id]` | Publik | API listing detail, review masih dummy |
| `/listings/new` | `USER` | API create listing |
| `/rekber` | Publik | Dummy admin |
| `/rekber/[username]` | Publik | Dummy admin dan review |
| `/user` | Session | Dummy dashboard overview |
| `/user/transactions` | Session | API transaksi |
| `/user/transactions/[id]` | Buyer/seller peserta | API transaksi + chat API |
| `/admin` | `ADMIN`/`SUPER_ADMIN` | Dummy dashboard overview |
| `/admin/transactions` | `ADMIN`/`SUPER_ADMIN` | API transaksi, difilter berdasarkan `adminId` di client |
| `/admin/transactions/[id]` | Admin yang ditugaskan | API transaksi, UI read-only |
| `/tentang-kami` | Publik | Konten statis |
| `/offline` | Publik/service worker | Konten statis |

### API

Route API yang tersedia didokumentasikan lengkap di [api.md](api.md):

- `/api/auth/[...nextauth]`
- `/api/auth/register`
- `/api/admins`
- `/api/listings`
- `/api/listings/[id]`
- `/api/transactions`
- `/api/transactions/[id]`
- `/api/transactions/[id]/messages`

## Alur data transaksi

1. `BuyPanel` mengambil admin aktif dari `/api/admins`.
2. Buyer mengirim `listingId` dan `adminId` ke `POST /api/transactions`.
3. Route membaca session dari NextAuth dan memvalidasi buyer, listing, admin, serta status listing.
4. `createTransactionForBuyer` menjalankan update listing dan pembuatan transaksi dalam satu `prisma.$transaction`.
5. `updateMany` bersyarat pada status `AVAILABLE` memastikan hanya satu request bersamaan yang menang.
6. Response dipetakan menjadi DTO publik oleh `toTransactionApiDto`.
7. Hook `useTransactions` mengambil daftar/detail transaksi, lalu view model membangun timeline untuk role buyer, seller, atau admin.

## Auth dan authorization

1. Register memvalidasi body dengan Zod.
2. Route memeriksa duplikasi email/username di Prisma.
3. Supabase Auth membuat identity; Prisma membuat profil `User` ber-role `USER`.
4. Login memakai NextAuth Credentials. Password diverifikasi Supabase Auth; role dan ID diambil dari Prisma.
5. Callback JWT menyimpan `role` dan `userId`; callback session mengekspos keduanya ke client/server.
6. Middleware mewajibkan token untuk `/user`, `/admin`, dan `/listings/new`.
7. Middleware membatasi `/admin` berdasarkan role dan `/listings/new` ke `USER`. Route API tetap melakukan pemeriksaan server-side sendiri.

## UI dan state

Komponen transaksi yang terhubung API adalah `BuyerTransactionView`, `SellerTransactionView`, dan `AdminTransactionView`. Komponen tersebut sengaja menampilkan status read-only untuk aksi escrow lanjutan.

Sebaliknya, `store/useStore.ts` masih mengelola:

- transaksi dan listing dummy;
- vault credential di memory;
- aksi bayar/selesai/dispute/refund lokal;
- BroadcastChannel dan auto-reply chat demo;
- listing buatan user di localStorage.

Store ini bukan sumber kebenaran untuk transaksi yang dibuat lewat API dan perlu dipensiunkan atau dipisahkan jelas sebelum production.

## PWA dan visual

- `ServiceWorkerRegister` mendaftarkan `/sw.js` setelah event `load`.
- Navigasi memakai strategi network-first dengan fallback cache atau `/offline`.
- API dan route auth tidak dicache.
- Asset static memakai cache-first.
- Landing menggunakan Lenis, GSAP, custom cursor, dan Three.js scene. Three.js sebaiknya tetap client-only ketika dipakai agar tidak mengganggu prerender.
