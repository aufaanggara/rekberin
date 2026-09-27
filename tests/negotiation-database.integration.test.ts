import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { ListingStatus, Role } from "@prisma/client";
import type { MidtransGateway, MidtransTransaction } from "@/lib/payments/midtrans";

loadEnvConfig(process.cwd());

const { prisma } = require("@/lib/prisma") as typeof import("@/lib/prisma");
const { openNegotiation, getNegotiation, changeOffer, checkoutNegotiation, NegotiationError } = require("@/lib/negotiations") as typeof import("@/lib/negotiations");
const { createOrRecoverPayment, syncPayment } = require("@/lib/payments/payment-service") as typeof import("@/lib/payments/payment-service");
const { runHandoverAction } = require("@/lib/handover-flow") as typeof import("@/lib/handover-flow");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const id = (name: string) => `negotiation-${name}-${suffix}`;
const ids = { buyer: id("buyer"), seller: id("seller"), admin: id("admin"), outsider: id("outsider"), listing: id("listing") };
let negotiationId = "";
let transactionId = "";
const hasStatus = (statusCode: number) => (error: unknown) => error instanceof NegotiationError && error.statusCode === statusCode;

before(async () => {
  await prisma.user.createMany({ data: [
    { id: ids.buyer, email: `${ids.buyer}@example.test`, username: ids.buyer, fullName: "Buyer", role: Role.USER },
    { id: ids.seller, email: `${ids.seller}@example.test`, username: ids.seller, fullName: "Seller", role: Role.USER },
    { id: ids.admin, email: `${ids.admin}@example.test`, username: ids.admin, fullName: "Admin", role: Role.ADMIN },
    { id: ids.outsider, email: `${ids.outsider}@example.test`, username: ids.outsider, fullName: "Outsider", role: Role.USER },
  ] });
  await prisma.adminProfile.create({ data: { userId: ids.admin, fee: 1000, bankAccounts: [], isActive: true } });
  await prisma.listing.create({ data: {
    id: ids.listing, sellerId: ids.seller, title: "Negotiation fixture", game: "eFootball",
    price: 300000, description: "Integration fixture", details: {}, images: [], status: ListingStatus.AVAILABLE,
  } });
});

after(async () => {
  if (transactionId) {
    await prisma.escrowTransfer.deleteMany({ where: { transactionId } });
    await prisma.payment.deleteMany({ where: { transactionId } });
    await prisma.chatMessage.deleteMany({ where: { transactionId } });
    await prisma.transaction.deleteMany({ where: { id: transactionId } });
  }
  if (negotiationId) await prisma.negotiation.deleteMany({ where: { id: negotiationId } });
  await prisma.listing.deleteMany({ where: { id: ids.listing } });
  await prisma.adminProfile.deleteMany({ where: { userId: ids.admin } });
  await prisma.user.deleteMany({ where: { id: { in: [ids.buyer, ids.seller, ids.admin, ids.outsider] } } });
  await prisma.$disconnect();
});

test("listing chat, accepted offer, payment confirmation, and buyer receipt complete one transaction", async () => {
  const buyer = { id: ids.buyer, role: Role.USER };
  const seller = { id: ids.seller, role: Role.USER };
  const opened = await openNegotiation(ids.listing, buyer);
  negotiationId = opened.id;
  assert.equal((await openNegotiation(ids.listing, buyer)).id, negotiationId);
  await assert.rejects(() => getNegotiation(negotiationId, ids.outsider), hasStatus(403));
  await assert.rejects(() => checkoutNegotiation(negotiationId, buyer), hasStatus(409));
  await prisma.negotiationMessage.create({ data: { negotiationId, senderId: ids.buyer, message: "Apakah akun masih tersedia?" } });
  await assert.rejects(() => changeOffer(negotiationId, seller, "OFFER", { price: 250000 }), hasStatus(403));
  const offer = await changeOffer(negotiationId, buyer, "OFFER", { price: 250000, notes: "Setuju harga ini?" });
  assert.equal(offer.offerStatus, "PENDING");
  await assert.rejects(() => changeOffer(negotiationId, seller, "ACCEPT", { version: 0 }), hasStatus(409));
  const accepted = await changeOffer(negotiationId, seller, "ACCEPT", { version: offer.version });
  assert.equal(accepted.offerStatus, "ACCEPTED");
  transactionId = await checkoutNegotiation(negotiationId, buyer);
  assert.equal(await checkoutNegotiation(negotiationId, buyer), transactionId);
  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId }, include: { listing: true, chatMessages: true } });
  assert.equal(transaction.price, 250000);
  assert.equal(transaction.buyerId, ids.buyer);
  assert.equal(transaction.sellerId, ids.seller);
  const assignedAdmin = await prisma.user.findUniqueOrThrow({ where: { id: transaction.adminId }, include: { adminProfile: true } });
  assert.ok(assignedAdmin.role === Role.ADMIN || assignedAdmin.role === Role.SUPER_ADMIN);
  assert.equal(assignedAdmin.adminProfile?.isActive, true);
  assert.equal(transaction.listing.status, ListingStatus.IN_TRANSACTION);
  assert.equal(transaction.chatMessages.length, 1);
  assert.equal(transaction.chatMessages[0].message, "Apakah akun masih tersedia?");

  let settled = false;
  let paymentAmount = 0;
  const provider = (orderId: string, status: "pending" | "settlement"): MidtransTransaction => ({
    orderId, transactionId: `provider-${orderId}`, amount: paymentAmount,
    currency: "IDR", paymentType: "qris", acquirer: "gopay", transactionStatus: status,
    qrCodeUrl: null, expiresAt: null, paidAt: status === "settlement" ? new Date() : null,
  });
  const gateway: MidtransGateway = {
    async chargeQris(input) { paymentAmount = input.amount; return provider(input.orderId, "pending"); },
    async getTransactionStatus(orderId) { return settled ? provider(orderId, "settlement") : null; },
  };
  const payment = await createOrRecoverPayment(transactionId, ids.buyer, gateway);
  assert.equal(payment.amount, 251500);
  settled = true;
  await syncPayment(transactionId, ids.buyer, gateway);
  const paid = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  assert.equal(paid.status, "IN_HANDOVER");
  assert.equal(paid.handoverDeadlineAt!.getTime() - paid.handoverStartedAt!.getTime(), 2 * 60 * 60 * 1000);
  await runHandoverAction(transactionId, buyer, "CONFIRM_RECEIPT");
  const completed = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId }, include: { listing: true, escrowTransfer: true },
  });
  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.listing.status, ListingStatus.SOLD);
  assert.equal(completed.escrowTransfer?.recipientId, ids.seller);
  assert.equal(completed.escrowTransfer?.amount, 250000);
  assert.equal(completed.escrowTransfer?.status, "SIMULATED");
});
