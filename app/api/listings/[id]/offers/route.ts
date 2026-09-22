import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOffer, getOffersByListing, updateOfferStatus } from "@/lib/offers";

const createOfferSchema = z.object({
  offeredPrice: z.number().int().min(10000).max(100000000),
  notes: z.string().max(500).optional(),
});

const updateOfferSchema = z.object({
  offerId: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string } | undefined;

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { seller: { select: { id: true, username: true, fullName: true } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const offers = getOffersByListing(params.id);

  // If seller: show all offers. If buyer: show their own offer. If guest: empty.
  if (!user?.id) {
    return NextResponse.json({ offers: [] });
  }

  if (listing.sellerId === user.id) {
    return NextResponse.json({ offers });
  }

  const userOffers = offers.filter((o) => o.buyerId === user.id);
  return NextResponse.json({ offers: userOffers });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { error: "Seller cannot submit offer on their own listing" },
      { status: 400 }
    );
  }

  if (listing.status !== "AVAILABLE") {
    return NextResponse.json(
      { error: "Listing is not available for negotiation" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid offer payload", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const offer = createOffer({
    listingId: params.id,
    buyerId: user.id,
    buyerName: user.name || "Pembeli",
    sellerId: listing.sellerId,
    originalPrice: listing.price,
    offeredPrice: parsed.data.offeredPrice,
    notes: parsed.data.notes,
  });

  return NextResponse.json({ offer }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
  });

  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = updateOfferStatus(parsed.data.offerId, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json({ offer: updated });
}
