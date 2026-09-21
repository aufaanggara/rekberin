"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

interface ShareListingButtonProps {
  title: string;
  price: number;
}

export function ShareListingButton({ title, price }: ShareListingButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link post akun berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWA = () => {
    if (typeof window !== "undefined") {
      const text = `Halo! Cek akun game "${title}" seharga ${formatRupiah(price)} di Rekberin. Transaksi aman terlindungi rekening escrow: ${window.location.href}`;
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <Share2 size={13} className="text-blue-600" />
        <span>Bagikan Post Akun Ini:</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopyLink}
          className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          <span>{copied ? "Tersalin!" : "Salin Link"}</span>
        </button>

        <button
          type="button"
          onClick={handleShareWA}
          className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <MessageCircle size={14} className="text-emerald-600" />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
