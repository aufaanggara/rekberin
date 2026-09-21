import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/transactions";
import { listingInclude, toListingApiDto } from "@/lib/listings";
import type {
  CreateListingRequest,
  ListingApiDetailResponse,
  ListingApiListResponse,
} from "@/types/listing-api";

export const dynamic = "force-dynamic";

const listingDetailsSchema = z.object({
  overall: z.number().int().nonnegative(),
  league: z.string().trim().min(1).max(80),
  coins: z.number().int().nonnegative(),
  gp: z.number().int().nonnegative(),
  players: z.array(z.string().trim().min(1).max(120)).max(100),
  notes: z.string().trim().max(2000),
  loginMethod: z.string().trim().min(1).max(80).optional(),
  isNominus: z.boolean().optional(),
  cardTypes: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  hasWarranty: z.boolean().optional(),
  region: z.string().trim().min(1).max(80).optional(),
});

const createListingSchema: z.ZodType<CreateListingRequest> = z.object({
  title: z.string().trim().min(5).max(160),
  game: z.string().trim().min(1).max(80),
  price: z.number().int().positive().max(2_000_000_000),
  description: z.string().trim().min(10).max(5000),
  details: listingDetailsSchema,
  images: z.array(z.string().min(1).max(5_000_000)).max(8),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";

    let whereClause: Prisma.ListingWhereInput = {};

    if (mine) {
      const user = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
      }
      whereClause = { sellerId: user.id };
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: listingInclude,
    });

    const response: ListingApiListResponse = {
      listings: listings.map(toListingApiDto),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/listings failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil listing." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  }
  if (user.role !== Role.USER) {
    return NextResponse.json(
      { error: "Hanya user buyer/seller yang dapat membuat listing." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data listing belum lengkap atau tidak valid." },
      { status: 400 }
    );
  }

  try {
    const listing = await prisma.listing.create({
      data: {
        sellerId: user.id,
        title: parsed.data.title,
        game: parsed.data.game,
        price: parsed.data.price,
        description: parsed.data.description,
        details: parsed.data.details as unknown as Prisma.InputJsonValue,
        images: parsed.data.images,
      },
      include: listingInclude,
    });

    const response: ListingApiDetailResponse = {
      listing: toListingApiDto(listing),
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat listing." },
      { status: 500 }
    );
  }
}
