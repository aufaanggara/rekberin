import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/transactions";
import { listingInclude, toListingApiDto } from "@/lib/listings";
import type {
  ListingApiDetailResponse,
  UpdateListingRequest,
} from "@/types/listing-api";

export const dynamic = "force-dynamic";

// ── Zod schemas ────────────────────────────────────────────────────────

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

const updateListingSchema: z.ZodType<UpdateListingRequest> = z.object({
  title: z.string().trim().min(5).max(160).optional(),
  game: z.string().trim().min(1).max(80).optional(),
  price: z.number().int().positive().max(2_000_000_000).optional(),
  description: z.string().trim().max(5000).optional(),
  details: listingDetailsSchema.optional(),
  images: z.array(z.string().min(1).max(5_000_000)).max(8).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["INACTIVE", "AVAILABLE"]),
});

// ── GET /api/listings/[id] ─────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: listingInclude,
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing tidak ditemukan." }, { status: 404 });
    }

    const response: ListingApiDetailResponse = {
      listing: toListingApiDto(listing),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/listings/[id] failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil listing." },
      { status: 500 }
    );
  }
}

// ── PUT /api/listings/[id] — Edit listing ──────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Auth check
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  }

  // 2. Find listing
  const existing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { id: true, sellerId: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Listing tidak ditemukan." }, { status: 404 });
  }

  // 3. Ownership check — seller cannot edit another user's listing
  if (existing.sellerId !== user.id) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengedit listing ini." },
      { status: 403 }
    );
  }

  // 4. Status guard — cannot edit listings that are in transaction or sold
  if (existing.status === "IN_TRANSACTION") {
    return NextResponse.json(
      { error: "Listing sedang dalam transaksi aktif dan tidak dapat diedit." },
      { status: 409 }
    );
  }
  if (existing.status === "SOLD") {
    return NextResponse.json(
      { error: "Listing yang sudah terjual tidak dapat diedit." },
      { status: 409 }
    );
  }

  // 5. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    console.error("ZOD VALIDATION FAILED (PUT):", errorMessages);
    return NextResponse.json(
      { error: `Data tidak valid: ${errorMessages}` },
      { status: 400 }
    );
  }

  // 6. Build update data — only include fields that were actually sent
  const updateData: Prisma.ListingUpdateInput = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.game !== undefined) updateData.game = parsed.data.game;
  if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.details !== undefined)
    updateData.details = parsed.data.details as unknown as Prisma.InputJsonValue;
  if (parsed.data.images !== undefined) updateData.images = parsed.data.images;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada field yang akan diubah." },
      { status: 400 }
    );
  }

  try {
    const listing = await prisma.listing.update({
      where: { id: params.id },
      data: updateData,
      include: listingInclude,
    });

    const response: ListingApiDetailResponse = {
      listing: toListingApiDto(listing),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("PUT /api/listings/[id] failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengupdate listing." },
      { status: 500 }
    );
  }
}

// ── PATCH /api/listings/[id] — Deactivate / Reactivate ─────────────────

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Auth check
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  }

  // 2. Find listing
  const existing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { id: true, sellerId: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Listing tidak ditemukan." }, { status: 404 });
  }

  // 3. Ownership check
  if (existing.sellerId !== user.id) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengubah status listing ini." },
      { status: 403 }
    );
  }

  // 4. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Status tidak valid. Gunakan INACTIVE atau AVAILABLE." },
      { status: 400 }
    );
  }

  // 5. Validate status transition
  const targetStatus = parsed.data.status;

  if (targetStatus === "INACTIVE") {
    // Can only deactivate from AVAILABLE
    if (existing.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Hanya listing dengan status AVAILABLE yang dapat dinonaktifkan." },
        { status: 409 }
      );
    }
  } else if (targetStatus === "AVAILABLE") {
    // Can only reactivate from INACTIVE
    if (existing.status !== "INACTIVE") {
      return NextResponse.json(
        { error: "Hanya listing dengan status INACTIVE yang dapat diaktifkan kembali." },
        { status: 409 }
      );
    }
  }

  try {
    const listing = await prisma.listing.update({
      where: { id: params.id },
      data: { status: targetStatus },
      include: listingInclude,
    });

    const response: ListingApiDetailResponse = {
      listing: toListingApiDto(listing),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("PATCH /api/listings/[id] failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengubah status listing." },
      { status: 500 }
    );
  }
}
