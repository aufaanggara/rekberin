export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export type ListingStatus = "AVAILABLE" | "IN_TRANSACTION" | "SOLD" | "INACTIVE";

export type TransactionStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "IN_HANDOVER"
  | "PENDING_BUYER_CONFIRM"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  whatsapp?: string;
  role: Role;
  isVerified: boolean;
  rating?: number;
  totalTransactions?: number;
}

export interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface AdminProfile {
  id: string;
  user: UserProfile;
  bio: string;
  fee: number;
  bankAccounts: BankAccount[];
  activeHours: string;
  trustScore: number;
  responseTime: number; // minutes
  totalSuccess: number;
  joinedAt: string;
}

export interface ListingDetails {
  overall: number;
  league: string;
  coins: number;
  gp: number;
  players: string[];
  notes: string;
  loginMethod?: string; // e.g. "Konami ID", "Moonton", "Google Play"
  isNominus?: boolean;  // Tautan bersih / no minus
  cardTypes?: string[]; // e.g. ["Epic Booster", "Big Time", "Show Time"]
  hasWarranty?: boolean;// Garansi anti hackback
  region?: string;      // e.g. "Indonesia", "Global"
}

export interface Listing {
  id: string;
  seller: UserProfile;
  title: string;
  game: string;
  price: number;
  description: string;
  details: ListingDetails;
  images: string[];
  status: ListingStatus;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
}

export interface TimelineStep {
  label: string;
  timestamp?: string;
  done: boolean;
}

export interface Transaction {
  id: string;
  listing: Listing;
  buyer: UserProfile;
  admin: AdminProfile;
  price: number;
  platformFee: number;
  adminFee: number;
  status: TransactionStatus;
  notes?: string;
  proofUrls: string[];
  timeline: TimelineStep[];
  checklist: { label: string; checked: boolean }[];
  createdAt: string;
}

export interface Review {
  id: string;
  giverName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type ChatSenderRole = "BUYER" | "SELLER" | "ADMIN";

export type ChatTabStage = "NEGOTIATION" | "REKBER" | "HANDOVER" | "DISBURSEMENT";

export interface ChatMessage {
  id: string;
  transactionId: string;
  stage?: ChatTabStage;
  senderRole: ChatSenderRole;
  senderName: string;
  message: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentType?: "IMAGE" | "FILE";
}

export type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface PriceOffer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  originalPrice: number;
  offeredPrice: number;
  notes?: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface OtpLogEntry {
  id: string;
  transactionId: string;
  action: "REQUEST" | "SUBMIT";
  actorRole: ChatSenderRole;
  actorName: string;
  codeMasked?: string;
  timestamp: string;
}

export interface AccountCredentials {
  loginMethod: string;
  accountEmail: string;
  accountPassword: string;
  backupCodes?: string;
  notes?: string;
  submittedAt: string;
}

export type PaymentMethodType = "QRIS" | "VA_BCA" | "VA_MANDIRI" | "VA_BRI" | "GOPAY";
