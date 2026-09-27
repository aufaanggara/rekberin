import { ListingStatus, OfferStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTransactionForBuyer, TransactionApiError } from "@/lib/transactions";

export class NegotiationError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "NegotiationError";
  }
}

export const negotiationInclude = {
  listing: { select: { id: true, title: true, price: true, status: true, images: true } },
  buyer: { select: { id: true, username: true, fullName: true } },
  seller: { select: { id: true, username: true, fullName: true } },
  transaction: { select: { id: true, status: true } },
} as const;

type NegotiationWithRelations = Prisma.NegotiationGetPayload<{ include: typeof negotiationInclude }>;

export function toNegotiationDto(item: NegotiationWithRelations) {
  return {
    id: item.id,
    listingId: item.listingId,
    buyerId: item.buyerId,
    sellerId: item.sellerId,
    offeredPrice: item.offeredPrice,
    offerNotes: item.offerNotes,
    offerStatus: item.offerStatus,
    version: item.version,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    listing: item.listing,
    buyer: item.buyer,
    seller: item.seller,
    transaction: item.transaction,
  };
}

export async function openNegotiation(listingId: string, buyer: { id: string; role: Role }) {
  if (buyer.role !== Role.USER) throw new NegotiationError(403, "Hanya buyer yang dapat membuka negosiasi.");
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NegotiationError(404, "Listing tidak ditemukan.");
  if (listing.sellerId === buyer.id) throw new NegotiationError(403, "Seller tidak dapat menawar listing sendiri.");
  const existing = await prisma.negotiation.findUnique({
    where: { listingId_buyerId: { listingId, buyerId: buyer.id } },
    include: negotiationInclude,
  });
  if (existing) return toNegotiationDto(existing);
  if (listing.status !== ListingStatus.AVAILABLE) throw new NegotiationError(409, "Listing tidak tersedia.");
  try {
    const created = await prisma.negotiation.create({
      data: { listingId, buyerId: buyer.id, sellerId: listing.sellerId },
      include: negotiationInclude,
    });
    return toNegotiationDto(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await prisma.negotiation.findUnique({
        where: { listingId_buyerId: { listingId, buyerId: buyer.id } },
        include: negotiationInclude,
      });
      if (concurrent) return toNegotiationDto(concurrent);
    }
    throw error;
  }
}

export async function getNegotiation(id: string, userId: string) {
  const negotiation = await prisma.negotiation.findUnique({
    where: { id },
    include: negotiationInclude,
  });
  if (!negotiation) throw new NegotiationError(404, "Negosiasi tidak ditemukan.");
  if (negotiation.buyerId !== userId && negotiation.sellerId !== userId) {
    throw new NegotiationError(403, "Anda bukan pihak dalam negosiasi ini.");
  }
  return negotiation;
}

export async function listNegotiations(userId: string) {
  const negotiations = await prisma.negotiation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: negotiationInclude,
    orderBy: { updatedAt: "desc" },
  });
  return negotiations.map(toNegotiationDto);
}

export async function changeOffer(
  id: string,
  actor: { id: string; role: Role },
  action: "OFFER" | "ACCEPT" | "REJECT",
  input: { price?: number; notes?: string; version?: number }
) {
  return prisma.$transaction(async (db) => {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    const negotiation = await db.negotiation.findUnique({
      where: { id },
      include: negotiationInclude,
    });
    if (!negotiation) throw new NegotiationError(404, "Negosiasi tidak ditemukan.");
    if (negotiation.listing.status !== ListingStatus.AVAILABLE || negotiation.transaction) {
      throw new NegotiationError(409, "Listing sudah masuk transaksi.");
    }
    if (action === "OFFER") {
      if (actor.role !== Role.USER || negotiation.buyerId !== actor.id) {
        throw new NegotiationError(403, "Hanya buyer negosiasi ini yang dapat menawar.");
      }
      if (negotiation.offerStatus === OfferStatus.ACCEPTED) {
        throw new NegotiationError(409, "Tawaran sudah diterima. Lanjutkan ke pembayaran.");
      }
      if (!Number.isInteger(input.price) || !input.price || input.price < 10_000 ||
          input.price > negotiation.listing.price) {
        throw new NegotiationError(400, "Harga tawaran harus antara Rp10.000 dan harga listing.");
      }
      const updated = await db.negotiation.update({
        where: { id },
        data: {
          offeredPrice: input.price,
          offerNotes: input.notes?.trim().slice(0, 500) || null,
          offerStatus: OfferStatus.PENDING,
          version: { increment: 1 },
        },
        include: negotiationInclude,
      });
      return toNegotiationDto(updated);
    }
    if (actor.role !== Role.USER || negotiation.sellerId !== actor.id) {
      throw new NegotiationError(403, "Hanya seller negosiasi ini yang dapat merespons tawaran.");
    }
    if (negotiation.offerStatus !== OfferStatus.PENDING || negotiation.offeredPrice === null ||
        input.version !== negotiation.version) {
      throw new NegotiationError(409, "Tawaran telah berubah. Muat ulang negosiasi.");
    }
    const updated = await db.negotiation.update({
      where: { id },
      data: {
        offerStatus: action === "ACCEPT" ? OfferStatus.ACCEPTED : OfferStatus.REJECTED,
        version: { increment: 1 },
      },
      include: negotiationInclude,
    });
    return toNegotiationDto(updated);
  });
}

export async function checkoutNegotiation(id: string, buyer: { id: string; role: Role }) {
  const negotiation = await getNegotiation(id, buyer.id);
  if (buyer.role !== Role.USER || negotiation.buyerId !== buyer.id) {
    throw new NegotiationError(403, "Hanya buyer yang dapat melanjutkan pembayaran.");
  }
  if (negotiation.transaction) return negotiation.transaction.id;
  if (negotiation.offerStatus !== OfferStatus.ACCEPTED) {
    throw new NegotiationError(409, "Tawaran belum diterima penjual.");
  }
  const admin = await prisma.user.findFirst({
    where: {
      role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
      adminProfile: { is: { isActive: true } },
    },
    orderBy: { username: "asc" },
    select: { id: true },
  });
  if (!admin) throw new NegotiationError(503, "Admin Rekber belum tersedia.");
  try {
    const transaction = await createTransactionForBuyer({
      buyer,
      listingId: negotiation.listingId,
      adminUserId: admin.id,
      negotiationId: id,
    });
    return transaction.id;
  } catch (error) {
    if (error instanceof TransactionApiError) throw new NegotiationError(error.statusCode, error.message);
    throw error;
  }
}
