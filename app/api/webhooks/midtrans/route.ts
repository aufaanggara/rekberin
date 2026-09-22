import { NextResponse } from "next/server";
import { readMidtransConfig } from "@/lib/payments/midtrans-config";
import { parseMidtransAmount } from "@/lib/payments/payment-domain";
import { MidtransWebhookValidationError, parseMidtransWebhookPayload, verifyMidtransNotificationSignature } from "@/lib/payments/midtrans-webhook";
import { reconcileWebhook, PaymentServiceError } from "@/lib/payments/payment-service";
import type { MidtransTransaction } from "@/lib/payments/midtrans";

export async function POST(request: Request) {
  const noStore = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const payload = parseMidtransWebhookPayload(await request.json());
    const config = readMidtransConfig();
    if (!verifyMidtransNotificationSignature(payload, config.serverKey)) return noStore({ error: "Notification tidak valid." }, 401);
    const provider: MidtransTransaction = {
      orderId: payload.orderId, transactionId: payload.transactionId, amount: payload.amount, currency: payload.currency,
      paymentType: payload.paymentType, acquirer: payload.acquirer ? "gopay" : null,
      transactionStatus: payload.transactionStatus, qrCodeUrl: null, expiresAt: payload.expiryTime, paidAt: payload.settlementTime,
    };
    await reconcileWebhook(provider, parseMidtransAmount(payload.grossAmountRaw));
    return noStore({ ok: true });
  } catch (error) {
    if (error instanceof MidtransWebhookValidationError || error instanceof SyntaxError) return noStore({ error: "Notification tidak valid." }, 400);
    if (error instanceof PaymentServiceError && error.code === "WEBHOOK_MISMATCH") return noStore({ error: error.message }, 400);
    console.error("Midtrans webhook operational error");
    return noStore({ error: "Notification belum dapat diproses." }, 503);
  }
}
