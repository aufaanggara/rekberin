# Kontrak API

Semua response sukses memakai JSON. Pesan error utama memakai bentuk `{ "error": "..." }`, kecuali endpoint chat yang saat ini memiliki beberapa pesan error berbahasa Inggris.

## Ringkasan endpoint

| Method dan path | Auth | Perilaku aktual |
|---|---|---|
| `POST /api/auth/register` | Publik | Membuat identity Supabase dan profil Prisma `USER` |
| `GET/POST /api/auth/[...nextauth]` | Sesuai flow NextAuth | CSRF, credentials callback, session, signout |
| `GET /api/admins` | Publik | Mengembalikan admin/super admin dengan profile aktif |
| `GET /api/listings` | Publik | Semua listing, urut `createdAt desc`, dengan seller publik |
| `POST /api/listings` | Session `USER` | Membuat listing atas nama user session |
| `GET /api/listings/[id]` | Publik | Detail listing atau `404` |
| `POST /api/transactions` | Session `USER` | Membuat transaksi dan claim listing secara atomik |
| `GET /api/transactions` | Session | Transaksi saat user adalah buyer, seller, atau admin |
| `GET /api/transactions/[id]` | Session peserta | Detail; non-peserta menerima `404` |
| `GET /api/transactions/[id]/messages` | Session peserta | Daftar pesan, default maksimal 50 |
| `POST /api/transactions/[id]/messages` | Session peserta | Menyimpan pesan 1-2000 karakter |

Belum ada endpoint `PATCH`/`POST` untuk mengubah status transaksi setelah dibuat, upload bukti pembayaran, QRIS, vault, dispute, review, atau mutation listing.

## Auth register

### Request

```json
{
  "fullName": "Nama Pengguna",
  "username": "nama_pengguna",
  "email": "user@example.com",
  "password": "minimal 8 karakter"
}
```

Aturan validasi:

- `fullName`: 2-120 karakter;
- `username`: 3-30 karakter alfanumerik/underscore;
- `email`: email valid, dinormalisasi lowercase;
- `password`: 8-128 karakter.

### Response sukses `201`

```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "username": "nama_pengguna",
    "fullName": "Nama Pengguna",
    "role": "USER"
  }
}
```

Jika profil Prisma gagal dibuat setelah identity Supabase dibuat, route mencoba menghapus identity tersebut.

## Admin directory

### `GET /api/admins`

Hanya user dengan role `ADMIN` atau `SUPER_ADMIN` dan `AdminProfile.isActive = true` yang dikembalikan. `id` pada response adalah **`User.id`**, bukan `AdminProfile.id`.

```json
{
  "admins": [
    {
      "id": "user-id",
      "username": "admin_rekber",
      "fullName": "Admin Rekber",
      "avatarUrl": null,
      "role": "ADMIN",
      "isVerified": true,
      "adminProfile": {
        "activeHours": "08:00 - 22:00",
        "trustScore": 95,
        "responseTime": 5,
        "totalSuccess": 42,
        "isActive": true
      }
    }
  ]
}
```

## Listings

### `POST /api/listings`

Membutuhkan session dengan role `USER`. `sellerId` tidak boleh dikirim client; route selalu memakai user dari session.

```json
{
  "title": "Akun eFootball OVR tinggi",
  "game": "eFootball",
  "price": 250000,
  "description": "Deskripsi listing minimal 10 karakter.",
  "details": {
    "overall": 90,
    "league": "Division 1",
    "coins": 1000,
    "gp": 5000,
    "players": ["Messi", "Ronaldo"],
    "notes": "Catatan akun",
    "loginMethod": "Konami ID",
    "isNominus": true,
    "cardTypes": ["Epic"],
    "hasWarranty": true,
    "region": "Indonesia"
  },
  "images": ["/screenshots/efootball_89.jpg"]
}
```

Validasi server membatasi harga maksimal 2 miliar, deskripsi maksimal 5000 karakter, maksimal 8 image string, dan ukuran tiap string maksimal 5.000.000 karakter. Form saat ini mengubah file lokal menjadi data URL; belum ada upload object storage aktif.

### Response `201`

```json
{
  "listing": {
    "id": "...",
    "sellerId": "...",
    "title": "...",
    "game": "eFootball",
    "price": 250000,
    "description": "...",
    "details": {},
    "images": [],
    "status": "AVAILABLE",
    "isFeatured": false,
    "viewCount": 0,
    "createdAt": "2026-09-21T00:00:00.000Z",
    "updatedAt": "2026-09-21T00:00:00.000Z",
    "seller": {}
  }
}
```

`GET /api/listings` dan `GET /api/listings/[id]` mengembalikan bentuk listing yang sama. Detail JSON lama dinormalisasi oleh `normalizeListingDetails`, termasuk fallback dari key legacy seperti `rating`, `division`, dan `legends`.

## Transactions

### `POST /api/transactions`

Membutuhkan session ber-role `USER`.

```json
{
  "listingId": "listing-id",
  "adminId": "admin-user-id"
}
```

Guard yang berlaku:

- listing harus ada dan berstatus `AVAILABLE`;
- buyer tidak boleh membeli listing miliknya sendiri;
- admin harus ber-role `ADMIN`/`SUPER_ADMIN`;
- admin harus memiliki profile aktif;
- body harus valid.

Operasi dilakukan di dalam satu Prisma transaction:

1. membaca listing dan admin;
2. menjalankan policy guard;
3. mengubah listing secara conditional dari `AVAILABLE` ke `IN_TRANSACTION`;
4. hanya jika satu row berhasil di-claim, membuat transaksi dengan status `PENDING_PAYMENT`.

Jika dua buyer berebut listing yang sama, satu request mendapat `201` dan request lainnya mendapat `409`.

### `GET /api/transactions`

Membutuhkan session. Response berisi semua transaksi yang memiliki user session pada salah satu field `buyerId`, `sellerId`, atau `adminId`, diurutkan dari yang terbaru.

### `GET /api/transactions/[id]`

Membutuhkan session. User harus menjadi buyer, seller, atau admin yang ditugaskan. Untuk mencegah kebocoran keberadaan transaksi, user lain mendapat `404`, bukan detail authorization yang berbeda.

Field penting response:

```json
{
  "transaction": {
    "id": "...",
    "listingId": "...",
    "buyerId": "...",
    "sellerId": "...",
    "adminId": "admin-user-id",
    "price": 250000,
    "platformFee": 500,
    "adminFee": 1000,
    "status": "PENDING_PAYMENT",
    "notes": null,
    "disputeReason": null,
    "proofUrls": [],
    "logs": [{"action": "TRANSACTION_CREATED", "actorId": "...", "timestamp": "..."}],
    "checklist": [],
    "listing": {},
    "buyer": {},
    "seller": {},
    "admin": {"adminProfile": {}}
  }
}
```

DTO publik sengaja tidak mengembalikan data privat seperti `AdminProfile.fee` dan password.

## Chat transaksi

### `GET /api/transactions/[id]/messages?limit=50`

Hanya peserta transaksi yang dapat membaca pesan. `limit` dibatasi 1-100 dan default 50. Pesan dikembalikan urut `createdAt asc`.

### `POST /api/transactions/[id]/messages`

```json
{
  "message": "Pesan buyer, seller, atau admin"
}
```

Pesan hanya dapat dibuat ketika status transaksi bukan `COMPLETED` atau `CANCELLED`. Sender selalu berasal dari session, bukan dari body request.

Komponen chat mengirim polling setiap 5 detik. Attachment yang dipilih UI belum dikirim sebagai binary/URL; request hanya mengirim placeholder teks `[Lampiran Foto/Screenshot]`.

## Status code umum

| Status | Makna |
|---:|---|
| `200` | Request berhasil |
| `201` | Resource berhasil dibuat |
| `400` | Body atau business input tidak valid |
| `401` | Session/login diperlukan |
| `403` | Role tidak diizinkan |
| `404` | Resource tidak ada atau user bukan peserta |
| `409` | Konflik state, misalnya listing sudah diambil atau chat sudah ditutup |
| `500` | Error internal |
