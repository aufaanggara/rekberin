import type { PaymentStatus } from "@prisma/client";

export interface PaymentApiResponse {
  id: string;
  transactionId: string;
  status: PaymentStatus;
  method: "QRIS";
  amount: number;
  currency: "IDR";
  acquirer: "gopay";
  qrCodeUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  orderId: string;
  providerTransactionId: string | null;
  lastSyncedAt: string | null;
}

export interface PaymentApiDetailResponse { payment: PaymentApiResponse; }
export interface PaymentApiErrorResponse { error: string; code?: string; }
