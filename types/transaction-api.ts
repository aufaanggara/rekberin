import type { Role, TransactionStatus, ListingStatus } from "@prisma/client";

export interface CreateTransactionRequest {
  listingId: string;
  /** User.id for the assigned admin, not AdminProfile.id. */
  adminId: string;
}

export interface TransactionApiUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  isVerified: boolean;
}

export interface TransactionApiAdminProfile {
  id: string;
  bio: string | null;
  activeHours: string | null;
  trustScore: number;
  responseTime: number | null;
  totalSuccess: number;
  isActive: boolean;
  joinedAt: string;
}

export interface TransactionApiAdmin extends TransactionApiUser {
  adminProfile: TransactionApiAdminProfile | null;
}

export interface TransactionApiListing {
  id: string;
  sellerId: string;
  title: string;
  game: string;
  price: number;
  description: string;
  details: unknown;
  images: string[];
  status: ListingStatus;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  seller: TransactionApiUser;
}

export interface TransactionApiResponse {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  /** User.id for the assigned admin. */
  adminId: string;
  price: number;
  platformFee: number;
  adminFee: number;
  status: TransactionStatus;
  notes: string | null;
  disputeReason: string | null;
  proofUrls: string[];
  logs: unknown[];
  checklist: unknown;
  createdAt: string;
  updatedAt: string;
  listing: TransactionApiListing;
  buyer: TransactionApiUser;
  seller: TransactionApiUser;
  admin: TransactionApiAdmin;
}

export interface TransactionApiListResponse {
  transactions: TransactionApiResponse[];
}

export interface TransactionApiDetailResponse {
  transaction: TransactionApiResponse;
}

export interface TransactionApiErrorResponse {
  error: string;
}

export interface TransactionAdminOption {
  /** User.id used as the transaction request's adminId. */
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  isVerified: boolean;
  adminProfile: {
    activeHours: string | null;
    trustScore: number;
    responseTime: number | null;
    totalSuccess: number;
    isActive: boolean;
  };
}

export interface TransactionAdminListResponse {
  admins: TransactionAdminOption[];
}
