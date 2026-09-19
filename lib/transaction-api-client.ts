import { z } from "zod";
import type {
  TransactionAdminListResponse,
  TransactionApiDetailResponse,
  TransactionApiListResponse,
} from "@/types/transaction-api";

const roleSchema = z.enum(["USER", "ADMIN", "SUPER_ADMIN"]);
const listingStatusSchema = z.enum([
  "AVAILABLE",
  "IN_TRANSACTION",
  "SOLD",
  "INACTIVE",
]);
const transactionStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "IN_HANDOVER",
  "PENDING_BUYER_CONFIRM",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
]);

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

const transactionApiUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  role: roleSchema,
  isVerified: z.boolean(),
});

const transactionApiAdminProfileSchema = z.object({
  id: z.string(),
  bio: z.string().nullable(),
  activeHours: z.string().nullable(),
  trustScore: z.number(),
  responseTime: z.number().nullable(),
  totalSuccess: z.number(),
  isActive: z.boolean(),
  joinedAt: z.string(),
});

const transactionApiAdminSchema = transactionApiUserSchema.extend({
  adminProfile: transactionApiAdminProfileSchema.nullable(),
});

const transactionApiListingSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  title: z.string(),
  game: z.string(),
  price: z.number(),
  description: z.string(),
  details: jsonValueSchema,
  images: z.array(z.string()),
  status: listingStatusSchema,
  isFeatured: z.boolean(),
  viewCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  seller: transactionApiUserSchema,
});

const transactionApiResponseSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  adminId: z.string(),
  price: z.number(),
  platformFee: z.number(),
  adminFee: z.number(),
  status: transactionStatusSchema,
  notes: z.string().nullable(),
  disputeReason: z.string().nullable(),
  proofUrls: z.array(z.string()),
  logs: z.array(jsonValueSchema),
  checklist: jsonValueSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  listing: transactionApiListingSchema,
  buyer: transactionApiUserSchema,
  seller: transactionApiUserSchema,
  admin: transactionApiAdminSchema,
});

const transactionAdminOptionSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  role: roleSchema,
  isVerified: z.boolean(),
  adminProfile: z.object({
    activeHours: z.string().nullable(),
    trustScore: z.number(),
    responseTime: z.number().nullable(),
    totalSuccess: z.number(),
    isActive: z.boolean(),
  }),
});

export const transactionApiListResponseSchema: z.ZodType<TransactionApiListResponse> = z.object({
  transactions: z.array(transactionApiResponseSchema),
});

export const transactionApiDetailResponseSchema: z.ZodType<TransactionApiDetailResponse> = z.object({
  transaction: transactionApiResponseSchema,
});

export const transactionAdminListResponseSchema: z.ZodType<TransactionAdminListResponse> = z.object({
  admins: z.array(transactionAdminOptionSchema),
});

export const transactionApiErrorResponseSchema: z.ZodType<{ error: string }> = z.object({
  error: z.string(),
});

export async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function getApiErrorMessage(payload: unknown, fallback: string) {
  const parsed = transactionApiErrorResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.error : fallback;
}

export function parseTransactionListResponse(
  payload: unknown
): TransactionApiListResponse {
  return transactionApiListResponseSchema.parse(payload);
}

export function parseTransactionDetailResponse(
  payload: unknown
): TransactionApiDetailResponse {
  return transactionApiDetailResponseSchema.parse(payload);
}

export function parseTransactionAdminListResponse(
  payload: unknown
): TransactionAdminListResponse {
  return transactionAdminListResponseSchema.parse(payload);
}
