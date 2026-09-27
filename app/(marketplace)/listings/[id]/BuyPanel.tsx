"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Tag } from "lucide-react";
import type { ListingStatus } from "@/types";
import { toast } from "sonner";

export function BuyPanel({
  listingId,
  listingStatus,
  compact = false,
}: {
  listingId: string;
  listingStatus: ListingStatus;
  compact?: boolean;
}) {
  const router = useRouter();
  const [opening, setOpening] = useState<"chat" | "offer" | null>(null);

  async function open(mode: "chat" | "offer") {
    if (listingStatus !== "AVAILABLE" || opening) return;
    setOpening(mode);
    try {
      const response = await fetch("/api/negotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/listings/${listingId}`)}`);
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Ruang negosiasi belum dapat dibuka.");
      router.push(`/user/negotiations/${payload.negotiation.id}${mode === "offer" ? "?focus=offer" : ""}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Ruang negosiasi belum dapat dibuka.");
      setOpening(null);
    }
  }

  if (listingStatus !== "AVAILABLE") {
    return <p className="rounded-xl bg-slate-100 p-3 text-center text-sm font-semibold text-slate-600">Listing tidak tersedia.</p>;
  }
  const size = compact ? "px-3 py-2.5 text-sm" : "px-4 py-3 text-sm sm:text-base";
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => void open("chat")} disabled={opening !== null} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50 ${size}`}>
        <MessageSquare className="h-4 w-4" aria-hidden="true" /> {opening === "chat" ? "Membuka..." : "Chat seller"}
      </button>
      <button type="button" onClick={() => void open("offer")} disabled={opening !== null} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-50 ${size}`}>
        <Tag className="h-4 w-4" aria-hidden="true" /> {opening === "offer" ? "Membuka..." : "Kirim tawaran"}
      </button>
    </div>
  );
}
