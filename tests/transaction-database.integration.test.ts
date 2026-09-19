import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { ListingStatus, Role } from "@prisma/client";

loadEnvConfig(process.cwd());

const { prisma } = require("@/lib/prisma") as typeof import("@/lib/prisma");
const {
  createTransactionForBuyer,
  isTransactionParticipant,
  toTransactionApiDto,
  TransactionApiError,
} = require("@/lib/transactions") as typeof import("@/lib/transactions");
const { parseTransactionDetailResponse } = require("@/lib/transaction-api-client") as typeof import("@/lib/transaction-api-client");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  seller: `it-seller-${suffix}`,
  buyerA: `it-buyer-a-${suffix}`,
  buyerB: `it-buyer-b-${suffix}`,
  admin: `it-admin-${suffix}`,
  listing: `it-listing-${suffix}`,
  raceListing: `it-race-listing-${suffix}`,
};

before(async () => {
  await prisma.user.createMany({
    data: [
      {
        id: ids.seller,
        email: `${ids.seller}@example.test`,
        username: ids.seller,
        fullName: "Integration Seller",
        role: Role.USER,
      },
      {
        id: ids.buyerA,
        email: `${ids.buyerA}@example.test`,
        username: ids.buyerA,
        fullName: "Integration Buyer A",
        role: Role.USER,
      },
      {
        id: ids.buyerB,
        email: `${ids.buyerB}@example.test`,
        username: ids.buyerB,
        fullName: "Integration Buyer B",
        role: Role.USER,
      },
      {
        id: ids.admin,
        email: `${ids.admin}@example.test`,
        username: ids.admin,
        fullName: "Integration Admin",
        role: Role.ADMIN,
        isVerified: true,
      },
    ],
  });

  await prisma.adminProfile.create({
    data: {
      userId: ids.admin,
      fee: 1000,
      bankAccounts: [],
      trustScore: 95,
      totalSuccess: 1,
      isActive: true,
    },
  });

  const details = {
    overall: 90,
    league: "Division 1",
    coins: 1000,
    gp: 5000,
    players: ["Test Player"],
    notes: "Integration fixture",
  };
  await prisma.listing.createMany({
    data: [
      {
        id: ids.listing,
        sellerId: ids.seller,
        title: "Integration Listing",
        game: "eFootball",
        price: 250000,
        description: "Listing untuk integration test transaksi.",
        details,
        images: [],
        status: ListingStatus.AVAILABLE,
      },
      {
        id: ids.raceListing,
        sellerId: ids.seller,
        title: "Concurrent Integration Listing",
        game: "eFootball",
        price: 300000,
        description: "Listing untuk concurrency integration test.",
        details,
        images: [],
        status: ListingStatus.AVAILABLE,
      },
    ],
  });
});

after(async () => {
  const listingIds = [ids.listing, ids.raceListing];
  await prisma.transaction.deleteMany({ where: { listingId: { in: listingIds } } });
  await prisma.listing.deleteMany({ where: { id: { in: listingIds } } });
  await prisma.adminProfile.deleteMany({ where: { userId: ids.admin } });
  await prisma.user.deleteMany({
    where: { id: { in: [ids.seller, ids.buyerA, ids.buyerB, ids.admin] } },
  });
  await prisma.$disconnect();
});

test("database transaction stores all participants and moves listing atomically", async () => {
  const transaction = await createTransactionForBuyer({
    buyer: { id: ids.buyerA, role: Role.USER },
    listingId: ids.listing,
    adminUserId: ids.admin,
  });

  assert.equal(transaction.buyerId, ids.buyerA);
  assert.equal(transaction.sellerId, ids.seller);
  assert.equal(transaction.adminId, ids.admin);
  assert.equal(transaction.listingId, ids.listing);
  assert.equal(transaction.status, "PENDING_PAYMENT");
  assert.equal(transaction.listing.status, "IN_TRANSACTION");

  const persistedListing = await prisma.listing.findUniqueOrThrow({
    where: { id: ids.listing },
    select: { status: true },
  });
  assert.equal(persistedListing.status, "IN_TRANSACTION");

  assert.equal(isTransactionParticipant(transaction, ids.buyerA), true);
  assert.equal(isTransactionParticipant(transaction, ids.seller), true);
  assert.equal(isTransactionParticipant(transaction, ids.admin), true);
  assert.equal(isTransactionParticipant(transaction, ids.buyerB), false);

  const payload = { transaction: toTransactionApiDto(transaction) };
  assert.deepEqual(parseTransactionDetailResponse(payload), payload);
  assert.ok(payload.transaction.admin.adminProfile);
});

test("concurrent buyers produce exactly one listing claim", async () => {
  const results = await Promise.allSettled([
    createTransactionForBuyer({
      buyer: { id: ids.buyerA, role: Role.USER },
      listingId: ids.raceListing,
      adminUserId: ids.admin,
    }),
    createTransactionForBuyer({
      buyer: { id: ids.buyerB, role: Role.USER },
      listingId: ids.raceListing,
      adminUserId: ids.admin,
    }),
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const rejection = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );
  assert.ok(rejection);
  assert.ok(rejection.reason instanceof TransactionApiError);
  assert.equal(rejection.reason.statusCode, 409);

  const count = await prisma.transaction.count({
    where: { listingId: ids.raceListing },
  });
  assert.equal(count, 1);
});
