import { EscrowTransferKind, ListingStatus, Prisma, Role, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handoverDeadline } from "@/lib/handover-policy";

export class HandoverFlowError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "HandoverFlowError";
  }
}

export type HandoverAction =
  | "START"
  | "CONFIRM_RECEIPT"
  | "REPORT_ISSUE"
  | "RESUME"
  | "CANCEL"
  | "SET_WHATSAPP";

const handoverInclude = {
  listing: true,
  payment: true,
  escrowTransfer: true,
} as const;

type HandoverTransaction = Prisma.TransactionGetPayload<{ include: typeof handoverInclude }>;

async function lockTransaction(db: Prisma.TransactionClient, transactionId: string) {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${transactionId}))`;
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: handoverInclude,
  });
  if (!transaction) throw new HandoverFlowError(404, "Transaksi tidak ditemukan.");
  return transaction;
}

function isHandoverActive(status: TransactionStatus) {
  return status === TransactionStatus.PAYMENT_CONFIRMED ||
    status === TransactionStatus.IN_HANDOVER ||
    status === TransactionStatus.PENDING_BUYER_CONFIRM;
}

function result(transaction: HandoverTransaction) {
  return {
    status: transaction.status,
    listingStatus: transaction.listing.status,
    handoverDeadlineAt: transaction.handoverDeadlineAt?.toISOString() ?? null,
    transfer: transaction.escrowTransfer
      ? {
          kind: transaction.escrowTransfer.kind,
          amount: transaction.escrowTransfer.amount,
          status: transaction.escrowTransfer.status,
          reference: transaction.escrowTransfer.reference,
        }
      : null,
  };
}

async function finish(
  db: Prisma.TransactionClient,
  transaction: HandoverTransaction,
  kind: EscrowTransferKind,
  action: string,
  actorId: string,
  now: Date
) {
  if (transaction.listing.status !== ListingStatus.IN_TRANSACTION) {
    throw new HandoverFlowError(409, "Status listing berubah. Muat ulang transaksi.");
  }
  const listingUpdate = await db.listing.updateMany({
    where: { id: transaction.listingId, status: ListingStatus.IN_TRANSACTION },
    data: { status: kind === EscrowTransferKind.SELLER_PAYOUT ? ListingStatus.SOLD : ListingStatus.AVAILABLE },
  });
  if (listingUpdate.count !== 1) {
    throw new HandoverFlowError(409, "Status listing berubah. Muat ulang transaksi.");
  }
  await db.transaction.update({
    where: { id: transaction.id },
    data: {
      status: kind === EscrowTransferKind.SELLER_PAYOUT
        ? TransactionStatus.COMPLETED
        : TransactionStatus.CANCELLED,
      handoverPausedAt: null,
      logs: { push: { action, actorId, timestamp: now.toISOString() } },
    },
  });
  const transfer = await db.escrowTransfer.create({
    data: {
      transactionId: transaction.id,
      recipientId: kind === EscrowTransferKind.SELLER_PAYOUT ? transaction.sellerId : transaction.buyerId,
      kind,
      amount: kind === EscrowTransferKind.SELLER_PAYOUT
        ? transaction.price
        : transaction.payment?.amount ?? transaction.price + transaction.platformFee + transaction.adminFee,
      reference: `DUMMY-${kind}-${transaction.id}`,
    },
  });
  return {
    status: kind === EscrowTransferKind.SELLER_PAYOUT ? TransactionStatus.COMPLETED : TransactionStatus.CANCELLED,
    listingStatus: kind === EscrowTransferKind.SELLER_PAYOUT ? ListingStatus.SOLD : ListingStatus.AVAILABLE,
    handoverDeadlineAt: transaction.handoverDeadlineAt?.toISOString() ?? null,
    transfer: { kind: transfer.kind, amount: transfer.amount, status: transfer.status, reference: transfer.reference },
  };
}

function normalizedWhatsapp(value: string | null | undefined) {
  if (value === null || value === undefined || value.trim() === "") return null;
  const digits = value.replace(/\D/g, "");
  const number = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new HandoverFlowError(400, "Nomor WhatsApp harus berformat internasional yang valid.");
  }
  return number;
}

export async function runHandoverAction(
  transactionId: string,
  actor: { id: string; role: Role },
  action: HandoverAction,
  details: { reason?: string; whatsapp?: string | null } = {},
  now = new Date()
) {
  return prisma.$transaction(async (db) => {
    const transaction = await lockTransaction(db, transactionId);
    const isAdmin =
      transaction.adminId === actor.id &&
      (actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN);
    const isBuyer = transaction.buyerId === actor.id && actor.role === Role.USER;
    const isSeller = transaction.sellerId === actor.id && actor.role === Role.USER;
    if (!isAdmin && !isBuyer && !isSeller) {
      throw new HandoverFlowError(403, "Anda bukan pihak dalam transaksi ini.");
    }

    if (action === "START") {
      if (!isAdmin) throw new HandoverFlowError(403, "Hanya admin transaksi ini yang dapat memulai serah terima.");
      if (transaction.status === TransactionStatus.IN_HANDOVER) return result(transaction);
      if (transaction.status !== TransactionStatus.PAYMENT_CONFIRMED ||
          transaction.listing.status !== ListingStatus.IN_TRANSACTION) {
        throw new HandoverFlowError(409, "Pembayaran belum dikonfirmasi.");
      }
      // Legacy PAYMENT_CONFIRMED records predate automatic handover. Use the
      // server's reconciliation timestamp as the closest confirmation time.
      const startedAt = transaction.payment?.lastSyncedAt ?? transaction.updatedAt;
      const deadline = handoverDeadline(startedAt);
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.IN_HANDOVER,
          handoverStartedAt: startedAt,
          handoverDeadlineAt: deadline,
          logs: { push: { action: "HANDOVER_STARTED", actorId: actor.id, timestamp: now.toISOString() } },
        },
      });
      return { ...result(transaction), status: TransactionStatus.IN_HANDOVER, handoverDeadlineAt: deadline.toISOString() };
    }

    if (action === "CONFIRM_RECEIPT") {
      if (!isBuyer) throw new HandoverFlowError(403, "Hanya buyer transaksi ini yang dapat mengonfirmasi akun.");
      if (transaction.status === TransactionStatus.COMPLETED &&
          transaction.escrowTransfer?.kind === EscrowTransferKind.SELLER_PAYOUT) return result(transaction);
      if (!isHandoverActive(transaction.status)) {
        throw new HandoverFlowError(409, "Penerimaan akun belum dapat dikonfirmasi.");
      }
      return finish(db, transaction, EscrowTransferKind.SELLER_PAYOUT, "BUYER_CONFIRMED", actor.id, now);
    }

    if (action === "REPORT_ISSUE") {
      if (!isBuyer) throw new HandoverFlowError(403, "Hanya buyer transaksi ini yang dapat melaporkan masalah.");
      if (!isHandoverActive(transaction.status) ||
          !transaction.handoverDeadlineAt ||
          transaction.handoverDeadlineAt <= now) {
        throw new HandoverFlowError(409, "Waktu laporan telah berakhir atau transaksi tidak aktif.");
      }
      const reason = details.reason?.trim();
      if (!reason || reason.length < 10 || reason.length > 1000) {
        throw new HandoverFlowError(400, "Jelaskan masalah dalam 10 sampai 1000 karakter.");
      }
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.DISPUTED,
          disputeReason: reason,
          handoverPausedAt: now,
          adminJoinedAt: now,
          logs: { push: { action: "ISSUE_REPORTED", actorId: actor.id, timestamp: now.toISOString() } },
        },
      });
      return { ...result(transaction), status: TransactionStatus.DISPUTED };
    }

    if (action === "RESUME") {
      if (!isAdmin) throw new HandoverFlowError(403, "Hanya admin transaksi ini yang dapat melanjutkan.");
      if (transaction.status !== TransactionStatus.DISPUTED || !transaction.handoverPausedAt) {
        throw new HandoverFlowError(409, "Transaksi tidak sedang ditahan karena masalah.");
      }
      const originalDeadline = transaction.handoverDeadlineAt ?? handoverDeadline(transaction.handoverPausedAt);
      const pauseDuration = now.getTime() - transaction.handoverPausedAt.getTime();
      const deadline = new Date(originalDeadline.getTime() + Math.max(0, pauseDuration));
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.IN_HANDOVER,
          handoverDeadlineAt: deadline,
          handoverPausedAt: null,
          logs: { push: { action: "ADMIN_RESUMED", actorId: actor.id, timestamp: now.toISOString() } },
        },
      });
      return { ...result(transaction), status: TransactionStatus.IN_HANDOVER, handoverDeadlineAt: deadline.toISOString() };
    }

    if (action === "CANCEL") {
      if (!isAdmin) throw new HandoverFlowError(403, "Hanya admin transaksi ini yang dapat membatalkan.");
      if (transaction.status === TransactionStatus.CANCELLED &&
          transaction.escrowTransfer?.kind === EscrowTransferKind.BUYER_REFUND) return result(transaction);
      if (transaction.status !== TransactionStatus.DISPUTED) {
        throw new HandoverFlowError(409, "Admin hanya dapat membatalkan transaksi yang dilaporkan.");
      }
      return finish(db, transaction, EscrowTransferKind.BUYER_REFUND, "ADMIN_CANCELLED", actor.id, now);
    }

    if (!isBuyer && !isSeller) {
      throw new HandoverFlowError(403, "Hanya buyer dan seller yang dapat membagikan kontak WhatsApp.");
    }
    if (!isHandoverActive(transaction.status) && transaction.status !== TransactionStatus.DISPUTED) {
      throw new HandoverFlowError(409, "Kontak WhatsApp hanya tersedia selama serah terima.");
    }
    const whatsapp = normalizedWhatsapp(details.whatsapp);
    await db.transaction.update({
      where: { id: transactionId },
      data: isBuyer ? { buyerWhatsapp: whatsapp } : { sellerWhatsapp: whatsapp },
    });
    return { ...result(transaction), whatsapp };
  }, { maxWait: 15_000, timeout: 30_000 });
}

export async function releaseExpiredHandover(transactionId: string, now = new Date()) {
  return prisma.$transaction(async (db) => {
    const transaction = await lockTransaction(db, transactionId);
    if (!isHandoverActive(transaction.status) ||
        !transaction.handoverDeadlineAt ||
        transaction.handoverDeadlineAt > now) return null;
    return finish(db, transaction, EscrowTransferKind.SELLER_PAYOUT, "AUTO_RELEASED", "system", now);
  }, { maxWait: 15_000, timeout: 30_000 });
}

export async function processExpiredHandovers(now = new Date()) {
  const due = await prisma.transaction.findMany({
    where: {
      status: { in: [TransactionStatus.PAYMENT_CONFIRMED, TransactionStatus.IN_HANDOVER, TransactionStatus.PENDING_BUYER_CONFIRM] },
      handoverDeadlineAt: { lte: now },
    },
    select: { id: true },
    take: 50,
  });
  let released = 0;
  for (const transaction of due) {
    if (await releaseExpiredHandover(transaction.id, now)) released += 1;
  }
  return released;
}
