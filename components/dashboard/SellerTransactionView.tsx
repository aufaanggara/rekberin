"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TransactionTimeline } from "@/components/dashboard/TransactionTimeline";
import { TransactionChat } from "@/components/dashboard/TransactionChat";
import { Avatar } from "@/components/ui/Avatar";
import { TransactionFeeSummary } from "@/components/dashboard/TransactionFeeSummary";
import type { TransactionViewModel } from "@/types/transaction-view-model";

export function SellerTransactionView({ initialTransaction }: { initialTransaction: TransactionViewModel }) {
  const tx = initialTransaction;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="user" />
      <div className="flex-1 space-y-6">
        {/* Top Header */}
        <div>
          <Link
            href="/user/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mb-2"
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

        {/* 3 Column Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Card 1: Penerimaan Dana */}
          <Card>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-txt-muted text-xs mb-0.5">Item Akun Terjual</p>
                <p className="font-medium text-slate-900 line-clamp-2">{tx.listing.title}</p>
              </div>

              <TransactionFeeSummary
                price={tx.price}
                platformFee={tx.platformFee}
                adminFee={tx.adminFee}
              />

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2 mt-4">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Syarat Pencairan Dana</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Mekanisme pencairan belum tersedia pada tahap ini. Halaman hanya menampilkan status dari API.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Timeline & Checklist Serah Terima */}
          <Card>
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Progres Serah Terima</h3>
            <TransactionTimeline steps={tx.timeline} />

            <h4 className="font-semibold mt-6 mb-2.5 text-xs uppercase tracking-wider text-slate-500">
              Checklist untuk Penjual
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

          {/* Card 3: Pembeli & Admin Escrow */}
          <Card>
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Informasi Partner</h3>
            <div className="space-y-4 text-sm">
              {/* Buyer */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Pembeli Akun
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={tx.buyer.fullName} size={36} />
                  <div>
                    <p className="font-semibold text-slate-900">{tx.buyer.username}</p>
                    <p className="text-xs text-txt-muted">Nama: {tx.buyer.fullName}</p>
                  </div>
                </div>
              </div>

              {/* Admin Escrow */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-amber-800 text-[11px] font-semibold uppercase tracking-wider">
                    Admin Escrow Bertugas
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 flex items-center gap-1">
                    <ShieldCheck size={11} /> Escrow
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={tx.admin.user.fullName} size={36} />
                  <div>
                    <p className="font-semibold text-slate-900">{tx.admin.user.username}</p>
                    <p className="text-xs text-amber-700">
                      Waktu aktif: {tx.admin.activeHours ?? "Belum tersedia"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <TransactionChat
          transactionId={tx.id}
          transactionStatus={tx.status}
          defaultRole="SELLER"
          defaultUserName={tx.listing.seller.username}
          buyerName={tx.buyer.username}
          sellerName={tx.listing.seller.username}
          adminName={tx.admin.user.username}
        />
      </div>
    </div>
  );
}
