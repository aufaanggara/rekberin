# Alur Fitur

Dokumen ini membedakan alur yang sudah berjalan di API dari alur target yang masih berupa UI/demo.

## Browse dan listing

```text
Pengunjung
  └─ /listings
       └─ GET /api/listings
            └─ pilih listing
                 └─ /listings/[id]
                      └─ GET /api/listings/[id]
```

Marketplace explorer menggunakan `useListings`. Jika request gagal, hook mengisi dummy data sebagai fallback. Detail listing juga memiliki fallback berdasarkan ID dummy.

Seller yang sudah login dapat membuka `/listings/new` dan mengirim form ke `POST /api/listings`. File image dibaca sebagai data URL di browser, lalu dikirim sebagai array string; belum ada penyimpanan UploadThing/object storage.

## Register, login, dan role

```text
/register
  └─ POST /api/auth/register
       ├─ validasi Zod
       ├─ cek email/username di Prisma
       ├─ createUser di Supabase Auth
       └─ create User role USER di Prisma

/login
  └─ NextAuth Credentials
       ├─ signInWithPassword di Supabase Auth
       ├─ cari User berdasarkan email di Prisma
       └─ JWT: userId + role
```

Middleware melindungi `/user`, `/admin`, dan `/listings/new`. Route API juga memverifikasi session di server, sehingga UI guard bukan satu-satunya lapisan keamanan.

## Membuat transaksi: alur aktual

```text
Buyer login
  ↓
Buka detail listing AVAILABLE
  ↓
BuyPanel → GET /api/admins
  ↓
Pilih admin aktif
  ↓
POST /api/transactions { listingId, adminId }
  ↓
Prisma transaction:
  claim AVAILABLE → IN_TRANSACTION
  create Transaction → PENDING_PAYMENT
  ↓
Redirect /user/transactions/[id]
```

Guard penting:

- buyer harus ber-role `USER`;
- seller tidak boleh membeli listing sendiri;
- admin harus aktif dan memiliki role admin;
- konflik perebutan listing menghasilkan `409`;
- buyer, seller, dan admin yang ditugaskan dapat membaca detail transaksi;
- user lain mendapat `404`.

## State transaksi

State model produk yang direncanakan:

```text
PENDING_PAYMENT
  → PAYMENT_CONFIRMED
  → IN_HANDOVER
  → PENDING_BUYER_CONFIRM
  → COMPLETED
```

Exceptional state yang direncanakan:

```text
state aktif → DISPUTED
state aktif → CANCELLED
```

Pada implementasi branch saat ini, API hanya membuat transaksi pada `PENDING_PAYMENT`. Tidak ada route mutation untuk state sesudahnya. Timeline UI dapat membaca log historis bila log tersebut sudah ada, tetapi log lanjutan belum dapat dibuat melalui endpoint publik.

## Dashboard

### User

- `/user/transactions` mengambil transaksi API dan memfilter secara server melalui endpoint berdasarkan buyer/seller/admin, kemudian menampilkan konteks buyer/seller.
- `/user/transactions/[id]` mengambil session, memastikan viewer adalah buyer atau seller, lalu memilih `BuyerTransactionView` atau `SellerTransactionView`.
- `/user` adalah dashboard overview legacy yang masih memakai `dummyListings`, `dummyTransactions`, dan Zustand.

### Admin

- `/admin/transactions` mengambil transaksi API lalu memilih transaksi yang `adminId`-nya sama dengan admin session.
- `/admin/transactions/[id]` meminta detail API dan memastikan viewer adalah admin yang ditugaskan.
- `/admin` masih dashboard overview dummy dengan statistik, dispute, dan status demo.

## Chat transaksi

```text
TransactionChat mount
  ├─ GET /api/transactions/[id]/messages
  ├─ polling GET setiap 5 detik
  └─ POST pesan saat submit
```

Pesan hanya dapat dibaca/dikirim oleh buyer, seller, atau admin transaksi. Chat ditutup server dan UI ketika status `COMPLETED` atau `CANCELLED`.

Catatan implementasi:

- UI memiliki selector role untuk kebutuhan demo/testing; identity aktual pada server tetap berasal dari session.
- UI dapat memilih gambar, tetapi payload saat ini tidak menyimpan gambar; hanya teks placeholder yang dikirim.
- Tidak ada WebSocket; keputusan MVP adalah polling.

## Payment QRIS Midtrans Sandbox

```text
Buyer membuka transaksi PENDING_PAYMENT
  ↓
GET /api/transactions/[id]/payment
  ├─ 404 kosong awal (UI tetap tanpa error)
  └─ payment tersimpan → tampilkan QRIS yang sama
  ↓
POST /api/transactions/[id]/payment
  ├─ hitung price + platformFee + adminFee dari database
  ├─ pulihkan status berdasarkan order ID deterministik atau charge QRIS
  └─ kembalikan DTO payment buyer-only
  ↓
POST /api/transactions/[id]/payment/sync setiap ≥10 detik saat pending
  atau POST /api/webhooks/midtrans
  ↓
settlement → Payment SETTLEMENT, Transaction PAYMENT_CONFIRMED
expire/deny/cancel/failure → Payment terminal, Transaction CANCELLED,
listing AVAILABLE
```

Technical provider errors remain operational errors: they do not mark buyer failure or release the listing. Seller/admin only see transaction status and never receive QR/payment identity.

## Aksi escrow yang belum terhubung

Beberapa komponen visual sudah ada, tetapi belum menjadi alur API:

| Fitur | Kondisi |
|---|---|
| Payment modal | QRIS Midtrans Sandbox, server expiry countdown, and provider polling |
| Payment proof | UI lama/dummy; belum ada endpoint atau model PaymentProof |
| Handover/vault | Status handover, audit log, dan penyelesaian transaksi sudah persisten; credential vault masih prototype/local |
| Admin status action | `ActionPanel` memanggil mutation server untuk memulai handover setelah pembayaran terkonfirmasi |
| Buyer confirm | `POST /api/transactions/[id]/handover` menyelesaikan transaksi dan menandai listing `SOLD` secara atomik |
| Dispute | Modal/store lokal; `disputeReason` schema ada tetapi belum ada route |
| Review/rating | Model Prisma dan dummy UI ada; endpoint belum ada |
