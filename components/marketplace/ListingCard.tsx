"use client";
import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, CheckCircle2, Bookmark } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Listing } from "@/types";
import { toast } from "sonner";

export function ListingCard({ listing }: { listing: Listing }) {
  const [isSaved, setIsSaved] = useState(false);
  const statusLabel =
    listing.status === "AVAILABLE"
      ? "Ready"
      : listing.status === "IN_TRANSACTION"
        ? "Diproses"
        : listing.status === "SOLD"
          ? "Terjual"
          : "Nonaktif";

  // Fallback image just in case
  const imageSrc =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    if (!isSaved) {
      toast.success("Disimpan ke bookmark!", {
        description: listing.title,
        duration: 2000,
      });
    } else {
      toast("Dihapus dari bookmark", {
        duration: 1500,
      });
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden relative">
      {/* Save/Bookmark Button */}
      <button
        onClick={handleSave}
        className={`absolute top-3 right-3 z-20 p-2 rounded-lg backdrop-blur-md border transition-all cursor-pointer ${
          isSaved
            ? "bg-blue-600 border-blue-500 text-white shadow-md"
            : "bg-black/30 border-white/20 text-white hover:bg-black/50 hover:border-white/40"
        }`}
        title={isSaved ? "Hapus dari bookmark" : "Simpan akun ini"}
      >
        <Bookmark
          size={16}
          fill={isSaved ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </button>

      <Link
        href={`/listings/${listing.id}`}
        className="flex flex-col h-full"
        onClick={() => {
          if (typeof window !== "undefined") {
            try {
              const currentUrl = window.location.pathname + window.location.search;
              sessionStorage.setItem("last_listing_origin", currentUrl);
              sessionStorage.setItem("scroll_pos_" + currentUrl, String(window.scrollY));
            } catch (e) {}
          }
        }}
      >
        {/* Photo Area - Maximize visual impact */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-slate-900/40 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-12 flex justify-between items-start z-10">
            <div className="flex flex-col gap-1.5 items-start">
              <span className="text-[10px] font-black tracking-wide px-2 py-1 rounded bg-white text-blue-700 shadow-sm uppercase">
                {listing.game}
              </span>
              {listing.isFeatured && (
                <span className="text-[10px] font-black tracking-wider px-2 py-1 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm uppercase">
                  🔥 HOT
                </span>
              )}
            </div>
            {listing.details.overall && (
              <span className="text-[12px] font-black px-2.5 py-1 rounded bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-sm">
                OVR {listing.details.overall}
              </span>
            )}
          </div>

          {/* Bottom Info on Image */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {listing.details.isNominus && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                  <CheckCircle2 size={10} strokeWidth={3} />
                  Nominus
                </span>
              )}
              {listing.details.hasWarranty && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white flex items-center gap-1 shadow-sm">
                  <ShieldCheck size={10} strokeWidth={3} />
                  Anti-Hackback
                </span>
              )}
              {listing.details.loginMethod && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/60 text-slate-200 backdrop-blur-sm border border-white/10">
                  {listing.details.loginMethod}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Text Content Area - Minimal & Clean */}
        <div className="p-4 flex flex-col flex-1 bg-white">
          <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
            {listing.title}
          </h3>

          <div className="mt-auto flex items-end justify-between pt-3 border-t border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                Harga Pas
              </span>
              <span className="text-lg font-black text-blue-600 tracking-tight">
                {formatRupiah(listing.price)}
              </span>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${
                listing.status === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
