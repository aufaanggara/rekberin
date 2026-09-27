import assert from "node:assert/strict";
import test from "node:test";
import { selectUserActivity } from "@/lib/user-activity";

test("dashboard activity separates buyer and seller, including chats before payment", () => {
  const negotiations = [
    { id: "chat-only", buyerId: "me", sellerId: "other", listing: { status: "AVAILABLE" }, transaction: null },
    { id: "offer-accepted", buyerId: "other", sellerId: "me", listing: { status: "AVAILABLE" }, transaction: null },
    { id: "checked-out", buyerId: "me", sellerId: "other", listing: { status: "IN_TRANSACTION" }, transaction: { id: "pending-payment" } },
  ];
  const transactions = [
    { id: "pending-payment", buyerId: "me", sellerId: "other", status: "PENDING_PAYMENT" },
    { id: "handover", buyerId: "other", sellerId: "me", status: "IN_HANDOVER" },
    { id: "completed", buyerId: "me", sellerId: "other", status: "COMPLETED" },
    { id: "cancelled", buyerId: "other", sellerId: "me", status: "CANCELLED" },
  ];

  const buyer = selectUserActivity("me", "buyer", negotiations, transactions);
  assert.deepEqual(buyer.negotiations.map((item) => item.id), ["chat-only"]);
  assert.deepEqual(buyer.ongoingTransactions.map((item) => item.id), ["pending-payment"]);
  assert.deepEqual(buyer.history.map((item) => item.id), ["completed"]);

  const seller = selectUserActivity("me", "seller", negotiations, transactions);
  assert.deepEqual(seller.negotiations.map((item) => item.id), ["offer-accepted"]);
  assert.deepEqual(seller.ongoingTransactions.map((item) => item.id), ["handover"]);
  assert.deepEqual(seller.history.map((item) => item.id), ["cancelled"]);
});
