"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import type { ListingStatus } from "@/types";
import { toast } from "sonner";

interface BuyPanelProps {
  listingId: string;
  listingStatus: ListingStatus;
  compact?: boolean;
}

export function BuyPanel({ listingId, listingStatus, compact = false }: BuyPanelProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function handleChatPenjual() {
    if (listingStatus !== "AVAILABLE") return;
    setIsNavigating(true);
    toast.info("Membuka ruang chat negosiasi dengan penjual...");
    
    // Langsung arahkan pembeli ke ruang chat transaksi / negosiasi (Tab 1: Negosiasi)
    router.push(`/user/transactions/trx_1`);
  }

  return (
    <div>
      {/* 💬 Tombol Tunggal: Chat Penjual */}
      <button
        type="button"
        onClick={handleChatPenjual}
        disabled={listingStatus !== "AVAILABLE" || isNavigating}
        className={`w-full ${
          compact ? "py-2.5 px-4 text-sm" : "py-3.5 px-4 text-base"
        } bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer`}
        aria-label="Chat Penjual"
      >
        {isNavigating ? (
          <>
            <Loader2 className={`${compact ? "w-4 h-4" : "w-5 h-5"} animate-spin`} /> Membuka Chat...
          </>
        ) : (
          <>
            <MessageSquare className={compact ? "w-4 h-4" : "w-5 h-5"} />
            {listingStatus === "AVAILABLE" ? "Chat Penjual" : "Listing Tidak Tersedia"}
          </>
        )}
      </button>
    </div>
  );
}

