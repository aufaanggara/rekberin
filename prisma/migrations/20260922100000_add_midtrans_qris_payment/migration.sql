-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MIDTRANS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('QRIS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SETTLEMENT', 'EXPIRE', 'DENY', 'CANCEL', 'FAILURE');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MIDTRANS',
    "method" "PaymentMethod" NOT NULL DEFAULT 'QRIS',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "providerPaymentType" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "acquirer" TEXT NOT NULL DEFAULT 'gopay',
    "qrCodeUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_expiresAt_idx" ON "Payment"("expiresAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
