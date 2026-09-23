import { ListingStatus, Role, TransactionStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type HandoverAction = "START" | "CONFIRM_RECEIPT";

export type HandoverActor = {
  id: string;
  role: Role;
};

export type HandoverStatus = "WAITING_PAYMENT" | "READY" | "IN_PROGRESS" | "COMPLETED";

export class HandoverServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "HANDOVER_ERROR"
  ) {
    super(message);
    this.name = "HandoverServiceError";
  }
}

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];
const CONFIRMABLE_STATUSES: TransactionStatus[] = [
  TransactionStatus.IN_HANDOVER,
  TransactionStatus.PENDING_BUYER_CONFIRM,
];

type HandoverTransaction = {
  id: string;
  buyerId: string;
  sellerId: string;
  adminId: string;
  status: TransactionStatus;
  listing: {
    id: string;
    status: ListingStatus;
  };
  logs: Prisma.JsonValue[];
};

function isRecord(value: Prisma.JsonValue | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function logTimestamp(logs: Prisma.JsonValue[], action: string) {
  const log = logs.find(
    (entry) => isRecord(entry) && entry.action === action && typeof entry.timestamp === "string"
  );

  return isRecord(log) && typeof log.timestamp === "string" ? log.timestamp : null;
}

export function getHandoverStatus(status: TransactionStatus): HandoverStatus {
  switch (status) {
    case TransactionStatus.PAYMENT_CONFIRMED:
      return "READY";
    case TransactionStatus.IN_HANDOVER:
    case TransactionStatus.PENDING_BUYER_CONFIRM:
      return "IN_PROGRESS";
    case TransactionStatus.COMPLETED:
      return "COMPLETED";
    default:
      return "WAITING_PAYMENT";
  }
}

function assertParticipant(transaction: Pick<HandoverTransaction, "buyerId" | "sellerId" | "adminId">, actorId: string) {
  if (![transaction.buyerId, transaction.sellerId, transaction.adminId].includes(actorId)) {
    throw new HandoverServiceError(403, "Anda bukan bagian dari transaksi ini.", "HANDOVER_ACCESS_DENIED");
  }
}

function assertAssignedAdmin(transaction: Pick<HandoverTransaction, "adminId">, actor: HandoverActor) {
  if (!ADMIN_ROLES.includes(actor.role) || transaction.adminId !== actor.id) {
    throw new HandoverServiceError(403, "Hanya admin yang ditugaskan pada transaksi ini yang dapat memulai handover.", "HANDOVER_ADMIN_ONLY");
  }
}

function assertBuyer(transaction: Pick<HandoverTransaction, "buyerId">, actor: HandoverActor) {
  if (transaction.buyerId !== actor.id) {
    throw new HandoverServiceError(403, "Hanya buyer transaksi ini yang dapat mengonfirmasi penerimaan akun.", "HANDOVER_BUYER_ONLY");
  }
}

export function toHandoverSnapshot(transaction: HandoverTransaction, actor: HandoverActor) {
  assertParticipant(transaction, actor.id);

  return {
    transactionId: transaction.id,
    status: getHandoverStatus(transaction.status),
    transactionStatus: transaction.status,
    listingStatus: transaction.listing.status,
    handoverStartedAt: logTimestamp(transaction.logs, "HANDOVER_STARTED"),
    confirmedAt: logTimestamp(transaction.logs, "BUYER_CONFIRMED"),
    canStart:
      transaction.adminId === actor.id &&
      ADMIN_ROLES.includes(actor.role) &&
      transaction.status === TransactionStatus.PAYMENT_CONFIRMED,
    canConfirm:
      transaction.buyerId === actor.id &&
      CONFIRMABLE_STATUSES.includes(transaction.status),
  };
}

async function findTransaction(db: Prisma.TransactionClient, transactionId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      adminId: true,
      status: true,
      logs: true,
      listing: { select: { id: true, status: true } },
    },
  });

  if (!transaction) {
    throw new HandoverServiceError(404, "Transaksi tidak ditemukan.", "TRANSACTION_NOT_FOUND");
  }

  return transaction;
}

export async function getHandoverSnapshot(transactionId: string, actor: HandoverActor) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      adminId: true,
      status: true,
      logs: true,
      listing: { select: { id: true, status: true } },
    },
  });

  if (!transaction) {
    throw new HandoverServiceError(404, "Transaksi tidak ditemukan.", "TRANSACTION_NOT_FOUND");
  }

  return toHandoverSnapshot(transaction, actor);
}

export async function transitionHandover(
  transactionId: string,
  actor: HandoverActor,
  action: HandoverAction
) {
  return prisma.$transaction(async (db) => {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${transactionId}))`;

    const transaction = await findTransaction(db, transactionId);

    if (action === "START") {
      assertAssignedAdmin(transaction, actor);

      if (transaction.status === TransactionStatus.IN_HANDOVER) {
        return toHandoverSnapshot(transaction, actor);
      }

      if (transaction.status !== TransactionStatus.PAYMENT_CONFIRMED) {
        throw new HandoverServiceError(409, "Handover hanya dapat dimulai setelah pembayaran dikonfirmasi.", "HANDOVER_INVALID_STATUS");
      }

      const now = new Date().toISOString();
      const updated = await db.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.IN_HANDOVER,
          logs: {
            push: {
              action: "HANDOVER_STARTED",
              actorId: actor.id,
              timestamp: now,
            },
          },
        },
        select: {
          id: true,
          buyerId: true,
          sellerId: true,
          adminId: true,
          status: true,
          logs: true,
          listing: { select: { id: true, status: true } },
        },
      });

      return toHandoverSnapshot(updated, actor);
    }

    assertBuyer(transaction, actor);

    if (transaction.status === TransactionStatus.COMPLETED) {
      return toHandoverSnapshot(transaction, actor);
    }

    if (!CONFIRMABLE_STATUSES.includes(transaction.status)) {
      throw new HandoverServiceError(409, "Akun belum berada dalam proses handover.", "HANDOVER_INVALID_STATUS");
    }

    if (transaction.listing.status !== ListingStatus.IN_TRANSACTION) {
      throw new HandoverServiceError(409, "Listing transaksi tidak lagi berada dalam status aktif.", "LISTING_INVALID_STATUS");
    }

    const now = new Date().toISOString();
    const updated = await db.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.COMPLETED,
        logs: {
          push: {
            action: "BUYER_CONFIRMED",
            actorId: actor.id,
            timestamp: now,
          },
        },
      },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        adminId: true,
        status: true,
        logs: true,
        listing: { select: { id: true, status: true } },
      },
    });

    const listingUpdate = await db.listing.updateMany({
      where: {
        id: transaction.listing.id,
        status: ListingStatus.IN_TRANSACTION,
      },
      data: { status: ListingStatus.SOLD },
    });

    if (listingUpdate.count !== 1) {
      throw new HandoverServiceError(409, "Listing gagal ditandai sebagai terjual.", "LISTING_UPDATE_CONFLICT");
    }

    return toHandoverSnapshot(
      {
        ...updated,
        listing: { ...updated.listing, status: ListingStatus.SOLD },
      },
      actor
    );
  });
}
