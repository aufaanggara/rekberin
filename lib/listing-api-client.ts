import { z } from "zod";
import type {
  ListingApiDetailResponse,
  ListingApiListResponse,
  ListingApiResponse,
} from "@/types/listing-api";
import type { Listing } from "@/types";

const roleSchema = z.enum(["USER", "ADMIN", "SUPER_ADMIN"]);
const listingStatusSchema = z.enum([
  "AVAILABLE",
  "IN_TRANSACTION",
  "SOLD",
  "INACTIVE",
]);

const listingDetailsSchema = z.object({
  overall: z.number(),
  league: z.string(),
  coins: z.number(),
  gp: z.number(),
  players: z.array(z.string()),
  notes: z.string(),
  loginMethod: z.string().optional(),
  isNominus: z.boolean().optional(),
  cardTypes: z.array(z.string()).optional(),
  hasWarranty: z.boolean().optional(),
  region: z.string().optional(),
});

const listingUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  role: roleSchema,
  isVerified: z.boolean(),
});

const listingApiResponseSchema: z.ZodType<ListingApiResponse> = z.object({
  id: z.string(),
  sellerId: z.string(),
  title: z.string(),
  game: z.string(),
  price: z.number(),
  description: z.string(),
  details: listingDetailsSchema,
  images: z.array(z.string()),
  status: listingStatusSchema,
  isFeatured: z.boolean(),
  viewCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  seller: listingUserSchema,
});

const listingApiListResponseSchema: z.ZodType<ListingApiListResponse> = z.object({
  listings: z.array(listingApiResponseSchema),
});

const listingApiDetailResponseSchema: z.ZodType<ListingApiDetailResponse> = z.object({
  listing: listingApiResponseSchema,
});

export function parseListingListResponse(payload: unknown): ListingApiListResponse {
  return listingApiListResponseSchema.parse(payload);
}

export function parseListingDetailResponse(payload: unknown): ListingApiDetailResponse {
  return listingApiDetailResponseSchema.parse(payload);
}

export function mapListingApiToListing(listing: ListingApiResponse): Listing {
  return {
    id: listing.id,
    title: listing.title,
    game: listing.game,
    price: listing.price,
    description: listing.description,
    details: listing.details,
    images: listing.images,
    status: listing.status,
    isFeatured: listing.isFeatured,
    viewCount: listing.viewCount,
    createdAt: listing.createdAt,
    seller: {
      id: listing.seller.id,
      username: listing.seller.username,
      fullName: listing.seller.fullName,
      avatarUrl: listing.seller.avatarUrl ?? undefined,
      role: listing.seller.role,
      isVerified: listing.seller.isVerified,
    },
  };
}
