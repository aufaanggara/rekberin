import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  isMidtransQrisStatus,
  parseMidtransAmount,
  parseMidtransTimestamp,
  type MidtransQrisStatus,
} from "@/lib/payments/payment-domain";

const midtransNotificationSchema = z.object({
  order_id: z.string().min(1).max(100),
  status_code: z.string().min(1).max(16),
  gross_amount: z.string().regex(/^\d+(?:\.0{1,2})?$/),
  signature_key: z.string().regex(/^[a-f0-9]{128}$/),
  transaction_status: z.string().min(1).max(40),
  transaction_id: z.string().min(1).max(120).optional(),
  payment_type: z.literal("qris"),
  currency: z.literal("IDR"),
  acquirer: z.string().trim().min(1).toLowerCase().max(40).optional(),
  settlement_time: z.string().min(1).max(64).optional(),
  expiry_time: z.string().min(1).max(64).optional(),
});

export interface MidtransWebhookPayload {
  orderId: string;
  statusCode: string;
  grossAmountRaw: string;
  amount: number;
  signatureKey: string;
  transactionStatus: MidtransQrisStatus;
  transactionId: string | null;
  paymentType: "qris";
  currency: "IDR";
  acquirer: string | null;
  settlementTime: Date | null;
  expiryTime: Date | null;
}

export class MidtransWebhookValidationError extends Error {
  constructor(message = "Notification Midtrans tidak valid.") {
    super(message);
    this.name = "MidtransWebhookValidationError";
  }
}

export function parseMidtransWebhookPayload(payload: unknown): MidtransWebhookPayload {
  const parsed = midtransNotificationSchema.safeParse(payload);
  if (!parsed.success || !isMidtransQrisStatus(parsed.data?.transaction_status ?? "")) {
    throw new MidtransWebhookValidationError();
  }

  let amount: number;
  try {
    amount = parseMidtransAmount(parsed.data.gross_amount);
  } catch {
    throw new MidtransWebhookValidationError();
  }

  const acquirer = parsed.data.acquirer ?? null;
  if (acquirer && acquirer !== "gopay") {
    throw new MidtransWebhookValidationError("Acquirer notification tidak sesuai QRIS Sandbox.");
  }

  let settlementTime: Date | null;
  let expiryTime: Date | null;
  try {
    settlementTime = parseMidtransTimestamp(parsed.data.settlement_time);
    expiryTime = parseMidtransTimestamp(parsed.data.expiry_time);
  } catch {
    throw new MidtransWebhookValidationError("Waktu notification Midtrans tidak valid.");
  }

  return {
    orderId: parsed.data.order_id,
    statusCode: parsed.data.status_code,
    grossAmountRaw: parsed.data.gross_amount,
    amount,
    signatureKey: parsed.data.signature_key,
    transactionStatus: parsed.data.transaction_status as MidtransQrisStatus,
    transactionId: parsed.data.transaction_id ?? null,
    paymentType: parsed.data.payment_type,
    currency: parsed.data.currency,
    acquirer,
    settlementTime,
    expiryTime,
  };
}

export function verifyMidtransNotificationSignature(
  payload: Pick<MidtransWebhookPayload, "orderId" | "statusCode" | "grossAmountRaw" | "signatureKey">,
  serverKey: string
) {
  const expected = createHash("sha512")
    .update(`${payload.orderId}${payload.statusCode}${payload.grossAmountRaw}${serverKey}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(payload.signatureKey, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
