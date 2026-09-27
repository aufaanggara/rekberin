-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EscrowTransferKind" AS ENUM ('SELLER_PAYOUT', 'BUYER_REFUND');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "adminJoinedAt" TIMESTAMP(3),
ADD COLUMN     "buyerWhatsapp" TEXT,
ADD COLUMN     "handoverDeadlineAt" TIMESTAMP(3),
ADD COLUMN     "handoverPausedAt" TIMESTAMP(3),
ADD COLUMN     "handoverStartedAt" TIMESTAMP(3),
ADD COLUMN     "negotiationId" TEXT,
ADD COLUMN     "sellerWhatsapp" TEXT;

-- CreateTable
CREATE TABLE "Negotiation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "offeredPrice" INTEGER,
    "offerNotes" TEXT,
    "offerStatus" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Negotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationMessage" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowTransfer" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "kind" "EscrowTransferKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'DUMMY',
    "status" TEXT NOT NULL DEFAULT 'SIMULATED',
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Negotiation_sellerId_updatedAt_idx" ON "Negotiation"("sellerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Negotiation_listingId_buyerId_key" ON "Negotiation"("listingId", "buyerId");

-- CreateIndex
CREATE INDEX "NegotiationMessage_negotiationId_createdAt_idx" ON "NegotiationMessage"("negotiationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransfer_transactionId_key" ON "EscrowTransfer"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransfer_reference_key" ON "EscrowTransfer"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_negotiationId_key" ON "Transaction"("negotiationId");

-- CreateIndex
CREATE INDEX "Transaction_status_handoverDeadlineAt_idx" ON "Transaction"("status", "handoverDeadlineAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransfer" ADD CONSTRAINT "EscrowTransfer_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransfer" ADD CONSTRAINT "EscrowTransfer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

