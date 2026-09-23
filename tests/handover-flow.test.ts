import assert from "node:assert/strict";
import { test } from "node:test";
import { ListingStatus, Role, TransactionStatus } from "@prisma/client";
import {
  getHandoverStatus,
  toHandoverSnapshot,
  HandoverServiceError,
} from "@/lib/handover-service";

function transaction(status: TransactionStatus) {
  return {
    id: "handover-test-transaction",
    buyerId: "buyer-1",
    sellerId: "seller-1",
    adminId: "admin-1",
    status,
    listing: { id: "listing-1", status: ListingStatus.IN_TRANSACTION },
    logs: [],
  };
}

test("handover status follows the persisted transaction lifecycle", () => {
  assert.equal(getHandoverStatus(TransactionStatus.PAYMENT_CONFIRMED), "READY");
  assert.equal(getHandoverStatus(TransactionStatus.IN_HANDOVER), "IN_PROGRESS");
  assert.equal(getHandoverStatus(TransactionStatus.COMPLETED), "COMPLETED");

  const snapshot = toHandoverSnapshot(transaction(TransactionStatus.PAYMENT_CONFIRMED), {
    id: "admin-1",
    role: Role.ADMIN,
  });

  assert.equal(snapshot.canStart, true);
  assert.equal(snapshot.canConfirm, false);
  assert.equal(snapshot.listingStatus, ListingStatus.IN_TRANSACTION);
});

test("handover snapshot exposes only transaction participants", () => {
  assert.throws(
    () =>
      toHandoverSnapshot(transaction(TransactionStatus.IN_HANDOVER), {
        id: "unrelated-user",
        role: Role.USER,
      }),
    (error: unknown) =>
      error instanceof HandoverServiceError &&
      error.statusCode === 403 &&
      error.code === "HANDOVER_ACCESS_DENIED"
  );
});

test("only the assigned admin can start and only the buyer can confirm", () => {
  const paymentConfirmed = transaction(TransactionStatus.PAYMENT_CONFIRMED);
  const adminSnapshot = toHandoverSnapshot(paymentConfirmed, { id: "admin-1", role: Role.ADMIN });
  const buyerSnapshot = toHandoverSnapshot(paymentConfirmed, { id: "buyer-1", role: Role.USER });

  assert.equal(adminSnapshot.canStart, true);
  assert.equal(buyerSnapshot.canStart, false);
  assert.equal(buyerSnapshot.canConfirm, false);

  const inHandover = toHandoverSnapshot(transaction(TransactionStatus.IN_HANDOVER), {
    id: "buyer-1",
    role: Role.USER,
  });
  assert.equal(inHandover.canConfirm, true);
});
