# Issue 02 — Rencana Implementasi Midtrans Dynamic QRIS (Sandbox)

Status dokumen: rencana implementasi; belum mengubah kode aplikasi.

Dokumen ini merencanakan integrasi QRIS dinamis Midtrans ke alur transaksi
Rekberin yang tersimpan di PostgreSQL. Targetnya hanya Sandbox dan Core API.
Nilai file .env lokal tidak dibaca atau disalin ke dokumen ini.

## 1. Keputusan ringkas

- Buyer yang sudah membuat Transaction mendapatkan satu Payment QRIS dinamis
  Midtrans untuk transaksi tersebut.
- Nominal yang dikirim ke provider selalu dihitung server dari transaksi tersimpan:

  ~~~text
  amount = price + platformFee + adminFee
  ~~~

- Server membuat QR melalui Core API dengan payment_type qris dan acquirer gopay,
  lalu menyimpan identitas provider, URL QR, nominal, status, dan expiry.
- Buyer melihat QR, nominal, dan expiry dari data server. Browser tidak pernah
  memanggil Midtrans dengan Server Key.
- Webhook yang signature-nya valid dan Get Status API memakai satu fungsi
  rekonsiliasi status yang sama. Webhook berulang harus idempotent.
- settlement mengubah Transaction menjadi PAYMENT_CONFIRMED dan membiarkan Listing
  tetap IN_TRANSACTION untuk pekerjaan berikutnya.
- expire, deny, cancel, dan failure yang diterima secara sah dianggap kegagalan
  pembayaran terminal: Payment menjadi terminal, Transaction menjadi CANCELLED,
  dan Listing dikembalikan ke AVAILABLE secara atomik.
- Error teknis provider, timeout, DNS, HTTP 5xx, JSON tidak valid, atau mismatch
  respons tidak dianggap buyer gagal membayar. State tetap PENDING_PAYMENT dan
  error dikembalikan sebagai error operasional yang dapat dicoba lagi.
- v1 memakai tepat satu Payment per Transaction. Percobaan baru setelah terminal
  failure membuat transaksi baru, bukan menimpa identitas pembayaran lama.

## 2. Batas scope Issue 02

### Termasuk

1. Konfigurasi kredensial Midtrans Sandbox dan URL notification yang dapat
   dijangkau dari internet.
2. Charge QRIS dinamis melalui Midtrans Core API.
3. Perhitungan server-side dan validasi nominal price + platformFee + adminFee.
4. Penyimpanan identitas Payment dan status provider.
5. Tampilan QR, nominal, dan expiry 15 menit di halaman transaksi buyer.
6. Webhook notification, verifikasi signature, deduplikasi, dan sinkronisasi
   fallback melalui Get Status API.
7. Pemetaan status provider ke status Payment, Transaction, dan Listing.
8. Test unit, test database, HTTP E2E dengan provider yang di-mock, dan verifikasi
   manual di Sandbox.

### Tidak termasuk

Scope berikut sengaja tidak dikerjakan pada Issue 02:

- Production/live Midtrans, production credential, deployment pembayaran live,
  dan klaim bahwa pembayaran sudah production-ready.
- Gateway lain atau metode lain seperti Virtual Account, kartu, standalone
  GoPay wallet, ShopeePay, dan transfer manual. gopay di sini hanya acquirer
  QRIS Midtrans sesuai konfigurasi issue.
- Refund, chargeback, pencairan dana, payout, atau automatic settlement bisnis.
  Penerimaan status provider settlement hanya dipakai sebagai konfirmasi
  pembayaran; tidak ada proses payout atau settlement internal otomatis.
- Handover akun, credential vault, checklist, buyer confirmation, dan perpindahan
  status setelah PAYMENT_CONFIRMED.
- Dispute, resolusi sengketa, atau perubahan status DISPUTED.
- Chat dan attachment chat.
- Payment-proof upload atau verifikasi bukti pembayaran manual. Webhook Midtrans
  adalah sumber status pada scope ini; tidak ada model PaymentProof.

> Catatan: konteks lama menyebut payment-proof upload, tetapi brief Issue 02 yang
> berlaku menetapkan upload bukti pembayaran sebagai out of scope.

## 3. Kondisi repository saat ini

- Aplikasi menggunakan Next.js 14 App Router, Prisma 6, dan PostgreSQL.
- POST /api/transactions hanya menerima listingId dan adminId. Server meng-claim
  listing dari AVAILABLE ke IN_TRANSACTION, lalu membuat Transaction dengan
  PENDING_PAYMENT dalam satu Prisma transaction.
- Model Transaction sudah menyimpan price, platformFee, dan adminFee.
- TransactionFeeSummary sudah menghitung total buyer dengan rumus yang sama, tetapi
  itu hanya presentasi client; sumber kebenaran Payment harus tetap DB dan service
  server.
- components/dashboard/PaymentModal.tsx masih placeholder: menggunakan Zustand,
  QR visual palsu, countdown 24 jam, selector VA/GoPay, dan tombol simulasi.
- components/dashboard/BuyerTransactionView.tsx masih read-only untuk payment.
  GET transaksi belum memiliki route Payment.
- Belum ada model Payment, endpoint payment, webhook Midtrans, atau .env.example.
- .env di-ignore oleh repository. Nilainya tidak boleh dibaca, dilog, atau
  dimasukkan ke contoh konfigurasi.

## 4. Rujukan resmi Midtrans

Implementasi harus mengikuti dokumentasi resmi berikut dan tidak menambah klaim
provider yang tidak didukung dokumentasi:

- [QRIS — Core API charge dan response](https://docs.midtrans.com/reference/qris)
  menjelaskan POST https://api.sandbox.midtrans.com/v2/charge, request QRIS,
  acquirer, action URL QR, dan status QRIS.
- [Get Transaction Status](https://docs.midtrans.com/reference/get-transaction-status)
  menjelaskan GET /v2/{order_id}/status untuk mengambil status transaksi.
- [HTTP(S) Notification / Webhooks](https://docs.midtrans.com/docs/https-notification-webhooks)
  menjelaskan payload notification, signature_key, verifikasi signature, dan
  respons HTTP 200 setelah notification diproses.
- [Transaction Status](https://docs.midtrans.com/reference/transaction-status)
  mendefinisikan pending, settlement, deny, cancel, expire, dan failure yang
  menjadi dasar mapping di rencana ini.
- [API Authorization & Headers](https://docs.midtrans.com/docs/api-authorization-headers)
  menjelaskan Basic Auth dengan Server Key sebagai username dan password kosong.
- [Perbedaan Server Key dan Client Key](https://docs.midtrans.com/docs/whats-the-difference-between-server-key-and-client-key-how-do-i-access-them)
  menjelaskan bahwa Client Key digunakan untuk token kartu, sedangkan Server Key
  digunakan untuk panggilan API server-side lainnya.
- [Charge Transactions dan custom expiry](https://docs.midtrans.com/reference/charge-transactions-1)
  menjadi rujukan untuk parameter expiry pada transaksi pending, termasuk QRIS.

## 5. Target alur end-to-end

~~~mermaid
flowchart TD
  A["Buyer membuka transaksi PENDING_PAYMENT"] --> B["POST /api/transactions/:id/payment"]
  B --> C["Server membaca Transaction + menghitung price + platformFee + adminFee"]
  C --> D["POST Midtrans /v2/charge dengan QRIS GoPay Sandbox"]
  D --> E["Simpan Payment: orderId, providerTransactionId, QR URL, amount, expiry, PENDING"]
  E --> F["Kembalikan QR, nominal, expiry ke buyer"]
  F --> G["Buyer membayar lewat QRIS Sandbox"]
  G --> H["Midtrans webhook atau server Get Status API"]
  H --> I{"Status provider"}
  I -->|"pending"| J["Tetap PENDING_PAYMENT + Listing IN_TRANSACTION"]
  I -->|"settlement"| K["Payment SETTLEMENT + Transaction PAYMENT_CONFIRMED"]
  I -->|"expire / deny / cancel / failure"| L["Payment terminal + Transaction CANCELLED + Listing AVAILABLE"]
  I -->|"network / HTTP / parse error"| M["Tidak ubah payment failure; tetap pending dan retry"]
~~~

### Invariant transaksi

1. Buyer, Transaction.id, price, platformFee, dan adminFee berasal dari session/DB
   server, bukan body browser.
2. gross_amount request Midtrans harus sama persis dengan jumlah integer Rupiah
   yang dihitung server.
3. Setelah Payment dibuat, perubahan fee tidak boleh mengubah nominal Payment.
   Jika fee mutation belum ada, service harus menolak pembuatan ulang dengan
   nominal berbeda dan memerlukan transaksi baru.
4. Hanya settlement yang boleh mengonfirmasi pembayaran. QR yang terlihat,
   callback client, atau bukti visual scan bukan bukti settlement.

## 6. Konfigurasi environment

### .env lokal/server

Tambahkan nilai nyata hanya pada environment lokal atau deployment Sandbox. Jangan
commit file ini dan jangan menampilkan nilai Server Key pada log, screenshot, test
output, atau bundle browser.

~~~dotenv
MIDTRANS_ENVIRONMENT=sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-REPLACE_WITH-SANDBOX_KEY
MIDTRANS_NOTIFICATION_URL=https://public.example.test/api/webhooks/midtrans
MIDTRANS_QRIS_ACQUIRER=gopay
MIDTRANS_QRIS_EXPIRY_MINUTES=15
~~~

Aturan:

- MIDTRANS_ENVIRONMENT wajib sandbox untuk Issue 02. Service tidak boleh memilih
  production URL pada issue ini.
- MIDTRANS_SERVER_KEY adalah server-only secret. Jangan pernah membuat
  NEXT_PUBLIC_MIDTRANS_SERVER_KEY; nama tersebut dilarang dan harus ditolak
  dalam review.
- MIDTRANS_NOTIFICATION_URL adalah URL endpoint yang public dan dapat dipanggil
  Midtrans dari internet, idealnya HTTPS. Nama env-nya tidak memakai NEXT_PUBLIC:
  URL perlu diketahui konfigurasi Midtrans, tetapi tidak menjadikan kredensial
  tersedia di client.
- MIDTRANS_QRIS_ACQUIRER wajib divalidasi sebagai gopay pada scope ini.
- MIDTRANS_QRIS_EXPIRY_MINUTES wajib 15 pada acceptance Sandbox. Jangan menerima
  nilai nol, negatif, pecahan, atau nilai yang membuat expiry client tidak konsisten.
- Client Key tidak diperlukan untuk desain Core API QRIS ini karena tidak ada
  tokenisasi kartu, Snap.js, atau panggilan Midtrans dari browser. Jangan menambah
  MIDTRANS_CLIENT_KEY hanya untuk QRIS v1.

### .env.example

Buat template tanpa secret pada tahap implementasi berikutnya. Isi payment-only
yang harus ada adalah sebagai berikut; placeholder tidak boleh menjadi credential
yang dapat dipakai:

~~~dotenv
MIDTRANS_ENVIRONMENT=sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-your-sandbox-key
MIDTRANS_NOTIFICATION_URL=https://your-public-sandbox-host.example/api/webhooks/midtrans
MIDTRANS_QRIS_ACQUIRER=gopay
MIDTRANS_QRIS_EXPIRY_MINUTES=15
~~~

Template boleh memuat variable aplikasi existing yang memang sudah dibutuhkan,
tetapi tidak boleh memuat NEXT_PUBLIC_MIDTRANS_SERVER_KEY, nilai Server Key nyata,
atau Client Key yang tidak dipakai.

## 7. Model data Prisma yang diusulkan

Tambahkan field relasi tunggal berikut pada Transaction:

~~~prisma
payment Payment?
~~~

Tambahkan model dan enum berikut secara persis sebagai baseline v1:

~~~prisma
enum PaymentProvider {
  MIDTRANS
}

enum PaymentMethod {
  QRIS
}

enum PaymentStatus {
  PENDING
  SETTLEMENT
  EXPIRE
  DENY
  CANCEL
  FAILURE
}

model Payment {
  id                    String          @id @default(cuid())
  transactionId         String          @unique
  transaction           Transaction     @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  provider              PaymentProvider @default(MIDTRANS)
  method                PaymentMethod   @default(QRIS)
  status                PaymentStatus   @default(PENDING)
  orderId               String          @unique
  providerTransactionId String?         @unique
  providerPaymentType   String?
  amount                Int
  currency              String          @default("IDR")
  acquirer              String          @default("gopay")
  qrCodeUrl             String?
  expiresAt             DateTime?
  paidAt                DateTime?
  lastSyncedAt          DateTime?
  lastNotifiedAt        DateTime?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@index([status])
  @@index([expiresAt])
}
~~~

### Rationale field

- transactionId unique memaksa satu Payment untuk satu Transaction.
- orderId unique adalah identifier merchant yang deterministik dan dipakai untuk
  idempotensi charge/status. Contoh format internal: rekberin-{transactionId};
  server membuatnya, bukan browser.
- providerTransactionId unique menyimpan identifier Midtrans jika respons
  charge/status sudah memilikinya. Nullable karena row dapat dibuat sebelum
  provider response dipersist.
- amount adalah snapshot Rupiah yang sudah dihitung server. Webhook tidak membaca
  ulang nilai dari UI.
- qrCodeUrl menyimpan action URL QR yang dipilih dari response Midtrans. Server
  harus memvalidasi HTTPS dan host Midtrans yang diizinkan; jika URL provider
  tidak aman untuk dirender langsung, buat proxy image server-side yang tidak
  pernah meneruskan Server Key ke browser.
- expiresAt berasal dari expiry_time provider bila tersedia. Fallback yang
  dihitung server hanya dipakai untuk tampilan sementara dan harus direkonsiliasi
  oleh webhook/Get Status.
- paidAt hanya diisi ketika status provider yang sah menjadi settlement.
- lastSyncedAt dan lastNotifiedAt membantu observability dan throttle sync, bukan
  sumber kebenaran baru.
- providerPaymentType menyimpan nilai response seperti qris untuk diagnosis tanpa
  menyimpan seluruh raw payload yang tidak diperlukan.
- onDelete Restrict menjaga Payment identity tidak ikut terhapus karena
  cleanup/bug penghapusan Transaction. Test fixture harus menghapus Payment
  terlebih dahulu.

### Mengapa satu Payment per Transaction pada v1

Issue ini hanya memiliki satu metode, satu gateway, satu nominal, dan satu QRIS
payment lifecycle. Satu row dengan transactionId unique membuat constraint database
menjadi sumber kebenaran, mencegah dua QR berbeda untuk transaksi yang sama, dan
menyederhanakan deduplikasi webhook serta status reconciliation.

Jika charge mengalami timeout, v1 tidak membuat attempt kedua. Service memakai
orderId yang sama untuk Get Status terlebih dahulu. Jika Midtrans sudah membuat
transaksi, identity dapat dipulihkan; jika benar-benar belum ada, charge dapat
dilanjutkan dengan order ID yang sama sesuai kebijakan service. Jika Payment sudah
terminal, transaksi lama tidak di-reuse; buyer harus membuat transaksi baru.

Model PaymentAttempt baru diperlukan jika produk kelak membutuhkan retry dengan
order ID berbeda, beberapa provider, split payment, partial payment, atau riwayat
attempt finansial yang lengkap. Itu bukan bagian Issue 02.

### Langkah migration

1. Tambahkan enum, Payment, dan relasi Transaction.payment pada
   prisma/schema.prisma.
2. Generate migration bernama, misalnya, add_midtrans_qris_payment. Review SQL
   sebelum dijalankan; migration harus additive dan tidak mengubah row Transaction
   existing.
3. Pastikan migration membuat enum PostgreSQL, tabel Payment, unique constraint
   pada transactionId/orderId/providerTransactionId, index status dan expiresAt,
   foreign key ke Transaction, serta check positif untuk amount:

   ~~~sql
   ALTER TABLE "Payment"
     ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0);
   ~~~

4. Pada development dengan database yang benar, gunakan
   npx prisma migrate dev --name add_midtrans_qris_payment, lalu npx prisma generate.
   Pada environment deploy gunakan migration yang sudah direview melalui
   npx prisma migrate deploy; jangan memakai prisma db push sebagai pengganti
   migration produksi.
5. Jalankan npx prisma migrate status dan test database. Karena relasi memakai
   Restrict, perbarui cleanup test agar Payment dihapus sebelum Transaction.
6. Jangan backfill Payment untuk transaksi lama secara otomatis. Biarkan transaksi
   lama tetap tanpa Payment; buyer hanya dapat membuat Payment untuk transaksi yang
   masih PENDING_PAYMENT dan belum memiliki Payment.

## 8. Peta file repository

| File | Kondisi sekarang | Perubahan yang direncanakan |
|---|---|---|
| prisma/schema.prisma | Belum ada Payment | Tambah relasi Transaction.payment, enum, dan model Payment di atas. |
| prisma/migrations/<timestamp>_add_midtrans_qris_payment/migration.sql | Belum ada migration Payment | Migration additive untuk tabel, constraint, index, dan enum. |
| lib/midtrans.ts | Belum ada provider adapter | Server-only config validation, Basic Auth Sandbox, charge QRIS, get status, timeout, parser response, dan typed provider errors. |
| lib/payments.ts | Belum ada service Payment | Hitung nominal, buat/reuse Payment, advisory/row lock, mapping status, atomic Transaction/Listing transition, dan redacted audit log. |
| app/api/transactions/[id]/payment/route.ts | Belum ada endpoint | POST create/reuse QR dan GET payment detail yang terotorisasi. |
| app/api/transactions/[id]/payment/sync/route.ts | Belum ada endpoint | POST Get Status API server-side dan rekonsiliasi hasil. |
| app/api/webhooks/midtrans/route.ts | Belum ada endpoint | Public notification handler, signature verification, payload validation, idempotensi, dan HTTP acknowledgement. |
| types/payment-api.ts | Belum ada | DTO Payment publik dan error/sync result tanpa Server Key atau signature. |
| lib/payment-api-client.ts | Belum ada | Parser Zod untuk response payment dan helper request/error. |
| hooks/usePayment.ts | Belum ada | Fetch/create/sync payment dengan polling terbatas saat PENDING. |
| lib/transactions.ts | DTO transaksi existing | Pertahankan auth/participant guard; bila perlu tambahkan helper status tanpa menghitung nominal dari client. |
| types/transaction-api.ts | DTO transaksi existing | Jangan merusak kontrak transaksi; payment summary, bila digabung, harus nullable dan backward-compatible. |
| lib/transaction-api-client.ts | Parser transaksi existing | Hanya diubah bila DTO payment digabung; prefer parser payment terpisah. |
| components/dashboard/BuyerTransactionView.tsx | Payment read-only | Muat payment API untuk buyer, tampilkan action QRIS, status, expiry, dan pesan terminal. |
| components/dashboard/PaymentModal.tsx | Placeholder Zustand/QR palsu/VA/simulasi | Ganti menjadi QRIS-only, data API, countdown berbasis expiresAt, retry operasional, dan polling. |
| components/dashboard/TransactionFeeSummary.tsx | Sudah punya rumus client | Pertahankan untuk rincian tampilan; tampilkan payment.amount sebagai nominal yang dikonfirmasi server. |
| hooks/useTransactions.ts | Hanya daftar/detail transaksi | Refetch setelah status payment berubah; tidak memanggil Midtrans langsung. |
| tests/payment-flow.test.ts | Belum ada | Unit amount, request, signature, status mapping, idempotensi, dan error classification. |
| tests/payment-database.integration.test.ts | Belum ada | Constraint, one-to-one, lock, transition, release listing, duplicate/out-of-order notification. |
| tests/payment-http.e2e.ts | Belum ada | Auth boundary dan API contract dengan adapter Midtrans mock. |
| .env.example | Belum ada | Buat pada implementasi berikutnya tanpa secret; template payment ada di Section 6. |
| docs/issue-02-midtrans-qris-implementation-plan.md | File ini | Satu-satunya file yang dibuat oleh workstream dokumentasi ini. |

File store/useStore.ts, dummy transaction, dan modal legacy tidak boleh menjadi
sumber kebenaran payment. Aksi payTransaction lokal harus dihapus dari jalur
transaksi API ketika implementasi dimulai, bukan dipanggil bersamaan dengan API.

## 9. Urutan implementasi bertahap

### Tahap 0 — Guardrail dan konfigurasi

- Buat validator server-only untuk lima variable Midtrans.
- Fail fast jika environment bukan sandbox, key kosong, URL notification bukan URL
  public yang disepakati, acquirer bukan gopay, atau expiry bukan 15.
- Tambahkan .env.example tanpa secret pada perubahan implementasi, bukan pada
  workstream dokumen ini.
- Set notification URL Sandbox di konfigurasi merchant ke endpoint public yang sama
  dengan MIDTRANS_NOTIFICATION_URL.

Exit: service dapat memuat config tanpa membuat Server Key masuk client bundle;
konfigurasi tidak menyediakan jalur production.

### Tahap 1 — Schema dan migration

- Tambahkan model/enums persis Section 7.
- Jalankan migration additive dan generate Prisma Client.
- Tambahkan fixture Payment cleanup dan query helper.

Exit: migration sukses pada database development dan constraint one-to-one
terbukti melalui integration test.

### Tahap 2 — Midtrans server adapter

- Implementasikan createQrCharge(input) dan getTransactionStatus(orderId) di
  lib/midtrans.ts.
- Gunakan base URL Sandbox https://api.sandbox.midtrans.com, header JSON, dan
  Basic Auth base64(ServerKey + ":").
- Charge body harus memiliki payment_type qris, transaction_details,
  qris.acquirer gopay, custom_expiry 15 menit, dan item detail yang totalnya sama
  dengan gross amount.
- Parse response dengan schema ketat. Ambil action QR yang HTTPS dan host-nya
  diizinkan; simpan transaction_id, order_id, gross_amount, status, dan expiry_time
  bila tersedia.
- Bedakan MidtransTransportError, MidtransHttpError, MidtransResponseError, dan
  status pembayaran provider deny/failure.

Exit: unit test adapter lolos tanpa credential nyata dan error transport tidak
menghasilkan PaymentStatus.DENY atau FAILURE.

### Tahap 3 — Payment orchestration dan API

- Implementasikan perhitungan amount dari row Transaction.
- Tambahkan deterministic order ID dan lock per Transaction.
- Implementasikan POST/GET payment dengan participant authorization.
- Simpan Payment hanya setelah response provider dapat dipastikan terkait dengan
  order ID dan amount yang benar; untuk timeout unknown, recovery dilakukan lewat
  Get Status dengan order ID yang sama.

Exit: POST pertama membuat satu Payment dan POST bersamaan tidak membuat dua charge;
POST berikutnya mengembalikan identity yang sama.

### Tahap 4 — Webhook dan status synchronization

- Tambahkan route public webhook dengan signature SHA-512.
- Satukan webhook dan Get Status API ke reconcileMidtransStatus.
- Terapkan state transition atomik dan monotonic; duplicate notification menjadi
  no-op.
- Tambahkan endpoint sync yang dapat dipanggil buyer dengan throttle.

Exit: settlement, pending, terminal failure, duplicate, stale, invalid signature,
dan network error memiliki hasil yang teruji.

### Tahap 5 — DTO, hook, dan UI buyer

- Tambah DTO/parser payment tanpa raw provider payload sensitif.
- Ganti PaymentModal placeholder menjadi QRIS-only API client.
- Tampilkan breakdown existing dan amount Payment; tampilkan expiresAt dari server.
- Poll status secara terbatas ketika pending, berhenti saat terminal, lalu refetch
  GET /api/transactions/[id] agar timeline membaca PAYMENT_CONFIRMED atau
  CANCELLED dari DB.

Exit: buyer dapat melihat QR yang asli dari provider, nominal yang sama, expiry,
error operasional yang dapat di-retry, dan hasil terminal yang sesuai.

### Tahap 6 — Test, manual Sandbox, dan hardening

- Jalankan unit, integration, typecheck, HTTP E2E, dan build.
- Jalankan checklist manual Section 18.
- Audit bundle client, logs, authorization, rate/throttle, dan status PWA/cache.

Exit: Acceptance Matrix dan Definition of Done terpenuhi tanpa secrets atau
production endpoint.

## 10. Kontrak API yang diusulkan

Semua endpoint di bawah memakai response JSON. Error mengikuti konvensi repository
{ "error": "...", "code": "..." } dan tidak mengandung Server Key, signature, atau
raw provider response.

### POST /api/transactions/[id]/payment

Membuat atau mengembalikan Payment QRIS untuk satu Transaction.

Authorization: session wajib; hanya buyer dengan session.user.id sama dengan
transaction.buyerId dan role USER. Seller tidak boleh membuat QR. Admin tidak
boleh membuat QR atas nama buyer.

Request body: kosong atau {}. Field amount, price, fee, orderId, buyerId, provider,
dan method dari client ditolak atau diabaikan; nominal dan identity selalu berasal
dari server.

Success pertama, HTTP 201:

~~~json
{
  "payment": {
    "id": "payment-id",
    "transactionId": "transaction-id",
    "provider": "MIDTRANS",
    "method": "QRIS",
    "status": "PENDING",
    "orderId": "rekberin-transaction-id",
    "providerTransactionId": "midtrans-transaction-id",
    "amount": 251500,
    "currency": "IDR",
    "acquirer": "gopay",
    "qrCodeUrl": "https://provider-qr-url.example/qr.png",
    "expiresAt": "2026-09-22T10:15:00.000Z",
    "paidAt": null,
    "lastSyncedAt": null,
    "createdAt": "2026-09-22T10:00:00.000Z",
    "updatedAt": "2026-09-22T10:00:00.000Z"
  },
  "transactionStatus": "PENDING_PAYMENT",
  "created": true
}
~~~

Success idempotent HTTP 200: response shape sama dengan created false jika Payment
existing masih valid/pending atau sudah terminal. Jangan mengeluarkan QR baru untuk
Payment terminal.

Error penting:

- 401 session tidak ada.
- 403 user bukan buyer transaksi.
- 404 transaksi tidak ada atau user bukan participant sesuai kebijakan detail.
- 409 transaksi bukan PENDING_PAYMENT, Payment terminal, nominal invalid, atau
  response provider mismatch yang membutuhkan rekonsiliasi.
- 502/503 provider/network/configuration error. Response ini tidak mengubah
  Transaction menjadi CANCELLED.

### GET /api/transactions/[id]/payment

Membaca Payment yang sudah tersimpan tanpa mengekspos raw response. Tidak memanggil
Midtrans langsung; sinkronisasi eksplisit ada di endpoint berikutnya.

Authorization: hanya buyer transaksi yang boleh membaca detail Payment. Seller dan
admin boleh membaca status transaksi sesuai endpoint transaction masing-masing,
tetapi tidak menerima QR URL atau order identity pada v1.

Response { payment: { ... } }; bila belum dibuat, 404 dengan code
PAYMENT_NOT_CREATED. qrCodeUrl boleh null hanya selama response provider belum
mengembalikan action QR.

### POST /api/transactions/[id]/payment/sync

Meminta server mengambil status terbaru dari Midtrans Get Status API menggunakan
orderId atau providerTransactionId yang tersimpan, lalu memakai rekonsiliasi status
yang sama dengan webhook.

Authorization: hanya buyer transaksi. Tidak ada Midtrans request dari browser.

Response sukses: detail Payment terbaru dan transactionStatus. Jika status sudah
terminal, endpoint mengembalikan hasil tersimpan secara idempotent tanpa memanggil
provider berulang-ulang.

Provider error: kembalikan 503 dengan code MIDTRANS_UNAVAILABLE atau 502 dengan code
MIDTRANS_INVALID_RESPONSE; jangan ubah Payment menjadi FAILURE dan jangan
membatalkan Transaction. Client mempertahankan data pending dan boleh mencoba lagi
setelah backoff.

Throttle: client tidak lebih sering dari 10 detik per transaksi; server dapat
menolak sync terlalu cepat dengan 429 atau mengembalikan state tersimpan. Polling
berhenti saat SETTLEMENT, DENY, EXPIRE, CANCEL, atau FAILURE.

### POST /api/webhooks/midtrans

Endpoint public tanpa login, karena request berasal dari Midtrans. CSRF/session
check tidak diterapkan pada route ini; autentikasi digantikan signature verification.

Input minimum yang divalidasi: order_id, status_code, gross_amount,
transaction_status, signature_key, transaction_id, payment_type, currency, dan bila
ada expiry_time/settlement_time.

Alur response:

1. Parse body dengan schema.
2. Hitung dan constant-time compare signature.
3. Cari Payment berdasarkan orderId.
4. Validasi payment_type qris, currency IDR, order ID, dan nominal.
5. Jalankan reconcileMidtransStatus di bawah lock transaksi.
6. Untuk status valid dan duplicate yang sudah diproses, jawab HTTP 200 setelah
   state aman tersimpan.
7. Payload malformed, signature invalid, order/amount mismatch, atau status
   unknown tidak boleh memutasi DB; jawab error non-200 dan log ter-redact untuk
   investigasi.

### GET /api/transactions/[id] existing

Pertahankan participant access yang sudah ada. Setelah webhook/sync, response ini
harus mengembalikan Transaction.status terbaru sehingga UI timeline tidak perlu
menebak status dari Payment.

## 11. Aturan authorization

| Aktor | Buat QR | Baca QR/nominal/expiry | Sync status | Baca status Transaction |
|---|---:|---:|---:|---:|
| Buyer transaksi | Ya | Ya | Ya | Ya |
| Seller transaksi | Tidak | Tidak pada v1 | Tidak | Ya, melalui endpoint transaksi |
| Admin yang ditugaskan | Tidak | Tidak | Tidak | Ya |
| Admin lain | Tidak | Tidak | Tidak | Tidak |
| User anonim | Tidak | Tidak | Tidak | Tidak |
| Midtrans webhook | Tidak berlaku | Tidak berlaku | Tidak berlaku | Hanya melalui signature + order match |

Authorization selalu dilakukan server-side dengan session/DB. buyerId, role, adminId,
dan transactionId dari browser bukan bukti akses.

## 12. Perilaku service Midtrans

### Charge QRIS

lib/midtrans.ts harus:

1. Menolak config non-Sandbox dan key yang kosong sebelum request.
2. Menggunakan https://api.sandbox.midtrans.com/v2/charge.
3. Mengirim header Accept: application/json, Content-Type: application/json, dan
   Authorization: Basic base64(MIDTRANS_SERVER_KEY + ":").
4. Mengirim body seperti berikut, dengan nilai dinamis yang sudah dihitung server:

   ~~~json
   {
     "payment_type": "qris",
     "transaction_details": {
       "order_id": "rekberin-transaction-id",
       "gross_amount": 251500
     },
     "item_details": [
       { "id": "listing-price", "price": 250000, "quantity": 1, "name": "Harga akun" },
       { "id": "platform-fee", "price": 500, "quantity": 1, "name": "Fee platform" },
       { "id": "admin-fee", "price": 1000, "quantity": 1, "name": "Fee admin" }
     ],
     "qris": { "acquirer": "gopay" },
     "custom_expiry": {
       "expiry_duration": 15,
       "unit": "minute"
     }
   }
   ~~~

5. Memastikan item_details menjumlahkan gross_amount; item fee tidak boleh
   membuat nominal provider berbeda dari nominal UI.
6. Memilih action URL QR yang valid dari response provider dan menyimpan identity
   Midtrans. Jangan menyimpan signature_key atau raw Server Key.
7. Memakai timeout request yang bounded, misalnya 10 detik, dan tidak retry charge
   secara buta. Retry hanya boleh melalui order ID yang sama setelah Get Status.

### Get Status

Gunakan GET /v2/{order_id}/status dengan Basic Auth server-side. Parse
transaction_status, transaction_id, order_id, gross_amount, currency, expiry_time,
dan settlement_time bila tersedia. Response yang tidak cocok dengan Payment lokal
dianggap MidtransResponseError, bukan buyer payment failure.

### Klasifikasi error

| Hasil | Makna | Mutasi status |
|---|---|---|
| HTTP/network timeout, DNS, abort, 5xx | Provider tidak dapat dipastikan | Tidak ada; tetap pending |
| HTTP 4xx karena config/body/auth | Kesalahan integrasi/credential | Tidak ada; alert ops, tetap pending |
| JSON/schema/amount/order mismatch | Provider response tidak aman dipakai | Tidak ada; alert ops, tetap pending |
| Response status pending | QR dibuat dan menunggu pembayaran | Payment PENDING |
| Response status settlement | Pembayaran provider sukses | Payment SETTLEMENT, Transaction PAYMENT_CONFIRMED |
| Response status deny | Provider/FDS menolak transaksi | Payment DENY, cancel/release |
| Signed/status response expire | Pembayaran lewat expiry | Payment EXPIRE, cancel/release |
| Signed/status response cancel | Provider membatalkan transaksi | Payment CANCEL, cancel/release |
| Signed/status response failure | Provider menyatakan transaksi gagal | Payment FAILURE, cancel/release |

Perbedaan penting: status provider failure yang terverifikasi adalah status
transaksi; timeout/HTTP failure lokal bukan status provider dan tidak boleh
membatalkan buyer.

## 13. Status mapping dan state transition

| transaction_status Midtrans | Payment.status | Transaction.status | Listing.status | Aksi atomik |
|---|---|---|---|---|
| pending | PENDING | tetap PENDING_PAYMENT | tetap IN_TRANSACTION | Simpan identity/expiry, tanpa release |
| settlement | SETTLEMENT | PAYMENT_CONFIRMED | tetap IN_TRANSACTION | Isi paidAt, append PAYMENT_CONFIRMED |
| expire | EXPIRE | CANCELLED | AVAILABLE | Append PAYMENT_EXPIRED, release listing |
| deny | DENY | CANCELLED | AVAILABLE | Append PAYMENT_DENIED, release listing |
| cancel | CANCEL | CANCELLED | AVAILABLE | Append PAYMENT_CANCELLED, release listing |
| failure | FAILURE | CANCELLED | AVAILABLE | Append PAYMENT_FAILED, release listing |

Rules tambahan:

- settlement diprioritaskan untuk satu Payment yang masih pending. Setelah
  Transaction menjadi PAYMENT_CONFIRMED, notification pending/deny/expire yang
  datang terlambat tidak boleh menurunkannya atau me-release listing.
- Setelah terminal failure dan Transaction.CANCELLED, jangan membuka kembali
  transaction atau mengklaim ulang listing karena notification lama. Jika
  settlement datang setelah terminal failure, tahan sebagai anomaly dan kirim
  alert untuk rekonsiliasi manual; jangan melakukan refund/payout otomatis.
- Transition gagal bila row sudah berubah oleh request lain. Reload state dan
  perlakukan hasil akhir sebagai idempotent.
- Untuk terminal failure, update Payment, Transaction, dan Listing dalam satu
  prisma.$transaction, dengan kondisi Transaction.status = PENDING_PAYMENT dan
  Listing.status = IN_TRANSACTION agar tidak meng-overwrite state lanjutan.
- Transaction.logs hanya menyimpan event minimal: action, actor midtrans, provider
  status, timestamp, dan order id yang sudah direduksi bila perlu. Jangan
  menyimpan signature atau payload mentah.

## 14. Idempotensi dan concurrency

1. Bentuk orderId deterministik dari Transaction.id; client tidak boleh
   mengirimnya.
2. Constraint Payment.transactionId unique dan Payment.orderId unique adalah guard
   terakhir database.
3. POST /payment, webhook, dan /sync memakai lock database per Transaction.id
   (pilihan implementasi: PostgreSQL transaction advisory lock atau row lock setelah
   Payment tersedia), bukan mutex in-memory. Lock harus memiliki batas waktu dan
   provider call memiliki timeout.
4. Pada POST /payment yang mengambil lock:
   - reload Transaction dan Payment;
   - jika Payment memiliki QR/provider ID, kembalikan row tersebut;
   - jika row belum memiliki provider ID, panggil Get Status dengan order ID yang
     sama terlebih dahulu;
   - hanya jika Get Status memastikan order belum ditemukan, lakukan charge satu
     kali;
   - simpan response dalam lock dan commit.
5. Jika charge request timeout setelah Midtrans mungkin membuat transaksi, jangan
   membuat order ID baru. Request berikutnya melakukan Get Status dengan order ID
   sama untuk memulihkan identity.
6. Webhook duplicate harus mengembalikan hasil yang sama dan tidak menggandakan
   log. Gunakan status/current identity dan lastNotifiedAt hanya untuk metadata,
   bukan sebagai satu-satunya dedup key.
7. Status mapping bersifat monotonic dan menolak unknown status secara fail-closed.
8. Network error saat sync mengembalikan MIDTRANS_UNAVAILABLE, tidak mengisi
   Payment FAILURE, tidak mengubah Transaction, dan tidak me-release listing.

## 15. Verifikasi webhook dan keamanan

### Signature

Untuk legacy/Core API notification, hitung:

~~~text
SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
~~~

Gunakan nilai string gross_amount persis seperti yang diterima pada payload sebelum
normalisasi angka. Bandingkan hasil dengan signature_key menggunakan constant-time
comparison. Rumus ini harus dipertahankan sesuai
[dokumentasi verifikasi notification Midtrans](https://docs.midtrans.com/docs/https-notification-webhooks).

Signature valid saja belum cukup. Setelah signature lolos, service wajib:

- mencari Payment berdasarkan order_id;
- memastikan gross_amount sama dengan Payment.amount dalam IDR;
- memastikan payment_type adalah qris dan acquirer sesuai konfigurasi bila field
  tersedia;
- memastikan transaction_id konsisten dengan identity yang sudah tersimpan, atau
  mengisi identity pertama kali jika order dan amount cocok;
- memproses hanya status yang dikenal pada Section 13.

### Secret dan jaringan

- Server Key hanya dibaca di server route/service; tidak boleh ada import provider
  service dari component client.
- Jangan pakai NEXT_PUBLIC_MIDTRANS_SERVER_KEY, jangan menaruh key di NEXT_PUBLIC_*,
  dan jangan mengirimnya di error/telemetry.
- Webhook public harus menggunakan HTTPS dan menerima hanya JSON dengan body size
  terbatas. Signature invalid tidak pernah memutasi DB.
- Jika QR URL dirender langsung, allowlist host Midtrans dan enforce HTTPS. Jika
  perlu proxy, proxy hanya mengizinkan endpoint QR Midtrans dan menambahkan auth
  di server.
- Jangan log full notification; redaksi signature_key, email, dan identifier yang
  tidak diperlukan. Log hanya event, status, order ID terpotong, dan alasan error.
- Jangan mempercayai amount/status dari UI, query string, localStorage, Zustand,
  atau callback client.
- Response API payment hanya mengembalikan DTO yang dibutuhkan UI.
- Pertimbangkan rate limit pada POST create/sync. Lock dan order ID mencegah
  duplicate charge, tetapi rate limit tetap diperlukan untuk abuse.
- Payment detail page harus ditinjau terhadap service worker/cache agar QR/payment
  identity tidak tersimpan di cache public.

## 16. Perubahan UI yang direncanakan

### BuyerTransactionView.tsx

- Saat PENDING_PAYMENT, panggil usePayment(tx.id) dan tampilkan tombol
  Buat/Tampilkan QRIS.
- Gunakan TransactionFeeSummary untuk breakdown, tetapi label nominal bayar berasal
  dari payment.amount. Jika berbeda dari helper, tampilkan error dan jangan
  menampilkan tombol bayar.
- Tampilkan QR image/action URL, formatRupiah(payment.amount), order reference yang
  aman bila perlu, acquirer GoPay QRIS, dan expiry dalam zona waktu pengguna.
- Countdown dihitung dari expiresAt server, bukan timer 24 jam hard-code. Saat timer
  mencapai nol, UI menunggu status server dan menampilkan Menunggu sinkronisasi atau
  QRIS kedaluwarsa, bukan mengarang status lokal.
- Poll sync minimal 10 detik hanya saat pending; hentikan saat tab tidak terlihat,
  saat terminal, atau setelah error berulang.
- Setelah settlement, refetch Transaction dan tampilkan PAYMENT_CONFIRMED.
- Setelah terminal failure, tampilkan transaksi dibatalkan dan listing dilepas;
  jangan menawarkan upload proof atau metode lain.
- Error provider/network harus berbunyi sebagai masalah koneksi/status payment,
  bukan “pembayaran gagal”. Sediakan retry sync/create yang aman.

### PaymentModal.tsx

Ganti placeholder sepenuhnya:

- hapus selector VA_BCA, VA_MANDIRI, dan standalone GOPAY;
- hapus QR grid palsu, nominal/VA hard-code, timer 24 jam, useStore, dan
  payTransaction;
- hapus tombol simulasi Bayar Lunas; tidak ada aksi client yang mengonfirmasi
  payment;
- gunakan hanya data response payment API dan state loading/error/terminal;
- tetap aksesibel: role dialog, focus/close, aria-live untuk status, dan fallback
  saat QR URL tidak dapat dimuat.

### Komponen lain

- TransactionTimeline cukup membaca Transaction.status/log dari API; jangan
  menganggap QR terlihat sebagai PAYMENT_CONFIRMED.
- SellerTransactionView dan AdminTransactionView menampilkan status transaksi
  terkini; seller tidak perlu menerima QR identity pada v1.
- StatusBadge perlu label yang membedakan PENDING_PAYMENT, PAYMENT_CONFIRMED, dan
  CANCELLED; tidak perlu menambah status transaksi baru.

## 17. Strategi testing

### Unit test

Tambahkan test tanpa credential nyata untuk:

- calculatePaymentAmount({ price, platformFee, adminFee }) menghasilkan jumlah
  integer tepat dan menolak nol/negatif/overflow.
- Request charge selalu mengabaikan amount/order ID dari client.
- item_details berjumlah sama dengan gross amount.
- Config hanya menerima Sandbox, gopay, dan expiry 15.
- Parser response memilih action QR valid dan menyimpan expiry_time.
- Signature valid, signature invalid, field missing, dan constant-time compare.
- Status mapping untuk pending, settlement, expire, deny, cancel, dan failure.
- HTTP timeout/5xx/invalid JSON/mismatch tidak dipetakan ke buyer failure.
- Unknown provider status ditolak tanpa mutasi.
- duplicate settlement dan duplicate terminal event idempotent.
- stale failure sesudah settlement tidak menurunkan transaksi.

### Database integration test

Dengan fixture terisolasi:

- one Transaction dapat memiliki tepat satu Payment;
- duplicate create terkena unique constraint atau kembali sebagai idempotent;
- nominal tersimpan price + platformFee + adminFee;
- pending mempertahankan PENDING_PAYMENT + IN_TRANSACTION;
- settlement mengubah Transaction ke PAYMENT_CONFIRMED dan tidak mengubah Listing
  dari IN_TRANSACTION;
- expire/deny/cancel/failure secara atomik mengubah Transaction ke CANCELLED dan
  Listing ke AVAILABLE;
- concurrent create/sync/webhook tidak membuat dua provider charge atau log ganda;
- invalid amount/order/signature tidak menyentuh state;
- buyer/seller/admin/nonparticipant mengikuti authorization matrix;
- cleanup menghapus Payment sebelum Transaction karena Restrict.

### HTTP E2E

Dengan adapter Midtrans fake atau dependency injection, bukan server key Sandbox:

- buyer berhasil membuat Payment dan menerima 201;
- request kedua menerima identity yang sama dan tidak membuat charge kedua;
- seller/admin/anonim ditolak sesuai matrix;
- webhook valid settlement mengubah status yang terlihat di
  GET /api/transactions/[id];
- webhook invalid signature dan amount mismatch tidak mengubah status;
- sync provider unavailable mengembalikan error operasional dan transaksi tetap
  pending;
- UI transaction page tidak menampilkan Server Key di response atau HTML.

### Quality gates

Jalankan pada perubahan implementasi:

~~~text
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
~~~

Jika test database/e2e membutuhkan env lokal, gunakan fixture/credential test
terpisah dan jangan mencetak .env atau Server Key pada output.

## 18. Verifikasi manual Sandbox

1. Siapkan Sandbox Server Key pada environment lokal/server dan URL public HTTPS
   untuk /api/webhooks/midtrans. Isi URL notification yang sama di dashboard
   Sandbox; localhost langsung tidak memenuhi kebutuhan webhook public.
2. Buat listing dengan contoh price = 250000, platformFee = 500, dan adminFee =
   1000. Buat Transaction sebagai buyer. Pastikan awalnya PENDING_PAYMENT dan
   listing IN_TRANSACTION.
3. Tekan Buat/Tampilkan QRIS. Pastikan request browser hanya ke API Rekberin,
   bukan ke Midtrans dengan key; response menampilkan QR URL, amount 251500,
   acquirer gopay, dan expiry sekitar 15 menit.
4. Refresh halaman dan buka modal berulang. Pastikan satu Payment.id, satu orderId,
   satu providerTransactionId, dan QR/amount yang sama digunakan.
5. Gunakan mekanisme pembayaran/test yang tersedia pada akun Midtrans Sandbox
   untuk menghasilkan status pending lalu settlement. Pastikan webhook signature
   lolos, Payment menjadi SETTLEMENT, Transaction menjadi PAYMENT_CONFIRMED, dan
   Listing tetap IN_TRANSACTION.
6. Uji duplicate webhook settlement. Pastikan response tetap sukses, tidak ada
   Payment kedua, tidak ada log duplikat yang mengubah hasil, dan UI tetap stabil.
7. Uji expiry sesuai fasilitas Sandbox atau dengan menunggu scheduler provider.
   Pastikan status menjadi EXPIRE, Transaction CANCELLED, dan Listing kembali
   AVAILABLE. Delay scheduler harus tampil sebagai status sync/operasional, bukan
   dianggap timeout buyer.
8. Uji deny, cancel, dan failure menggunakan skenario/fixture provider yang sah
   pada environment test. Pastikan masing-masing terminal failure me-release
   listing sekali saja.
9. Simulasikan network timeout/5xx pada adapter test atau jalur controlled test.
   Pastikan UI menampilkan retry/status belum tersinkron, Transaction tetap
   PENDING_PAYMENT, dan Listing tetap IN_TRANSACTION.
10. Coba akses sebagai seller, admin yang ditugaskan maupun admin lain, user anonim,
    dan buyer transaksi lain. Pastikan QR/order identity tidak bocor.
11. Periksa browser network, page source, bundle, server log, dan error telemetry;
    pastikan tidak ada Server Key, signature, raw payload, atau Client Key yang
    tidak diperlukan.
12. Pastikan fitur handover, dispute, chat, refund, payout/automatic settlement,
    metode VA, standalone GoPay, dan payment-proof upload tidak muncul dari jalur
    Issue 02.

## 19. Rollback dan pemulihan

- Migration Payment bersifat additive. Jika deploy aplikasi harus di-rollback,
  rollback app terlebih dahulu; tabel Payment ekstra tidak mengganggu binary lama
  selama tidak ada migration destruktif.
- Jangan menjalankan prisma migrate reset pada database shared/terkait Sandbox.
- Jangan menghapus tabel Payment sebagai rollback cepat. Payment identity dan
  evidence status harus dipertahankan untuk rekonsiliasi.
- Jika provider bermasalah, nonaktifkan action create QR di UI/feature flag yang
  disepakati, tetapi biarkan existing pending state dapat dibaca dan disinkronkan
  setelah provider pulih. Jangan mengubahnya menjadi failed secara massal.
- Jika charge berhasil di provider tetapi commit aplikasi timeout, gunakan order ID
  deterministic dan Get Status untuk recovery; jangan membuat order baru sebelum
  status lama dipastikan tidak ada.
- Jika status provider terminal failure, release listing hanya melalui transition
  atomik. Jika listing sudah berubah oleh proses lain, jangan overwrite; buat alert
  rekonsiliasi.
- Penghapusan tabel/kolom dan migration down manual adalah perubahan terpisah yang
  memerlukan backup, review, dan bukti tidak ada Payment aktif. Tidak termasuk
  rollback rutin Issue 02.

## 20. Acceptance matrix

| Kriteria penerimaan | Bukti yang harus tersedia |
|---|---|
| Sandbox only | Validator env menolak non-Sandbox; URL request hanya api.sandbox.midtrans.com; tidak ada production key/flow. |
| QRIS GoPay | Charge body berisi payment_type qris dan qris.acquirer gopay; UI tidak menampilkan VA/metode lain. |
| Nominal authoritative | Unit/integration test membuktikan price + platformFee + adminFee; client tidak dapat override amount. |
| QR, amount, expiry | Response Payment dan UI menampilkan QR URL, amount IDR, dan expiresAt server/provider. |
| Payment persistence | Satu row Payment menyimpan transactionId, orderId, providerTransactionId, amount, status, acquirer, QR URL, expiry. |
| One Payment v1 | Unique transactionId/orderId, concurrent create idempotent, tidak ada charge kedua. |
| Webhook authenticity | Signature SHA-512 diverifikasi; invalid signature/amount/order tidak mutasi DB. |
| Status synchronization | Webhook dan Get Status memakai reconciler sama; duplicate dan stale event aman. |
| Settlement | settlement → Payment SETTLEMENT → Transaction PAYMENT_CONFIRMED; Listing tetap IN_TRANSACTION. |
| Terminal failure | expire, deny, cancel, failure → Transaction CANCELLED + Listing AVAILABLE sekali. |
| Technical errors | Timeout/5xx/parse/mismatch → error operasional; tidak dianggap buyer failure dan tidak release listing. |
| Authorization | Buyer transaksi dapat create/read/sync; seller/admin/nonparticipant/anonim tidak menerima QR identity. |
| Security | Server Key server-only; NEXT_PUBLIC_MIDTRANS_SERVER_KEY dilarang; Client Key tidak diperlukan; logs/response redacted. |
| Scope boundary | Tidak ada production, gateway lain, refund, payout/automatic settlement, handover, dispute, chat, atau proof upload. |
| Verification | Unit, integration, HTTP E2E, typecheck/build, dan manual Sandbox checklist lulus. |

## 21. Definition of Done

Issue 02 selesai hanya jika seluruh pernyataan berikut benar:

- [ ] Migration Payment sudah direview, dijalankan, dan model one-to-one bekerja.
- [ ] .env.example payment-only tersedia tanpa secret, dengan lima variable Sandbox
      yang ditetapkan dan tanpa NEXT_PUBLIC_MIDTRANS_SERVER_KEY.
- [ ] Midtrans adapter hanya memakai Sandbox Core API dan Server Key server-side.
- [ ] Amount dibuat dari price + platformFee + adminFee di service server dan
      divalidasi terhadap response provider.
- [ ] POST/GET/sync Payment memiliki kontrak, authorization, error class, timeout,
      dan idempotensi yang diuji.
- [ ] QR, amount, expiry, status, dan provider identity tersimpan serta dapat
      ditampilkan buyer.
- [ ] Webhook public memverifikasi signature, amount, order, currency, dan status
      sebelum mutation; duplicate aman.
- [ ] Settlement mengonfirmasi Transaction; terminal failure membatalkan Transaction
      dan me-release Listing; technical error tidak melakukan keduanya.
- [ ] UI placeholder, QR palsu, VA/standalone GoPay, countdown 24 jam, dan simulasi
      Zustand tidak lagi menjadi jalur payment API.
- [ ] Tidak ada payment-proof upload, refund, payout/automatic settlement, handover,
      dispute, atau chat baru yang terselip dalam Issue 02.
- [ ] Test unit/database/HTTP E2E, typecheck, build, dan manual Sandbox selesai.
- [ ] Browser bundle, network, logs, dan response audit tidak mengandung secret.
- [ ] Rollback plan dan recovery order ID telah diuji secara controlled.

## 22. Risiko yang perlu dipantau

- Notification URL harus benar-benar public dan stabil; tunnel sementara dapat
  berubah URL atau tidak tersedia saat webhook dikirim.
- Scheduler expiry provider dapat tidak terjadi tepat pada detik expiry UI. UI
  harus menunjukkan waktu server/provider dan menunggu status authoritative.
- Charge timeout adalah kasus paling berisiko terhadap duplicate charge; deterministic
  order ID, Get Status-before-charge, dan lock database adalah syarat wajib.
- Settlement yang datang setelah aplikasi lebih dulu menerima terminal failure
  membutuhkan anomaly handling dan review manual; v1 tidak melakukan refund/payout
  otomatis.
- URL QR provider dapat memiliki aturan akses atau masa berlaku berbeda; adapter
  harus memvalidasi action URL dan menyediakan proxy server-side bila browser tidak
  dapat merender URL secara aman.
- Model satu Payment sengaja membatasi retry dan provider diversity. Jika kebutuhan
  produk berubah, migrasikan ke model attempt secara eksplisit, jangan menghapus
  unique constraint secara ad hoc.
