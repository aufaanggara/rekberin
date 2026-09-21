"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TransactionTimeline } from "@/components/dashboard/TransactionTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { TransactionFeeSummary } from "@/components/dashboard/TransactionFeeSummary";
import type { TransactionViewModel } from "@/types/transaction-view-model";

export function AdminTransactionView({
  initialTransaction,
}: {
  initialTransaction: TransactionViewModel;
}) {
  const tx = initialTransaction;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="admin" />
      <div className="flex-1 space-y-6">
        <div>
          <Link
            href="/admin/transactions"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Kembali ke antrean transaksi
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">Transaksi #{tx.id.slice(-6)}</h1>
              <p className="text-txt-muted text-xs sm:text-sm">
                Dibuat pada {new Date(tx.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
            <StatusBadge status={tx.status} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <h2 className="font-semibold mb-4 text-sm sm:text-base">Info Transaksi</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-txt-muted text-xs mb-1">Listing</p>
                <p className="font-medium text-slate-900">{tx.listing.title}</p>
                <p className="text-txt-secondary text-xs">{tx.listing.game}</p>
              </div>
              <TransactionFeeSummary
                price={tx.price}
                platformFee={tx.platformFee}
                adminFee={tx.adminFee}
              />
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4 text-sm sm:text-base">Pihak Terkait</h2>
            <div className="space-y-3">
              {[
                { label: "Buyer", user: tx.buyer },
                { label: "Seller", user: tx.listing.seller },
              ].map(({ label, user }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Avatar name={user.fullName} size={36} />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-sm font-bold text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-500">{user.fullName}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Avatar name={tx.admin.user.fullName} size={36} />
                <div>
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                    <ShieldCheck size={12} aria-hidden="true" /> Admin ditugaskan
                  </p>
                  <p className="text-sm font-bold text-slate-900">{tx.admin.user.username}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4 text-sm sm:text-base">Status & Timeline</h2>
            <TransactionTimeline steps={tx.timeline} />
            {tx.checklist.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
                {tx.checklist.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2
                      size={14}
                      className={item.checked ? "mt-0.5 text-emerald-500" : "mt-0.5 text-slate-300"}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="font-semibold text-sm sm:text-base">Aksi transaksi</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Halaman ini membaca status langsung dari API. Pembayaran, handover, dispute,
            chat, dan perubahan status lanjutan belum tersedia pada tahap ini.
          </p>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-semibold text-slate-500" aria-disabled="true">
            Mode read-only — menunggu tahap implementasi berikutnya
          </div>
        </Card>
      </div>
    </div>
  );
}
