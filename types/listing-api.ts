import type { ListingStatus } from "@prisma/client";
import type { TransactionApiUser } from "@/types/transaction-api";

export interface ListingDetailsApi {
  overall: number;
  league: string;
  coins: number;
  gp: number;
  players: string[];
  notes: string;
  loginMethod?: string;
  isNominus?: boolean;
  cardTypes?: string[];
  hasWarranty?: boolean;
  region?: string;
}

export interface ListingApiResponse {
  id: string;
  sellerId: string;
  title: string;
  game: string;
  price: number;
  description: string;
  details: ListingDetailsApi;
  images: string[];
  status: ListingStatus;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  seller: TransactionApiUser;
}

export interface ListingApiListResponse {
  listings: ListingApiResponse[];
}

export interface ListingApiDetailResponse {
  listing: ListingApiResponse;
}

export interface CreateListingRequest {
  title: string;
  game: string;
  price: number;
  description: string;
  details: ListingDetailsApi;
  images: string[];
}
