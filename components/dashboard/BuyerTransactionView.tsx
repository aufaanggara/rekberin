"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, Lock, AlertTriangle } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TransactionTimeline } from "@/components/dashboard/TransactionTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { formatRupiah } from "@/lib/utils";
import type { TransactionViewModel } from "@/types/transaction-view-model";

export function BuyerTransactionView({ initialTransaction }: { initialTransaction: TransactionViewModel }) {
  const tx = initialTransaction;

  const totalPayment = tx.price + tx.platformFee + tx.adminFee;
  const isPendingPayment = tx.status === "PENDING_PAYMENT";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="user" />
      <div className="flex-1 space-y-6">
        {/* Top Header */}
        <div>
          <Link
            href="/user/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-2"
          >
            <ArrowLeft size={14} /> Kembali ke Riwayat Transaksi
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">Transaksi #{tx.id.slice(-4)}</h1>
              <p className="text-txt-muted text-xs sm:text-sm">
                Dibuat pada {new Date(tx.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
            <StatusBadge status={tx.status} />
          </div>
        </div>

        {/* Payment is intentionally read-only until the payment scope is implemented. */}
        {isPendingPayment && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3" role="status">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">Menunggu Pembayaran</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Total transaksi <strong>{formatRupiah(totalPayment)}</strong>. Integrasi pembayaran belum tersedia pada tahap ini, sehingga halaman hanya menampilkan status dari API.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3 Column Summary Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Card 1: Rincian Tagihan */}
          <Card>
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Rincian Pembayaran</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-txt-muted text-xs mb-0.5">Item Akun</p>
                <p className="font-medium text-slate-900 line-clamp-2">{tx.listing.title}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-txt-muted">Harga Akun</span>
                  <span className="font-medium">{formatRupiah(tx.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-muted">Biaya Platform</span>
                  <span className="font-medium">{formatRupiah(tx.platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-muted">Biaya Escrow Rekber</span>
                  <span className="font-medium">{formatRupiah(tx.adminFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-blue-600 border-t border-slate-100 pt-2">
                  <span>Total Tagihan</span>
                  <span>{formatRupiah(totalPayment)}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-start gap-2 mt-4" role="status">
                <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-700">Status transaksi bersifat read-only</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pembayaran, escrow, dan perubahan status belum memiliki aksi pada tahap ini.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Timeline Status Transaksi */}
          <Card>
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Status & Timeline</h3>
            <TransactionTimeline steps={tx.timeline} />

            <h4 className="font-semibold mt-6 mb-2.5 text-xs uppercase tracking-wider text-slate-500">
              Panduan Serah Terima
            </h4>
            <div className="space-y-2">
              {tx.checklist.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2
                    size={14}
                    className={`mt-0.5 shrink-0 ${
                      c.checked ? "text-emerald-500" : "text-slate-300"
                    }`}
                  />
                  <span className={c.checked ? "line-through text-slate-400" : ""}>{c.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 3: Pihak Terlibat */}
          <Card>
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Pihak Terlibat</h3>
            <div className="space-y-4 text-sm">
              {/* Seller */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Penjual Akun
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={tx.listing.seller.fullName} size={36} />
                  <div>
                    <p className="font-semibold text-slate-900">{tx.listing.seller.username}</p>
                    <p className="text-xs text-txt-muted">
                      Rating: {tx.listing.seller.rating ?? "Belum tersedia"} · {tx.listing.seller.totalTransactions ?? "—"} Terjual
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Escrow */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-amber-800 text-[11px] font-semibold uppercase tracking-wider">
                    Admin Escrow Rekber
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 flex items-center gap-1">
                    <ShieldCheck size={11} /> Terverifikasi
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={tx.admin.user.fullName} size={36} />
                  <div>
                    <p className="font-semibold text-slate-900">{tx.admin.user.username}</p>
                    <p className="text-xs text-amber-700">
                      Trust Score: {tx.admin.trustScore !== null ? `${tx.admin.trustScore}%` : "Belum tersedia"} · {tx.admin.totalSuccess ?? "—"} Sukses
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                  <Lock size={12} className="text-blue-600" /> Perlindungan Transaksi
                </div>
                <p className="text-[11px] leading-relaxed">
                  Detail perlindungan dan refund belum memiliki aksi pada tahap ini; status transaksi tetap mengikuti data API.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="font-semibold text-sm sm:text-base">Fitur transaksi lanjutan</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Pembayaran, handover, dispute, brankas akun, dan chat belum tersedia pada tahap ini.
            Tidak ada aksi atau data sensitif yang dapat dikirim dari halaman transaksi.
          </p>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-semibold text-slate-500" aria-disabled="true">
            Belum tersedia — menunggu tahap implementasi berikutnya
          </div>
        </Card>
      </div>
    </div>
  );
}
