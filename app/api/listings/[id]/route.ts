import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listingInclude, toListingApiDto } from "@/lib/listings";
import type { ListingApiDetailResponse } from "@/types/listing-api";

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
