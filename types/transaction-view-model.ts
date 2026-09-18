import type { TimelineStep, TransactionStatus, UserProfile } from "@/types";

export interface TransactionViewModel {
  id: string;
  listing: {
    id: string;
    title: string;
    game: string;
    seller: UserProfile;
  };
  buyer: UserProfile;
  admin: {
    id: string;
    user: UserProfile;
    trustScore: number | null;
    totalSuccess: number | null;
    activeHours: string | null;
  };
  price: number;
  platformFee: number;
  adminFee: number;
  status: TransactionStatus;
  proofUrls: string[];
  logs: unknown[];
  timeline: TimelineStep[];
  checklist: { label: string; checked: boolean }[];
  createdAt: string;
}
