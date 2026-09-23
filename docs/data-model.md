# Model Data dan Migrasi

Schema utama berada di `prisma/schema.prisma`. Database provider adalah PostgreSQL dan connection URL memakai `DATABASE_URL` serta `DIRECT_URL`.

## Entitas

### `User`

Menyimpan identitas aplikasi dan role:

- `id`, `email`, `username`, `fullName`;
- `password` nullable untuk fleksibilitas, tetapi login aktual memverifikasi Supabase Auth;
- `avatarUrl`, `isVerified`, timestamp;
- relasi ke admin profile, listing sebagai seller, transaksi sebagai buyer/seller/admin, review, dan chat.

Role:

```text
USER | ADMIN | SUPER_ADMIN
```

Buyer dan seller bukan role terpisah. Keduanya memakai `USER`; konteksnya ditentukan oleh relasi transaksi/listing.

### `AdminProfile`

Profile tambahan untuk user admin:

- `fee` dan `bankAccounts`;
- `bio`, `activeHours`, `trustScore`, `responseTime`, `totalSuccess`;
- `isActive`, `joinedAt`.

`userId` unique sehingga satu user hanya memiliki satu admin profile. Endpoint publik admin hanya mengembalikan field yang diperlukan UI. `fee` tidak dikembalikan oleh DTO transaksi.

### `Listing`

Menyimpan katalog akun game:

- owner melalui `sellerId`;
- `title`, `game`, `price`, `description`;
- `details` sebagai JSON fleksibel;
- `images` sebagai array string;
- `status`, `isFeatured`, `viewCount`, timestamp.

Status:

```text
AVAILABLE | IN_TRANSACTION | SOLD | INACTIVE
```

### `Transaction`

Mengikat satu listing, buyer, seller, dan admin:

- `listingId`, `buyerId`, `sellerId`, `adminId`;
- `price`, `platformFee`, `adminFee`;
- `status`, `notes`, `disputeReason`;
- `proofUrls` sebagai array URL/string;
- `logs` sebagai array JSON untuk timeline;
- `checklist` sebagai JSON untuk handover;
- timestamp;
- relasi ke review dan chat message.

Status:

```text
PENDING_PAYMENT
PAYMENT_CONFIRMED
IN_HANDOVER
PENDING_BUYER_CONFIRM
COMPLETED
DISPUTED
CANCELLED
```

### `Payment`

Satu transaksi dapat memiliki paling banyak satu Payment QRIS Midtrans Sandbox. `amount` adalah snapshot server-side dari `price + platformFee + adminFee`; `orderId` deterministik dan `transactionId`/`orderId` memiliki unique constraint. URL QR, identity transaksi provider, status, expiry, dan waktu settlement disimpan tanpa mengekspos field internal provider melalui DTO buyer. Foreign key `Restrict` mengharuskan Payment dihapus sebelum Transaction.

### `Review`

Review menghubungkan transaksi, giver, receiver, rating, comment, dan `ReviewType`:

```text
BUYER_TO_SELLER | BUYER_TO_ADMIN | SELLER_TO_ADMIN
```

Model sudah ada, tetapi route/API dan UI review database belum tersedia pada branch ini.

### `ChatMessage`

Menyimpan `transactionId`, `senderId`, `message`, dan `createdAt`. Sender harus menjadi peserta transaksi melalui guard di route chat.

## Relasi

```text
User 1──N Listing
User 1──N Transaction sebagai buyer
User 1──N Transaction sebagai seller
User 1──N Transaction sebagai admin
Listing 1──N Transaction
Transaction 1──0..1 Payment
Transaction 1──N ChatMessage
Transaction 1──N Review
User 1──1 AdminProfile (opsional)
```

## Migration yang tersedia

1. `20260915151821_init`: membuat enum, tabel, unique index, dan foreign key seluruh model awal.
2. `20260915154349_hapus_whatsapp_from_user`: menghapus kolom `whatsapp` dari tabel `User`.
3. `20260922100000_add_midtrans_qris_payment`: menambah Payment QRIS Sandbox secara additive dengan one-to-one, positive amount CHECK, dan Restrict cleanup.

Migration kedua penting karena beberapa UI/dummy/type lama masih merujuk `whatsapp`. Rujukan tersebut perlu dihapus atau diganti sebelum halaman direktori admin dipindahkan ke database.

## Gap model terhadap target produk

Schema saat ini belum memiliki model terpisah untuk:

- payment proof sebagai record dengan metadata;
- dispute dengan status/resolution/actor;
- transaction activity sebagai tabel audit;
- credential vault akun game;
- attachment chat;
- notification.

Field `proofUrls`, `logs`, `checklist`, dan `disputeReason` dapat menjadi transisi awal, tetapi belum memberi constraint, auditability, atau access policy sekuat model relasional khusus.

## Rekomendasi sebelum production

- Tambahkan constraint/rules server untuk rating 1-5 dan review unik per pasangan transaksi/target.
- Tambahkan index untuk foreign key dan query transaksi berdasarkan buyer/seller/admin.
- Pisahkan `PaymentProof`, `Dispute`, `TransactionActivity`, serta vault credential dari JSON umum jika fitur benar-benar diaktifkan.
- Jangan menyimpan password akun game sebagai plain text; gunakan vault dengan encryption dan akses minimum.
- Buat kebijakan lifecycle listing yang eksplisit untuk `COMPLETED` dan `CANCELLED`.
