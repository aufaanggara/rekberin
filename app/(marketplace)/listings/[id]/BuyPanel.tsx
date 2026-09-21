"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import type { ListingStatus } from "@/types";
import { toast } from "sonner";

interface BuyPanelProps {
  listingId: string;
  listingStatus: ListingStatus;
}

export function BuyPanel({ listingId, listingStatus }: BuyPanelProps) {
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
    <div className="space-y-4">
      {/* 💬 Tombol Tunggal: Chat Penjual (Langsung buka room chat) */}
      <button
        type="button"
        onClick={handleChatPenjual}
        disabled={listingStatus !== "AVAILABLE" || isNavigating}
        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
        aria-label="Chat Penjual"
      >
        {isNavigating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Membuka Chat...
          </>
        ) : (
          <>
            <MessageSquare className="w-5 h-5" />
            {listingStatus === "AVAILABLE" ? "Chat Penjual" : "Listing Tidak Tersedia"}
          </>
        )}
      </button>

      {/* 📋 Prosedur Transaksi Rekberin */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs space-y-3">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Prosedur Transaksi Rekberin:
        </h4>
        <ol className="space-y-2.5 text-[11px] text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
              1
            </span>
            <span>
              <strong>Negosiasi & Deal:</strong> Klik <em>Chat Penjual</em> untuk berdiskusi kondisi akun dan mengajukan harga penawaran final di ruang chat.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
              2
            </span>
            <span>
              <strong>Rekber & Escrow:</strong> Setelah penjual ACC tawaran, pilih Admin Rekber & bayar via QRIS (5 menit batas waktu).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
              3
            </span>
            <span>
              <strong>Amankan Akun:</strong> Terima Konami ID, amankan email/password & OTP, lalu konfirmasi terima akun.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
