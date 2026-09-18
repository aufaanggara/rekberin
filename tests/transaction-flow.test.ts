import { test } from "node:test";
import assert from "node:assert/strict";
import { ListingStatus, Role } from "@prisma/client";
import {
  getApiErrorMessage,
  parseTransactionAdminListResponse,
  parseTransactionDetailResponse,
  parseTransactionListResponse,
} from "@/lib/transaction-api-client";
import {
  assertBuyerCanStartTransaction,
  isSuccessfulListingClaim,
  isTransactionParticipant,
  TransactionApiError,
  validateTransactionStartPolicy,
} from "@/lib/transactions";
import { buildTransactionTimeline } from "@/lib/transaction-view-model";
import type { TransactionApiResponse } from "@/types/transaction-api";

function makeTransaction(
  overrides: Partial<TransactionApiResponse> = {}
): TransactionApiResponse {
  const buyer = {
    id: "buyer-1",
    username: "buyer",
    fullName: "Buyer Test",
    avatarUrl: null,
    role: Role.USER,
    isVerified: true,
  };
  const seller = {
    id: "seller-1",
    username: "seller",
    fullName: "Seller Test",
    avatarUrl: null,
    role: Role.USER,
    isVerified: true,
  };

  return {
    id: "transaction-1",
    listingId: "listing-1",
    buyerId: buyer.id,
    sellerId: seller.id,
    adminId: "admin-1",
    price: 100000,
    platformFee: 500,
    adminFee: 1000,
    status: "PENDING_PAYMENT",
    notes: null,
    disputeReason: null,
    proofUrls: [],
    logs: [{ action: "TRANSACTION_CREATED", timestamp: "2026-01-01T00:00:00.000Z" }],
    checklist: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    listing: {
      id: "listing-1",
      sellerId: seller.id,
      title: "Listing test",
      game: "eFootball",
      price: 100000,
      description: "Listing test",
      details: {},
      images: [],
      status: ListingStatus.IN_TRANSACTION,
      isFeatured: false,
      viewCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      seller,
    },
    buyer,
    seller,
    admin: {
      id: "admin-1",
      username: "admin",
      fullName: "Admin Test",
      avatarUrl: null,
      role: Role.ADMIN,
      isVerified: true,
      adminProfile: null,
    },
    ...overrides,
  };
}

test("DTO parser accepts the public list shape and rejects malformed responses", () => {
  const transaction = makeTransaction();
  assert.deepEqual(parseTransactionListResponse({ transactions: [transaction] }), {
    transactions: [transaction],
  });
  assert.throws(() => parseTransactionListResponse({ transactions: [{ id: "broken" }] }));
  assert.throws(() => parseTransactionDetailResponse({ transaction: { id: "broken" } }));
});

test("transaction parser accepts the public admin profile without private fee data", () => {
  const transaction = makeTransaction({
    admin: {
      id: "admin-1",
      username: "admin",
      fullName: "Admin Test",
      avatarUrl: null,
      role: Role.ADMIN,
      isVerified: true,
      adminProfile: {
        id: "profile-1",
        bio: "Admin test",
        activeHours: "08:00 - 22:00",
        trustScore: 98,
        responseTime: 5,
        totalSuccess: 10,
        isActive: true,
        joinedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  });

  assert.deepEqual(parseTransactionDetailResponse({ transaction }), { transaction });
});

test("admin response parser validates nullable/public admin fields", () => {
  const payload = {
    admins: [
      {
        id: "admin-1",
        username: "admin",
        fullName: "Admin Test",
        avatarUrl: null,
        role: "ADMIN",
        isVerified: true,
        adminProfile: {
          activeHours: null,
          trustScore: 98,
          responseTime: null,
          totalSuccess: 4,
          isActive: true,
        },
      },
    ],
  };

  assert.deepEqual(parseTransactionAdminListResponse(payload), payload);
  assert.equal(getApiErrorMessage({ error: "Gagal" }, "fallback"), "Gagal");
  assert.equal(getApiErrorMessage({ detail: "Gagal" }, "fallback"), "fallback");
});

test("transaction timeline retains historical progress for disputed/cancelled status", () => {
  const pendingTimeline = buildTransactionTimeline(makeTransaction());
  assert.deepEqual(pendingTimeline.map((step) => step.done), [true, false, false, false]);

  const paymentDisputed = makeTransaction({
    status: "DISPUTED",
    logs: [
      { action: "TRANSACTION_CREATED", timestamp: "2026-01-01T00:00:00.000Z" },
      { action: "PAYMENT_CONFIRMED", timestamp: "2026-01-01T01:00:00.000Z" },
    ],
  });
  assert.deepEqual(
    buildTransactionTimeline(paymentDisputed).map((step) => step.done),
    [true, true, false, false]
  );

  const handoverCancelled = makeTransaction({
    status: "CANCELLED",
    logs: [
      { action: "TRANSACTION_CREATED", timestamp: "2026-01-01T00:00:00.000Z" },
      { action: "PAYMENT_CONFIRMED", timestamp: "2026-01-01T01:00:00.000Z" },
      { action: "HANDOVER_STARTED", timestamp: "2026-01-01T02:00:00.000Z" },
    ],
  });
  assert.deepEqual(
    buildTransactionTimeline(handoverCancelled).map((step) => step.done),
    [true, true, true, false]
  );

  const terminalWithoutHistory = buildTransactionTimeline(
    makeTransaction({ status: "CANCELLED", logs: [] })
  );
  assert.deepEqual(terminalWithoutHistory.map((step) => step.done), [false, false, false, false]);

  const completedTimeline = buildTransactionTimeline(
    makeTransaction({ status: "COMPLETED", logs: [] })
  );
  assert.deepEqual(completedTimeline.map((step) => step.done), [true, true, true, true]);
});

test("transaction start policy preserves anonymous, role, self-purchase, listing, and admin guards", () => {
  assert.throws(
    () => assertBuyerCanStartTransaction(null),
    (error: unknown) => error instanceof TransactionApiError && error.statusCode === 401
  );
  assert.throws(
    () => assertBuyerCanStartTransaction({ id: "admin-1", role: Role.ADMIN }),
    (error: unknown) => error instanceof TransactionApiError && error.statusCode === 403
  );

  const buyer = { id: "buyer-1", role: Role.USER };
  const activeAdmin = { id: "admin-1", role: Role.ADMIN, adminProfile: { isActive: true } };
  const availableListing = { sellerId: "seller-1", status: ListingStatus.AVAILABLE };

  assert.throws(
    () => validateTransactionStartPolicy({ buyer, listing: { ...availableListing, sellerId: buyer.id }, admin: activeAdmin }),
    (error: unknown) => error instanceof TransactionApiError && error.statusCode === 400
  );
  assert.throws(
    () => validateTransactionStartPolicy({ buyer, listing: { ...availableListing, status: ListingStatus.SOLD }, admin: activeAdmin }),
    (error: unknown) => error instanceof TransactionApiError && error.statusCode === 409
  );
  assert.throws(
    () => validateTransactionStartPolicy({ buyer, listing: availableListing, admin: { ...activeAdmin, adminProfile: { isActive: false } } }),
    (error: unknown) => error instanceof TransactionApiError && error.statusCode === 400
  );
  assert.doesNotThrow(() =>
    validateTransactionStartPolicy({ buyer, listing: availableListing, admin: activeAdmin })
  );
});

test("transaction detail access remains participant-only and listing claim is single-winner", () => {
  const transaction = { buyerId: "buyer-1", sellerId: "seller-1", adminId: "admin-1" };
  assert.equal(isTransactionParticipant(transaction, "buyer-1"), true);
  assert.equal(isTransactionParticipant(transaction, "seller-1"), true);
  assert.equal(isTransactionParticipant(transaction, "admin-1"), true);
  assert.equal(isTransactionParticipant(transaction, "other-1"), false);
  assert.equal(isSuccessfulListingClaim(1), true);
  assert.equal(isSuccessfulListingClaim(0), false);
  assert.equal(isSuccessfulListingClaim(2), false);
});
