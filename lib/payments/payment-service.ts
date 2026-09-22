import { ListingStatus, PaymentStatus, Prisma, TransactionStatus, type Payment } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePaymentAmount, createPaymentOrderId } from "@/lib/payments/payment-domain";
import { createMidtransGateway, type MidtransGateway, type MidtransTransaction } from "@/lib/payments/midtrans";
import type { PaymentApiResponse } from "@/types/payment-api";

export class PaymentServiceError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly code = "PAYMENT_ERROR") { super(message); this.name = "PaymentServiceError"; }
}

const PAYMENT_CREATE_TRANSACTION_OPTIONS = {
  maxWait: 5_000,
  timeout: 30_000,
} as const;

type PersistedPayment = Pick<Payment, "id" | "transactionId" | "status" | "amount" | "qrCodeUrl" | "expiresAt" | "paidAt" | "orderId" | "providerTransactionId" | "lastSyncedAt">;

function publicPayment(payment: PersistedPayment): PaymentApiResponse {
  return {
    id: payment.id,
    transactionId: payment.transactionId,
    status: payment.status,
    method: "QRIS",
    amount: payment.amount,
    currency: "IDR",
    acquirer: "gopay",
    qrCodeUrl: payment.qrCodeUrl,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    paidAt: payment.paidAt?.toISOString() ?? null,
    orderId: payment.orderId,
    providerTransactionId: payment.providerTransactionId,
    lastSyncedAt: payment.lastSyncedAt?.toISOString() ?? null,
  };
}

function providerStatusToPayment(value: MidtransTransaction["transactionStatus"]): PaymentStatus { return value.toUpperCase() as PaymentStatus; }

function assertProviderMatches(payment: { orderId: string; amount: number; currency: string; acquirer: string }, provider: MidtransTransaction) {
  if (provider.orderId !== payment.orderId || provider.amount !== payment.amount || provider.currency !== "IDR" || provider.paymentType !== "qris" || (provider.acquirer && provider.acquirer !== payment.acquirer)) throw new PaymentServiceError(502, "Respons QRIS tidak cocok dengan transaksi.", "MIDTRANS_RESPONSE_MISMATCH");
}

export function reconcilePaymentData(payment: { status: PaymentStatus; transactionId: string; amount: number; orderId: string; currency: string; acquirer: string }, provider: MidtransTransaction) {
  // Payment states are monotonic. Once terminal, a late or contradictory
  // notification cannot reopen or downgrade the payment lifecycle.
  if (payment.status !== PaymentStatus.PENDING) return null;
  assertProviderMatches(payment, provider);
  const incoming = providerStatusToPayment(provider.transactionStatus);
  return incoming;
}

async function applyReconciliation(db: Prisma.TransactionClient, paymentId: string, provider: MidtransTransaction, notified: boolean) {
  const identity = await db.payment.findUnique({ where: { id: paymentId }, select: { transactionId: true } });
  if (!identity) throw new PaymentServiceError(404, "Payment tidak ditemukan.", "PAYMENT_NOT_FOUND");
  // Serialize webhook, sync, and create/recovery work for this transaction. The
  // unique Payment.transactionId constraint remains the final database guard.
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${identity.transactionId}))`;
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { transaction: true } });
  if (!payment) throw new PaymentServiceError(404, "Payment tidak ditemukan.", "PAYMENT_NOT_FOUND");
  const nextStatus = reconcilePaymentData(payment, provider);
  if (!nextStatus) return payment;
  const now = new Date();
  const terminalFailure = nextStatus === PaymentStatus.EXPIRE || nextStatus === PaymentStatus.DENY || nextStatus === PaymentStatus.CANCEL || nextStatus === PaymentStatus.FAILURE;
  const transactionIsAwaitingPayment = payment.transaction.status === TransactionStatus.PENDING_PAYMENT;
  const confirmsTransaction = nextStatus === PaymentStatus.SETTLEMENT && transactionIsAwaitingPayment;
  const cancelsTransaction = terminalFailure && transactionIsAwaitingPayment;
  const txStatus = confirmsTransaction ? TransactionStatus.PAYMENT_CONFIRMED : cancelsTransaction ? TransactionStatus.CANCELLED : payment.transaction.status;
  const listingStatus = cancelsTransaction ? ListingStatus.AVAILABLE : undefined;
  const transitionLog = confirmsTransaction
    ? "PAYMENT_CONFIRMED"
    : nextStatus === PaymentStatus.EXPIRE && cancelsTransaction
      ? "PAYMENT_EXPIRED"
      : nextStatus === PaymentStatus.DENY && cancelsTransaction
        ? "PAYMENT_DENIED"
        : nextStatus === PaymentStatus.CANCEL && cancelsTransaction
          ? "PAYMENT_CANCELLED"
          : nextStatus === PaymentStatus.FAILURE && cancelsTransaction
            ? "PAYMENT_FAILED"
            : null;
  await db.payment.update({ where: { id: payment.id }, data: { status: nextStatus, providerTransactionId: provider.transactionId ?? undefined, providerPaymentType: provider.paymentType, qrCodeUrl: provider.qrCodeUrl ?? undefined, expiresAt: provider.expiresAt ?? undefined, paidAt: nextStatus === PaymentStatus.SETTLEMENT ? (provider.paidAt ?? now) : undefined, lastSyncedAt: now, lastNotifiedAt: notified ? now : undefined } });
  if (confirmsTransaction || cancelsTransaction) {
    await db.transaction.update({ where: { id: payment.transactionId }, data: { status: txStatus, ...(transitionLog ? { logs: { push: { action: transitionLog, actorId: "midtrans", timestamp: now.toISOString() } } } : {}) } });
  }
  if (listingStatus) await db.listing.updateMany({ where: { id: payment.transaction.listingId, status: ListingStatus.IN_TRANSACTION }, data: { status: listingStatus } });
  return db.payment.findUniqueOrThrow({ where: { id: payment.id } });
}

export async function getPaymentForBuyer(transactionId: string, buyerId: string) {
  const payment = await prisma.payment.findFirst({ where: { transactionId, transaction: { buyerId } } });
  return payment ? publicPayment(payment) : null;
}

export async function createOrRecoverPayment(transactionId: string, buyerId: string, gateway: MidtransGateway = createMidtransGateway()) {
  try {
    const persistedPayment = await prisma.$transaction(async (db) => {
      await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${transactionId}))`;
      const transaction = await db.transaction.findFirst({ where: { id: transactionId, buyerId }, include: { listing: true, payment: true } });
      if (!transaction) throw new PaymentServiceError(404, "Transaksi tidak ditemukan.", "TRANSACTION_NOT_FOUND");
      if (transaction.status !== TransactionStatus.PENDING_PAYMENT) throw new PaymentServiceError(409, "Transaksi tidak sedang menunggu pembayaran.", "TRANSACTION_NOT_PAYABLE");
      const amount = calculatePaymentAmount(transaction);
      const orderId = createPaymentOrderId(transaction.id);
      let payment = transaction.payment;
      if (payment && payment.amount !== amount) throw new PaymentServiceError(409, "Nominal payment transaksi sudah berubah.", "PAYMENT_AMOUNT_MISMATCH");
      if (payment?.qrCodeUrl) return payment;
      if (!payment) payment = await db.payment.create({ data: { transactionId: transaction.id, orderId, amount, currency: "IDR", acquirer: "gopay" } });
      const existing =
        await gateway.getTransactionStatus(payment.orderId);

      if (existing) {
        console.log("Existing Midtrans transaction:", {
          orderId: existing.orderId,
          status: existing.transactionStatus,
          qrCodeUrl: existing.qrCodeUrl,
        });
      }

      const provider =
        existing ??
        await gateway.chargeQris({
          orderId: payment.orderId,
          amount: payment.amount,
          itemName: transaction.listing.title,
        });

      assertProviderMatches(payment, provider);

      return applyReconciliation(
        db,
        payment.id,
        provider,
        false
      );
    }, PAYMENT_CREATE_TRANSACTION_OPTIONS);
    return publicPayment(persistedPayment);
  } catch (error) {
    if (error instanceof PaymentServiceError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const recovered = await getPaymentForBuyer(transactionId, buyerId);
      if (recovered) return recovered;
      throw new PaymentServiceError(503, "Payment sedang dipulihkan. Coba lagi.", "PAYMENT_RECOVERY_PENDING");
    }
    throw error;
  }
}

export async function syncPayment(transactionId: string, buyerId: string, gateway: MidtransGateway = createMidtransGateway()) {
  const payment = await prisma.payment.findFirst({ where: { transactionId, transaction: { buyerId } } });
  if (!payment) throw new PaymentServiceError(404, "Payment belum dibuat.", "PAYMENT_NOT_FOUND");
  try {
    const provider = await gateway.getTransactionStatus(payment.orderId);
    if (!provider) return publicPayment(payment);
    return publicPayment(await prisma.$transaction((db) => applyReconciliation(db, payment.id, provider, false)));
  } catch (error) {
    if (error instanceof PaymentServiceError) throw error;
    throw new PaymentServiceError(503, "Status payment belum dapat disinkronkan. Coba lagi nanti.", "MIDTRANS_UNAVAILABLE");
  }
}

export async function reconcileWebhook(payload: MidtransTransaction & { orderId: string }, serverAmount: number) {
  const payment = await prisma.payment.findUnique({ where: { orderId: payload.orderId } });
  if (!payment || payment.amount !== serverAmount) throw new PaymentServiceError(400, "Notification tidak cocok dengan payment.", "WEBHOOK_MISMATCH");
  return prisma.$transaction((db) => applyReconciliation(db, payment.id, payload, true));
}
