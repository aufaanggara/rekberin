import { z } from "zod";
import type { PaymentApiDetailResponse } from "@/types/payment-api";

const paymentSchema = z.object({
  id: z.string(), transactionId: z.string(), status: z.enum(["PENDING", "SETTLEMENT", "EXPIRE", "DENY", "CANCEL", "FAILURE"]),
  method: z.literal("QRIS"), amount: z.number().int().positive(), currency: z.literal("IDR"), acquirer: z.literal("gopay"),
  qrCodeUrl: z.string().url().nullable(), expiresAt: z.string().datetime().nullable(), paidAt: z.string().datetime().nullable(),
  orderId: z.string(), providerTransactionId: z.string().nullable(), lastSyncedAt: z.string().datetime().nullable(),
});

export function parsePaymentDetailResponse(value: unknown): PaymentApiDetailResponse {
  const parsed = z.object({ payment: paymentSchema }).safeParse(value);
  if (!parsed.success) throw new Error("Respons payment tidak valid.");
  return parsed.data;
}

export async function readPaymentResponse(response: Response) {
  try { return await response.json(); } catch { return null; }
}

export function getPaymentApiError(value: unknown, fallback: string) {
  if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") return value.error;
  return fallback;
}
