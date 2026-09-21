"use client";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TrustScoreRing } from "@/components/marketplace/TrustScoreRing";
import { formatRupiah, waLink } from "@/lib/utils";
import type { AdminProfile } from "@/types";

export function AdminCard({ admin, rank }: { admin: AdminProfile; rank?: number }) {
  const bankNames = admin.bankAccounts?.map((b) => b.bank) || ["BCA", "GoPay"];

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* Rank indicator if provided */}
      {rank && rank <= 3 && (
        <div className="absolute -top-3 left-5 z-10">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
            rank === 1 ? "bg-amber-400 text-slate-950" : rank === 2 ? "bg-slate-200 text-slate-800" : "bg-amber-700 text-white"
          }`}>
            Top #{rank} Rekber
          </span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex items-center gap-3.5 mb-4 pt-1">
        <div className="relative shrink-0">
          <Avatar
            name={admin.user.fullName}
            size={52}
            className="ring-2 ring-slate-100 shadow-sm"
          />
          {/* Online status indicator */}
          <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-slate-900 text-base truncate">
              {admin.user.fullName}
            </h3>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck size={11} className="text-emerald-600" />
              VERIFIED
            </span>
          </div>
          <p className="text-slate-500 text-xs truncate mt-0.5">
            @{admin.user.username}
          </p>
        </div>
      </div>

      {/* Trust Score & Metrics */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 mb-3.5">
        <TrustScoreRing score={admin.trustScore} size={68} />

        <div className="grid grid-cols-2 gap-2 flex-1 text-left">
          <div className="bg-white rounded p-1.5 border border-slate-200/70">
            <span className="text-[10px] text-slate-500 block font-medium">Transaksi</span>
            <p className="font-bold text-slate-900 text-xs sm:text-sm">
              {admin.totalSuccess.toLocaleString("id-ID")}+
            </p>
          </div>
          <div className="bg-white rounded p-1.5 border border-slate-200/70">
            <span className="text-[10px] text-slate-500 block font-medium">Respon</span>
            <p className="font-bold text-blue-600 text-xs sm:text-sm">
              &lt; {admin.responseTime}m
            </p>
          </div>
          <div className="bg-white rounded p-1.5 border border-slate-200/70 col-span-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-medium">Mulai Fee</span>
            <span className="font-bold text-slate-900 text-xs">
              {formatRupiah(admin.fee)}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Bio */}
      <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
        {admin.bio}
      </p>

      {/* Bank & Operating Hours */}
      <div className="mt-auto space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aktif {admin.activeHours}
          </span>
          <span className="font-medium text-slate-600">
            {bankNames.slice(0, 3).join(", ")}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold text-slate-600">
            Admin dipilih saat checkout
          </div>
          <a
            href={waLink(admin.user.whatsapp ?? "")}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <Button
              variant="success"
              size="sm"
              className="w-full text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <MessageCircle size={14} />
              Chat WA
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
