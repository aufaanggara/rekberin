import { Prisma } from "@prisma/client";
import type { ListingDetailsApi, ListingApiResponse } from "@/types/listing-api";

export const publicListingSellerSelect = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  isVerified: true,
} as const;

export const listingInclude = {
  seller: { select: publicListingSellerSelect },
} satisfies Prisma.ListingInclude;

export type ListingWithSeller = Prisma.ListingGetPayload<{
  include: typeof listingInclude;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Normalizes legacy listing JSON so old rows remain safe for the live marketplace UI. */
export function normalizeListingDetails(value: unknown): ListingDetailsApi {
  const details = isRecord(value) ? value : {};

  return {
    overall: numberValue(details.overall, numberValue(details.rating)),
    league: stringValue(details.league, stringValue(details.division, "Belum tersedia")),
    coins: numberValue(details.coins),
    gp: numberValue(details.gp),
    players: stringArray(details.players).length
      ? stringArray(details.players)
      : stringArray(details.legends),
    notes: stringValue(details.notes),
    ...(optionalString(details.loginMethod)
      ? { loginMethod: optionalString(details.loginMethod) }
      : {}),
    ...(typeof details.isNominus === "boolean"
      ? { isNominus: details.isNominus }
      : {}),
    ...(stringArray(details.cardTypes).length
      ? { cardTypes: stringArray(details.cardTypes) }
      : {}),
    ...(typeof details.hasWarranty === "boolean"
      ? { hasWarranty: details.hasWarranty }
      : {}),
    ...(optionalString(details.region) ? { region: optionalString(details.region) } : {}),
  };
}

export function toListingApiDto(listing: ListingWithSeller): ListingApiResponse {
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    title: listing.title,
    game: listing.game,
    price: listing.price,
    description: listing.description,
    details: normalizeListingDetails(listing.details),
    images: listing.images,
    status: listing.status,
    isFeatured: listing.isFeatured,
    viewCount: listing.viewCount,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    seller: {
      id: listing.seller.id,
      username: listing.seller.username,
      fullName: listing.seller.fullName,
      avatarUrl: listing.seller.avatarUrl,
      role: listing.seller.role,
      isVerified: listing.seller.isVerified,
    },
  };
}
