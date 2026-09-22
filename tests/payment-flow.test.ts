import assert from "node:assert/strict";
import test from "node:test";
import { calculatePaymentAmount, createPaymentOrderId } from "@/lib/payments/payment-domain";
import { createMidtransGateway, isSafeMidtransQrCodeUrl, parseMidtransTransactionResponse } from "@/lib/payments/midtrans";
import { parseMidtransWebhookPayload, verifyMidtransNotificationSignature } from "@/lib/payments/midtrans-webhook";
import { createHash } from "node:crypto";
import { reconcilePaymentData } from "@/lib/payments/payment-service";
import { POST as midtransWebhookPost } from "@/app/api/webhooks/midtrans/route";

test("payment amount is authoritative and integer-only", () => {
  assert.equal(calculatePaymentAmount({ price: 250000, platformFee: 500, adminFee: 1000 }), 251500);
  assert.throws(() => calculatePaymentAmount({ price: 0, platformFee: 500, adminFee: 1000 }));
  assert.throws(() => calculatePaymentAmount({ price: 100, platformFee: -1, adminFee: 0 }));
});

test("order id is deterministic", () => {
  assert.equal(createPaymentOrderId("tx_123"), "rekberin-qris-tx_123");
  assert.equal(createPaymentOrderId("tx_123"), createPaymentOrderId("tx_123"));
});

test("provider parser accepts official Midtrans QR hosts, derives expiry, and rejects other URLs", () => {
  const parsed = parseMidtransTransactionResponse({
    order_id: "rekberin-qris-tx_123", transaction_id: "provider-1", gross_amount: "251500.00", currency: "IDR",
    payment_type: "qris", acquirer: "gopay", transaction_status: "pending", transaction_time: "2026-09-22 12:00:00",
    actions: [{ name: "generate-qr-code-v2", url: "https://api.midtrans.com/v4/qris/provider-1/qr-code" }],
  }, { requireQrCode: true });
  assert.equal(parsed.amount, 251500);
  assert.equal(parsed.qrCodeUrl, "https://api.midtrans.com/v4/qris/provider-1/qr-code");
  assert.equal(parsed.expiresAt?.toISOString(), "2026-09-22T05:15:00.000Z");
  assert.throws(() => parseMidtransTransactionResponse({ order_id: "x", gross_amount: "1", transaction_status: "pending", currency: "IDR", payment_type: "qris", acquirer: "gopay" }, { requireQrCode: true }));
  assert.equal(isSafeMidtransQrCodeUrl("https://api.midtrans.com/v2/qris/provider-1/qr-code"), true);
  assert.equal(isSafeMidtransQrCodeUrl("https://api.midtrans.com/v4/qris/provider-1/qr-code"), true);
  assert.equal(isSafeMidtransQrCodeUrl("https://attacker.example/v4/qris/provider-1/qr-code"), false);
});

test("charge request uses the exact Sandbox custom_expiry Core API body", async () => {
  let requestBody: unknown;
  const gateway = createMidtransGateway({
    environment: "sandbox",
    serverKey: "sandbox-test-key",
    notificationUrl: "https://sandbox.example.test/api/webhooks/midtrans",
    qrisAcquirer: "gopay",
    qrisExpiryMinutes: 15,
    apiBaseUrl: "https://api.sandbox.midtrans.com",
  }, async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ order_id: "order-1", transaction_id: "provider-1", gross_amount: "251500", currency: "IDR", payment_type: "qris", acquirer: "gopay", transaction_status: "pending", actions: [{ name: "generate-qr-code", url: "https://api.sandbox.midtrans.com/v2/qris/provider-1/qr-code" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  });

  await gateway.chargeQris({ orderId: "order-1", amount: 251500, itemName: "Demo" });
  assert.deepEqual(requestBody, {
    payment_type: "qris",
    transaction_details: { order_id: "order-1", gross_amount: 251500 },
    item_details: [{ id: "transaction-order-1", price: 251500, quantity: 1, name: "Demo" }],
    qris: { acquirer: "gopay" },
    custom_expiry: { expiry_duration: 15, unit: "minute" },
  });
});

test("webhook signature uses raw gross amount and SHA512", () => {
  const serverKey = "sandbox-test-key";
  const raw = "251500.00";
  const signatureKey = createHash("sha512").update(`order-1200${raw}${serverKey}`).digest("hex");
  const payload = parseMidtransWebhookPayload({ order_id: "order-1", status_code: "200", gross_amount: raw, signature_key: signatureKey, transaction_status: "settlement", payment_type: "qris", currency: "IDR" });
  assert.equal(verifyMidtransNotificationSignature(payload, serverKey), true);
  assert.equal(verifyMidtransNotificationSignature(payload, "wrong"), false);
});

test("webhook parser rejects another acquirer and parses provider timestamps", () => {
  const signatureKey = "a".repeat(128);
  const payload = parseMidtransWebhookPayload({ order_id: "order-1", status_code: "200", gross_amount: "100", signature_key: signatureKey, transaction_status: "settlement", payment_type: "qris", currency: "IDR", acquirer: "gopay", settlement_time: "2026-09-22 12:00:00", expiry_time: "2026-09-22 12:15:00" });
  assert.equal(payload.settlementTime?.toISOString(), "2026-09-22T05:00:00.000Z");
  assert.equal(payload.expiryTime?.toISOString(), "2026-09-22T05:15:00.000Z");
  assert.throws(() => parseMidtransWebhookPayload({ order_id: "order-1", status_code: "200", gross_amount: "100", signature_key: signatureKey, transaction_status: "pending", payment_type: "qris", currency: "IDR", acquirer: "shopeepay" }));
  assert.throws(() => parseMidtransWebhookPayload({ order_id: "order-1", status_code: "200", gross_amount: "100", signature_key: signatureKey, transaction_status: "pending", payment_type: "qris", currency: "IDR", acquirer: "gopay", expiry_time: "not-a-time" }));
});

test("webhook validation errors are HTTP 400 and uncached", async () => {
  const response = await midtransWebhookPost(new Request("https://app.example.test/api/webhooks/midtrans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ order_id: "order-1", status_code: "200", gross_amount: "100", signature_key: "a".repeat(128), transaction_status: "pending", payment_type: "qris", currency: "IDR", acquirer: "shopeepay" }),
  }));
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("reconciliation ignores stale or contradictory provider states", () => {
  const provider = { orderId: "order-1", transactionId: "provider-1", amount: 100, currency: "IDR" as const, paymentType: "qris" as const, acquirer: "gopay" as const, transactionStatus: "failure" as const, qrCodeUrl: null, expiresAt: null, paidAt: null };
  assert.equal(reconcilePaymentData({ status: "SETTLEMENT", transactionId: "tx", amount: 100, orderId: "order-1", currency: "IDR", acquirer: "gopay" }, provider), null);
  assert.equal(reconcilePaymentData({ status: "FAILURE", transactionId: "tx", amount: 100, orderId: "order-1", currency: "IDR", acquirer: "gopay" }, { ...provider, transactionStatus: "failure" }), null);
});
