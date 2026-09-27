import { getServerSession } from "next-auth";
import { ListingStatus, Prisma, Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  TransactionApiAdmin,
  TransactionApiAdminProfile,
  TransactionApiListing,
  TransactionApiResponse,
  TransactionApiUser,
} from "@/types/transaction-api";

const publicUserSelect = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  isVerified: true,
} as const;

const publicAdminProfileSelect = {
  id: true,
  bio: true,
  activeHours: true,
  trustScore: true,
  responseTime: true,
  totalSuccess: true,
  isActive: true,
  joinedAt: true,
} as const;

export const transactionInclude = {
  escrowTransfer: true,
  listing: {
    include: {
      seller: { select: publicUserSelect },
    },
  },
  buyer: { select: publicUserSelect },
  seller: { select: publicUserSelect },
  admin: {
    select: {
      ...publicUserSelect,
      adminProfile: { select: publicAdminProfileSelect },
    },
  },
} satisfies Prisma.TransactionInclude;

export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export class TransactionApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "TransactionApiError";
  }
}

export function assertBuyerCanStartTransaction(
  user: { id: string; role: Role } | null
): asserts user is { id: string; role: Role } {
  if (!user) {
    throw new TransactionApiError(401, "Buyer harus login terlebih dahulu.");
  }

  if (user.role !== Role.USER) {
    throw new TransactionApiError(403, "Hanya user buyer yang dapat memulai transaksi.");
  }
}

export function validateTransactionStartPolicy(input: {
  buyer: { id: string; role: Role };
  listing: { sellerId: string; status: ListingStatus } | null;
  admin: {
    id: string;
    role: Role;
    adminProfile: { isActive: boolean } | null;
  } | null;
}) {
  const { buyer, listing, admin } = input;

  if (!listing) {
    throw new TransactionApiError(404, "Listing tidak ditemukan.");
  }

  if (listing.sellerId === buyer.id) {
    throw new TransactionApiError(400, "Seller tidak dapat membeli listing sendiri.");
  }

  if (listing.status !== "AVAILABLE") {
    throw new TransactionApiError(409, "Listing sudah tidak tersedia.");
  }

  if (
    !admin ||
    !allowedAdminRoles.some((allowedRole) => allowedRole === admin.role) ||
    !admin.adminProfile?.isActive
  ) {
    throw new TransactionApiError(400, "Admin Rekber tidak valid atau tidak aktif.");
  }
}

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: unknown } | undefined;
  const userId = typeof sessionUser?.id === "string" ? sessionUser.id : null;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
}

export function isTransactionParticipant(
  transaction: Pick<TransactionWithRelations, "buyerId" | "sellerId" | "adminId">,
  userId: string
) {
  return [transaction.buyerId, transaction.sellerId, transaction.adminId].includes(userId);
}

export function isSuccessfulListingClaim(count: number) {
  return count === 1;
}

// Supabase's pooled connection can add a few seconds of latency while the
// listing claim and transaction record are committed atomically.
const TRANSACTION_CREATE_OPTIONS = {
  maxWait: 15_000,
  timeout: 30_000,
} as const;

export async function createTransactionForBuyer(input: {
  buyer: { id: string; role: Role };
  listingId: string;
  adminUserId: string;
  negotiationId?: string;
}) {
  return prisma.$transaction(async (db) => {
    const negotiation = input.negotiationId
      ? await (async () => {
          await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.negotiationId}))`;
          return db.negotiation.findUnique({ where: { id: input.negotiationId } });
        })()
      : null;
    if (input.negotiationId && (
      !negotiation ||
      negotiation.buyerId !== input.buyer.id ||
      negotiation.listingId !== input.listingId ||
      negotiation.offerStatus !== "ACCEPTED" ||
      negotiation.offeredPrice === null
    )) {
      throw new TransactionApiError(409, "Tawaran belum diterima penjual.");
    }
    if (input.negotiationId) {
      const existing = await db.transaction.findUnique({
        where: { negotiationId: input.negotiationId },
        include: transactionInclude,
      });
      if (existing) return existing;
    }
    const listing = await db.listing.findUnique({
      where: { id: input.listingId },
    });

    const admin = await db.user.findUnique({
      where: { id: input.adminUserId },
      select: {
        id: true,
        role: true,
        adminProfile: { select: { isActive: true } },
      },
    });

    validateTransactionStartPolicy({
      buyer: input.buyer,
      listing,
      admin,
    });

    if (!listing) {
      throw new TransactionApiError(404, "Listing tidak ditemukan.");
    }
    if (!admin) {
      throw new TransactionApiError(400, "Admin Rekber tidak valid atau tidak aktif.");
    }

    const listingClaim = await db.listing.updateMany({
      where: {
        id: listing.id,
        status: ListingStatus.AVAILABLE,
      },
      data: { status: ListingStatus.IN_TRANSACTION },
    });

    if (!isSuccessfulListingClaim(listingClaim.count)) {
      throw new TransactionApiError(409, "Listing baru saja diambil oleh transaksi lain.");
    }

    const transaction = await db.transaction.create({
      data: {
        negotiationId: input.negotiationId,
        listingId: listing.id,
        buyerId: input.buyer.id,
        sellerId: listing.sellerId,
        adminId: admin.id,
        price: negotiation?.offeredPrice ?? listing.price,
        proofUrls: [],
        logs: [
          {
            action: "TRANSACTION_CREATED",
            actorId: input.buyer.id,
            timestamp: new Date().toISOString(),
          },
        ],
        checklist: [],
      },
      include: transactionInclude,
    });
    if (input.negotiationId) {
      const messages = await db.negotiationMessage.findMany({
        where: { negotiationId: input.negotiationId },
        orderBy: { createdAt: "asc" },
      });
      if (messages.length) {
        await db.chatMessage.createMany({
          data: messages.map((message) => ({
            transactionId: transaction.id,
            senderId: message.senderId,
            message: message.message,
            createdAt: message.createdAt,
          })),
        });
      }
    }
    return transaction;
  }, TRANSACTION_CREATE_OPTIONS);
}

function toApiUser(user: {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  isVerified: boolean;
}): TransactionApiUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isVerified: user.isVerified,
  };
}

function toApiAdminProfile(
  profile: NonNullable<TransactionWithRelations["admin"]["adminProfile"]>
): TransactionApiAdminProfile {
  return {
    id: profile.id,
    bio: profile.bio,
    activeHours: profile.activeHours,
    trustScore: profile.trustScore,
    responseTime: profile.responseTime,
    totalSuccess: profile.totalSuccess,
    isActive: profile.isActive,
    joinedAt: profile.joinedAt.toISOString(),
  };
}

function toApiListing(
  listing: TransactionWithRelations["listing"]
): TransactionApiListing {
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    title: listing.title,
    game: listing.game,
    price: listing.price,
    description: listing.description,
    details: listing.details,
    images: listing.images,
    status: listing.status,
    isFeatured: listing.isFeatured,
    viewCount: listing.viewCount,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    seller: toApiUser(listing.seller),
  };
}

/** Maps Prisma data to the public transaction API DTO. No UI timeline is inferred here. */
export function toTransactionApiDto(
  transaction: TransactionWithRelations
): TransactionApiResponse {
  const admin: TransactionApiAdmin = {
    ...toApiUser(transaction.admin),
    adminProfile: transaction.admin.adminProfile
      ? toApiAdminProfile(transaction.admin.adminProfile)
      : null,
  };

  return {
    id: transaction.id,
    listingId: transaction.listingId,
    buyerId: transaction.buyerId,
    sellerId: transaction.sellerId,
    // This field is intentionally the assigned admin's User.id.
    adminId: transaction.adminId,
    price: transaction.price,
    platformFee: transaction.platformFee,
    adminFee: transaction.adminFee,
    status: transaction.status,
    notes: transaction.notes,
    disputeReason: transaction.disputeReason,
    proofUrls: transaction.proofUrls,
    logs: transaction.logs,
    checklist: transaction.checklist,
    handover: {
      startedAt: transaction.handoverStartedAt?.toISOString() ?? null,
      deadlineAt: transaction.handoverDeadlineAt?.toISOString() ?? null,
      pausedAt: transaction.handoverPausedAt?.toISOString() ?? null,
      adminJoinedAt: transaction.adminJoinedAt?.toISOString() ?? null,
      buyerWhatsapp: transaction.buyerWhatsapp,
      sellerWhatsapp: transaction.sellerWhatsapp,
    },
    escrowTransfer: transaction.escrowTransfer
      ? {
          kind: transaction.escrowTransfer.kind,
          amount: transaction.escrowTransfer.amount,
          provider: transaction.escrowTransfer.provider,
          status: transaction.escrowTransfer.status,
          reference: transaction.escrowTransfer.reference,
        }
      : null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
    listing: toApiListing(transaction.listing),
    buyer: toApiUser(transaction.buyer),
    seller: toApiUser(transaction.seller),
    admin,
  };
}

export const allowedAdminRoles = [Role.ADMIN, Role.SUPER_ADMIN] as const;
