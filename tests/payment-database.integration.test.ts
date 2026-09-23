import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { ListingStatus, PaymentStatus, Role, TransactionStatus } from "@prisma/client";

loadEnvConfig(process.cwd());

const { prisma } = require("@/lib/prisma") as typeof import("@/lib/prisma");
const { createOrRecoverPayment, getPaymentForBuyer, syncPayment } = require("@/lib/payments/payment-service") as typeof import("@/lib/payments/payment-service");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  seller: `payment-seller-${suffix}`,
  buyer: `payment-buyer-${suffix}`,
  otherBuyer: `payment-other-${suffix}`,
  admin: `payment-admin-${suffix}`,
  listing: `payment-listing-${suffix}`,
  terminalListing: `payment-terminal-listing-${suffix}`,
  transaction: `payment-transaction-${suffix}`,
  terminalTransaction: `payment-terminal-transaction-${suffix}`,
};

type ProviderStatus = "pending" | "settlement" | "failure";

function provider(status: ProviderStatus, orderId: string, amount: number) {
  return {
    orderId,
    transactionId: `provider-${orderId}`,
    amount,
    currency: "IDR" as const,
    paymentType: "qris" as const,
    acquirer: "gopay" as const,
    transactionStatus: status,
    qrCodeUrl: status === "pending" ? `https://api.sandbox.midtrans.com/v2/qris/${orderId}/qr-code` : null,
    expiresAt: new Date("2026-09-22T05:15:00.000Z"),
    paidAt: status === "settlement" ? new Date("2026-09-22T05:00:00.000Z") : null,
  };
}

class FakeGateway {
  next: ProviderStatus | null = null;
  chargeCount = 0;
  async getTransactionStatus(orderId: string) {
    return this.next ? provider(this.next, orderId, 251500) : null;
  }
  async chargeQris(input: { orderId: string; amount: number; itemName: string }) {
    this.chargeCount += 1;
    return provider("pending", input.orderId, input.amount);
  }
}

async function createFixtureTransaction(input: { transactionId: string; listingId: string; price: number }) {
  await prisma.listing.create({
    data: {
      id: input.listingId,
      sellerId: ids.seller,
      title: "Payment integration listing",
      game: "eFootball",
      price: input.price,
      description: "Payment integration fixture",
      details: {},
      images: [],
      status: ListingStatus.IN_TRANSACTION,
    },
  });
  return prisma.transaction.create({
    data: {
      id: input.transactionId,
      listingId: input.listingId,
      buyerId: ids.buyer,
      sellerId: ids.seller,
      adminId: ids.admin,
      price: input.price,
      platformFee: 500,
      adminFee: 1000,
      status: TransactionStatus.PENDING_PAYMENT,
      proofUrls: [],
      logs: [{ action: "TRANSACTION_CREATED", actorId: ids.buyer, timestamp: new Date().toISOString() }],
      checklist: [],
    },
  });
}

before(async () => {
  await prisma.user.createMany({
    data: [
      { id: ids.seller, email: `${ids.seller}@example.test`, username: ids.seller, fullName: "Payment Seller", role: Role.USER },
      { id: ids.buyer, email: `${ids.buyer}@example.test`, username: ids.buyer, fullName: "Payment Buyer", role: Role.USER },
      { id: ids.otherBuyer, email: `${ids.otherBuyer}@example.test`, username: ids.otherBuyer, fullName: "Other Buyer", role: Role.USER },
      { id: ids.admin, email: `${ids.admin}@example.test`, username: ids.admin, fullName: "Payment Admin", role: Role.ADMIN },
    ],
  });
  await createFixtureTransaction({ transactionId: ids.transaction, listingId: ids.listing, price: 250000 });
  await createFixtureTransaction({ transactionId: ids.terminalTransaction, listingId: ids.terminalListing, price: 250000 });
});

after(async () => {
  await prisma.payment.deleteMany({ where: { transactionId: { in: [ids.transaction, ids.terminalTransaction] } } });
  await prisma.transaction.deleteMany({ where: { id: { in: [ids.transaction, ids.terminalTransaction] } } });
  await prisma.listing.deleteMany({ where: { id: { in: [ids.listing, ids.terminalListing] } } });
  await prisma.user.deleteMany({ where: { id: { in: [ids.seller, ids.buyer, ids.otherBuyer, ids.admin] } } });
  await prisma.$disconnect();
});

test("payment is one-to-one, amount is server-side, and buyer ownership is enforced", async () => {
  const gateway = new FakeGateway();
  const first = await createOrRecoverPayment(ids.transaction, ids.buyer, gateway);
  assert.ok(first);
  assert.equal(first.amount, 251500);
  assert.equal(first.status, "PENDING");
  assert.equal(gateway.chargeCount, 1);
  assert.deepEqual(Object.keys(first).sort(), ["acquirer", "amount", "currency", "expiresAt", "id", "lastSyncedAt", "method", "orderId", "paidAt", "providerTransactionId", "qrCodeUrl", "status", "transactionId"].sort());
  assert.equal(await getPaymentForBuyer(ids.transaction, ids.otherBuyer), null);
  await assert.rejects(() => createOrRecoverPayment(ids.transaction, ids.otherBuyer, gateway), /Transaksi tidak ditemukan/);

  const second = await createOrRecoverPayment(ids.transaction, ids.buyer, gateway);
  assert.ok(second);
  assert.equal(second.id, first.id);
  assert.equal(gateway.chargeCount, 1);
  assert.equal(await prisma.payment.count({ where: { transactionId: ids.transaction } }), 1);
});

test("settlement confirms once, preserves listing state, and duplicate settlement adds no log", async () => {
  const gateway = new FakeGateway();
  await createOrRecoverPayment(ids.transaction, ids.buyer, gateway);
  gateway.next = "settlement";
  const settled = await syncPayment(ids.transaction, ids.buyer, gateway);
  assert.equal(settled?.status, "SETTLEMENT");
  const firstState = await prisma.transaction.findUniqueOrThrow({ where: { id: ids.transaction }, include: { listing: true } });
  assert.equal(firstState.status, TransactionStatus.PAYMENT_CONFIRMED);
  assert.equal(firstState.listing.status, ListingStatus.IN_TRANSACTION);
  assert.equal(firstState.logs.filter((entry) => typeof entry === "object" && entry !== null && "action" in entry && entry.action === "PAYMENT_CONFIRMED").length, 1);

  await syncPayment(ids.transaction, ids.buyer, gateway);
  const secondState = await prisma.transaction.findUniqueOrThrow({ where: { id: ids.transaction }, include: { listing: true } });
  assert.equal(secondState.logs.filter((entry) => typeof entry === "object" && entry !== null && "action" in entry && entry.action === "PAYMENT_CONFIRMED").length, 1);
  assert.equal(secondState.status, TransactionStatus.PAYMENT_CONFIRMED);
});

test("terminal failure cancels pending transaction and releases listing", async () => {
  const gateway = new FakeGateway();
  await createOrRecoverPayment(ids.terminalTransaction, ids.buyer, gateway);
  gateway.next = "failure";
  const failed = await syncPayment(ids.terminalTransaction, ids.buyer, gateway);
  assert.equal(failed?.status, PaymentStatus.FAILURE);
  const state = await prisma.transaction.findUniqueOrThrow({ where: { id: ids.terminalTransaction }, include: { listing: true, payment: true } });
  assert.equal(state.status, TransactionStatus.CANCELLED);
  assert.equal(state.listing.status, ListingStatus.AVAILABLE);
  assert.equal(state.payment?.status, PaymentStatus.FAILURE);
});

test("Payment restrict cleanup requires deleting Payment before Transaction", async () => {
  await assert.rejects(() => prisma.transaction.delete({ where: { id: ids.transaction } }));
  await prisma.payment.delete({ where: { transactionId: ids.transaction } });
  await prisma.transaction.delete({ where: { id: ids.transaction } });
  await prisma.listing.delete({ where: { id: ids.listing } });
});
