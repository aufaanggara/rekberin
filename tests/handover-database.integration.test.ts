import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { ListingStatus, Role, TransactionStatus } from "@prisma/client";

loadEnvConfig(process.cwd());

const { prisma } = require("@/lib/prisma") as typeof import("@/lib/prisma");
const {
  getHandoverSnapshot,
  transitionHandover,
} = require("@/lib/handover-service") as typeof import("@/lib/handover-service");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  seller: `handover-seller-${suffix}`,
  buyer: `handover-buyer-${suffix}`,
  outsider: `handover-outsider-${suffix}`,
  admin: `handover-admin-${suffix}`,
  listing: `handover-listing-${suffix}`,
  transaction: `handover-transaction-${suffix}`,
};

before(async () => {
  await prisma.user.createMany({
    data: [
      { id: ids.seller, email: `${ids.seller}@example.test`, username: ids.seller, fullName: "Handover Seller", role: Role.USER },
      { id: ids.buyer, email: `${ids.buyer}@example.test`, username: ids.buyer, fullName: "Handover Buyer", role: Role.USER },
      { id: ids.outsider, email: `${ids.outsider}@example.test`, username: ids.outsider, fullName: "Handover Outsider", role: Role.USER },
      { id: ids.admin, email: `${ids.admin}@example.test`, username: ids.admin, fullName: "Handover Admin", role: Role.ADMIN },
    ],
  });

  await prisma.listing.create({
    data: {
      id: ids.listing,
      sellerId: ids.seller,
      title: "Handover integration listing",
      game: "eFootball",
      price: 250000,
      description: "Handover integration fixture",
      details: {},
      images: [],
      status: ListingStatus.IN_TRANSACTION,
    },
  });

  await prisma.transaction.create({
    data: {
      id: ids.transaction,
      listingId: ids.listing,
      buyerId: ids.buyer,
      sellerId: ids.seller,
      adminId: ids.admin,
      price: 250000,
      status: TransactionStatus.PAYMENT_CONFIRMED,
      proofUrls: [],
      logs: [{ action: "PAYMENT_CONFIRMED", actorId: "midtrans", timestamp: new Date().toISOString() }],
      checklist: [],
    },
  });
});

after(async () => {
  await prisma.transaction.deleteMany({ where: { id: ids.transaction } });
  await prisma.listing.deleteMany({ where: { id: ids.listing } });
  await prisma.user.deleteMany({ where: { id: { in: [ids.seller, ids.buyer, ids.outsider, ids.admin] } } });
  await prisma.$disconnect();
});

test("admin starts handover, participants can read it, and buyer completes it atomically", async () => {
  const started = await transitionHandover(
    ids.transaction,
    { id: ids.admin, role: Role.ADMIN },
    "START"
  );
  assert.equal(started.transactionStatus, TransactionStatus.IN_HANDOVER);
  assert.equal(started.status, "IN_PROGRESS");

  const buyerView = await getHandoverSnapshot(ids.transaction, { id: ids.buyer, role: Role.USER });
  const sellerView = await getHandoverSnapshot(ids.transaction, { id: ids.seller, role: Role.USER });
  assert.equal(buyerView.status, "IN_PROGRESS");
  assert.equal(sellerView.status, "IN_PROGRESS");
  assert.equal(buyerView.canConfirm, true);

  const completed = await transitionHandover(
    ids.transaction,
    { id: ids.buyer, role: Role.USER },
    "CONFIRM_RECEIPT"
  );
  assert.equal(completed.transactionStatus, TransactionStatus.COMPLETED);
  assert.equal(completed.listingStatus, ListingStatus.SOLD);

  const persisted = await prisma.transaction.findUniqueOrThrow({
    where: { id: ids.transaction },
    include: { listing: true },
  });
  assert.equal(persisted.status, TransactionStatus.COMPLETED);
  assert.equal(persisted.listing.status, ListingStatus.SOLD);
  assert.equal(persisted.logs.filter((entry) => typeof entry === "object" && entry !== null && "action" in entry && entry.action === "HANDOVER_STARTED").length, 1);
  assert.equal(persisted.logs.filter((entry) => typeof entry === "object" && entry !== null && "action" in entry && entry.action === "BUYER_CONFIRMED").length, 1);
});

test("handover authorization and repeated completion are safe", async () => {
  await assert.rejects(
    () => transitionHandover(ids.transaction, { id: ids.outsider, role: Role.USER }, "START"),
    /bukan bagian dari transaksi|Hanya admin/
  );

  const repeated = await transitionHandover(
    ids.transaction,
    { id: ids.buyer, role: Role.USER },
    "CONFIRM_RECEIPT"
  );
  assert.equal(repeated.transactionStatus, TransactionStatus.COMPLETED);
  assert.equal(repeated.listingStatus, ListingStatus.SOLD);
});
