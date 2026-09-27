import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { ListingStatus, Role, TransactionStatus } from "@prisma/client";

loadEnvConfig(process.cwd());

const { prisma } = require("@/lib/prisma") as typeof import("@/lib/prisma");
const { HandoverFlowError, runHandoverAction, releaseExpiredHandover } = require("@/lib/handover-flow") as typeof import("@/lib/handover-flow");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const id = (name: string) => `handover-${name}-${suffix}`;
const users = ["buyer", "seller", "admin", "other-admin", "outsider"].map(id);
const listings = ["accepted", "reported", "expired", "blocked"].map(id);
const transactions = ["accepted-tx", "reported-tx", "expired-tx", "blocked-tx"].map(id);
// Keep fixtures ahead of any running background worker; tests advance the clock explicitly.
const base = new Date(Date.now() + 24 * 60 * 60 * 1000);
const at = (minutes: number) => new Date(base.getTime() + minutes * 60_000);
const actor = (userId: string, role: Role) => ({ id: userId, role });
const hasStatus = (statusCode: number) => (error: unknown) => error instanceof HandoverFlowError && error.statusCode === statusCode;

before(async () => {
  await prisma.user.createMany({ data: [
    { id: users[0], email: `${users[0]}@example.test`, username: users[0], fullName: "Buyer", role: Role.USER },
    { id: users[1], email: `${users[1]}@example.test`, username: users[1], fullName: "Seller", role: Role.USER },
    { id: users[2], email: `${users[2]}@example.test`, username: users[2], fullName: "Admin", role: Role.ADMIN },
    { id: users[3], email: `${users[3]}@example.test`, username: users[3], fullName: "Other admin", role: Role.ADMIN },
    { id: users[4], email: `${users[4]}@example.test`, username: users[4], fullName: "Outsider", role: Role.USER },
  ] });
  for (let index = 0; index < listings.length; index++) {
    await prisma.listing.create({ data: {
      id: listings[index], sellerId: users[1], title: `Handover fixture ${index}`,
      game: "eFootball", price: 250000, description: "Integration fixture",
      details: {}, images: [], status: ListingStatus.IN_TRANSACTION,
    } });
    await prisma.transaction.create({ data: {
      id: transactions[index], listingId: listings[index], buyerId: users[0],
      sellerId: users[1], adminId: users[2], price: 250000,
      status: index === 0 ? TransactionStatus.PENDING_PAYMENT : TransactionStatus.IN_HANDOVER,
      handoverStartedAt: index === 0 ? null : base,
      handoverDeadlineAt: index === 0 ? null : at(120),
      proofUrls: [], logs: [], checklist: [],
    } });
  }
});

after(async () => {
  await prisma.escrowTransfer.deleteMany({ where: { transactionId: { in: transactions } } });
  await prisma.transaction.deleteMany({ where: { id: { in: transactions } } });
  await prisma.listing.deleteMany({ where: { id: { in: listings } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

test("assigned admin can start legacy confirmed handover; buyer confirmation sells the right listing and records dummy payout", async () => {
  await assert.rejects(() => runHandoverAction(transactions[0], actor(users[2], Role.ADMIN), "START", {}, base), hasStatus(409));
  await prisma.transaction.update({ where: { id: transactions[0] }, data: { status: TransactionStatus.PAYMENT_CONFIRMED } });
  await assert.rejects(() => runHandoverAction(transactions[0], actor(users[3], Role.ADMIN), "START", {}, base), hasStatus(403));
  const started = await runHandoverAction(transactions[0], actor(users[2], Role.ADMIN), "START", {}, base);
  assert.equal(started.status, TransactionStatus.IN_HANDOVER);
  const legacy = await prisma.transaction.findUniqueOrThrow({ where: { id: transactions[0] } });
  assert.equal(Date.parse(started.handoverDeadlineAt!), legacy.handoverStartedAt!.getTime() + 2 * 60 * 60 * 1000);
  await assert.rejects(() => runHandoverAction(transactions[0], actor(users[1], Role.USER), "CONFIRM_RECEIPT", {}, at(1)), hasStatus(403));
  await assert.rejects(() => runHandoverAction(transactions[0], actor(users[4], Role.USER), "CONFIRM_RECEIPT", {}, at(1)), hasStatus(403));
  const completed = await runHandoverAction(transactions[0], actor(users[0], Role.USER), "CONFIRM_RECEIPT", {}, at(1));
  assert.equal(completed.status, TransactionStatus.COMPLETED);
  assert.equal(completed.listingStatus, ListingStatus.SOLD);
  assert.equal(completed.transfer?.kind, "SELLER_PAYOUT");
  assert.equal(completed.transfer?.amount, 250000);
  const persisted = await prisma.transaction.findUniqueOrThrow({ where: { id: transactions[0] }, include: { listing: true, escrowTransfer: true } });
  assert.equal(persisted.listing.status, ListingStatus.SOLD);
  assert.equal(persisted.escrowTransfer?.recipientId, users[1]);
  assert.equal(persisted.escrowTransfer?.provider, "DUMMY");
  await runHandoverAction(transactions[0], actor(users[0], Role.USER), "CONFIRM_RECEIPT", {}, at(2));
  assert.equal(await prisma.escrowTransfer.count({ where: { transactionId: transactions[0] } }), 1);
});

test("buyer report joins admin and pauses release; admin may resume or cancel", async () => {
  await assert.rejects(() => runHandoverAction(transactions[1], actor(users[1], Role.USER), "REPORT_ISSUE", { reason: "Akun tidak sesuai" }, at(30)), hasStatus(403));
  const reported = await runHandoverAction(transactions[1], actor(users[0], Role.USER), "REPORT_ISSUE", { reason: "Akun yang diterima tidak sesuai deskripsi." }, at(30));
  assert.equal(reported.status, TransactionStatus.DISPUTED);
  const paused = await prisma.transaction.findUniqueOrThrow({ where: { id: transactions[1] } });
  assert.equal(paused.adminJoinedAt?.toISOString(), at(30).toISOString());
  assert.equal(await releaseExpiredHandover(transactions[1], at(180)), null);
  await assert.rejects(() => runHandoverAction(transactions[1], actor(users[3], Role.ADMIN), "RESUME", {}, at(60)), hasStatus(403));
  const resumed = await runHandoverAction(transactions[1], actor(users[2], Role.ADMIN), "RESUME", {}, at(60));
  assert.equal(resumed.handoverDeadlineAt, at(150).toISOString());
  await runHandoverAction(transactions[1], actor(users[0], Role.USER), "REPORT_ISSUE", { reason: "Akun tetap belum sesuai deskripsi." }, at(70));
  const cancelled = await runHandoverAction(transactions[1], actor(users[2], Role.ADMIN), "CANCEL", {}, at(75));
  assert.equal(cancelled.status, TransactionStatus.CANCELLED);
  assert.equal(cancelled.listingStatus, ListingStatus.AVAILABLE);
  assert.equal(cancelled.transfer?.kind, "BUYER_REFUND");
  const persisted = await prisma.transaction.findUniqueOrThrow({ where: { id: transactions[1] }, include: { escrowTransfer: true } });
  assert.equal(persisted.escrowTransfer?.recipientId, users[0]);
});

test("two hours without buyer confirmation completes transaction and records one dummy payout", async () => {
  assert.equal(await releaseExpiredHandover(transactions[2], at(119)), null);
  const released = await releaseExpiredHandover(transactions[2], at(120));
  assert.equal(released?.status, TransactionStatus.COMPLETED);
  assert.equal(released?.transfer?.kind, "SELLER_PAYOUT");
  assert.equal(await releaseExpiredHandover(transactions[2], at(121)), null);
  assert.equal(await prisma.escrowTransfer.count({ where: { transactionId: transactions[2] } }), 1);
});

test("listing conflict rolls back completion and dummy transfer", async () => {
  await prisma.listing.update({ where: { id: listings[3] }, data: { status: ListingStatus.AVAILABLE } });
  await assert.rejects(() => runHandoverAction(transactions[3], actor(users[0], Role.USER), "CONFIRM_RECEIPT", {}, at(1)), hasStatus(409));
  const persisted = await prisma.transaction.findUniqueOrThrow({ where: { id: transactions[3] } });
  assert.equal(persisted.status, TransactionStatus.IN_HANDOVER);
  assert.equal(await prisma.escrowTransfer.count({ where: { transactionId: transactions[3] } }), 0);
});
