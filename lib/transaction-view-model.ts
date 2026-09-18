import type { TimelineStep, UserProfile } from "@/types";
import type {
  TransactionApiAdmin,
  TransactionApiResponse,
} from "@/types/transaction-api";
import type { TransactionViewModel } from "@/types/transaction-view-model";

function toUserProfile(user: {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserProfile["role"];
  isVerified: boolean;
}): UserProfile {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    isVerified: user.isVerified,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toChecklist(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.label !== "string") return [];

    return [
      {
        label: item.label,
        checked: item.checked === true,
      },
    ];
  });
}

function hasLogAction(logs: unknown[], actions: string[]) {
  return logs.some(
    (item) =>
      isRecord(item) &&
      typeof item.action === "string" &&
      actions.includes(item.action)
  );
}

function logTimestamp(logs: unknown[], actions: string[]) {
  const log = logs.find(
    (item) =>
      isRecord(item) &&
      typeof item.action === "string" &&
      actions.includes(item.action) &&
      typeof item.timestamp === "string"
  );

  return isRecord(log) && typeof log.timestamp === "string"
    ? log.timestamp
    : undefined;
}

export function buildTransactionTimeline(
  transaction: TransactionApiResponse
): TimelineStep[] {
  const statusProgress: Record<TransactionApiResponse["status"], number> = {
    PENDING_PAYMENT: 0,
    PAYMENT_CONFIRMED: 1,
    IN_HANDOVER: 2,
    PENDING_BUYER_CONFIRM: 3,
    COMPLETED: 4,
    DISPUTED: 0,
    CANCELLED: 0,
  };
  const isTerminalWithoutNormalStatus =
    transaction.status === "DISPUTED" || transaction.status === "CANCELLED";
  const progress = statusProgress[transaction.status];
  const paymentHistory = hasLogAction(transaction.logs, ["PAYMENT_CONFIRMED"]);
  const handoverHistory = hasLogAction(transaction.logs, [
    "HANDOVER_STARTED",
    "HANDOVER_COMPLETED",
  ]);
  const buyerConfirmationHistory = hasLogAction(transaction.logs, ["BUYER_CONFIRMED"]);
  const creationSupported = isTerminalWithoutNormalStatus
    ? hasLogAction(transaction.logs, ["TRANSACTION_CREATED"])
    : true;

  return [
    {
      label: "Transaksi dibuat",
      timestamp: logTimestamp(transaction.logs, ["TRANSACTION_CREATED"]),
      done: creationSupported,
    },
    {
      label: "Pembayaran dikonfirmasi",
      timestamp: logTimestamp(transaction.logs, ["PAYMENT_CONFIRMED"]),
      done: isTerminalWithoutNormalStatus ? paymentHistory : progress >= 1,
    },
    {
      label: "Serah terima akun",
      timestamp: logTimestamp(transaction.logs, ["HANDOVER_STARTED", "HANDOVER_COMPLETED"]),
      done: isTerminalWithoutNormalStatus ? handoverHistory : progress >= 2,
    },
    {
      label: "Konfirmasi buyer",
      timestamp: logTimestamp(transaction.logs, ["BUYER_CONFIRMED"]),
      done: isTerminalWithoutNormalStatus ? buyerConfirmationHistory : progress >= 4,
    },
  ];
}

function toAdminViewModel(admin: TransactionApiAdmin) {
  return {
    id: admin.id,
    user: toUserProfile(admin),
    trustScore: admin.adminProfile?.trustScore ?? null,
    totalSuccess: admin.adminProfile?.totalSuccess ?? null,
    activeHours: admin.adminProfile?.activeHours ?? null,
  };
}

export function mapTransactionApiToViewModel(
  transaction: TransactionApiResponse
): TransactionViewModel {
  return {
    id: transaction.id,
    listing: {
      id: transaction.listing.id,
      title: transaction.listing.title,
      game: transaction.listing.game,
      seller: toUserProfile(transaction.listing.seller),
    },
    buyer: toUserProfile(transaction.buyer),
    admin: toAdminViewModel(transaction.admin),
    price: transaction.price,
    platformFee: transaction.platformFee,
    adminFee: transaction.adminFee,
    status: transaction.status,
    proofUrls: transaction.proofUrls,
    logs: transaction.logs,
    timeline: buildTransactionTimeline(transaction),
    checklist: toChecklist(transaction.checklist),
    createdAt: transaction.createdAt,
  };
}
