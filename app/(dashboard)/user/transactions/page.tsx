"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { dummyTransactions } from "@/data/dummy";
import { formatRupiah } from "@/lib/utils";
import { Gamepad2, MessageSquare, ShoppingBag, Store } from "lucide-react";

type TransactionFilter = "ALL" | "BUYER" | "SELLER";

export default function UserTransactionsPage() {
  const [filter, setFilter] = useState<TransactionFilter>("ALL");

  // In dummy data: "Dimas Anggara" is buyer, "Rian Pratama" (efootball_seller1) is seller
  const filteredTransactions = dummyTransactions.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "BUYER") return t.buyer.username.toLowerCase().includes("dimas");
    if (filter === "SELLER") return t.listing.seller.username === "efootball_seller1";
    return true;
  });

  const buyerCount = dummyTransactions.filter((t) =>
    t.buyer.username.toLowerCase().includes("dimas")
  ).length;
  const sellerCount = dummyTransactions.filter(
    (t) => t.listing.seller.username === "efootball_seller1"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="user" />

      <div className="flex-1 space-y-6">
        {/* Header and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Daftar seluruh transaksi pembelian dan penjualan akun game yang terlindungi sistem Escrow Rekberin.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === "ALL"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({dummyTransactions.length})
            </button>
            <button
              onClick={() => setFilter("BUYER")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === "BUYER"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag size={13} />
              <span>Pembelian ({buyerCount})</span>
            </button>
            <button
              onClick={() => setFilter("SELLER")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === "SELLER"
                  ? "bg-white text-emerald-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store size={13} />
              <span>Penjualan ({sellerCount})</span>
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Tidak ada transaksi yang sesuai dengan filter yang dipilih.
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const isBuyerContext = t.buyer.username.toLowerCase().includes("dimas");
              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        isBuyerContext
                          ? "bg-blue-50 border-blue-100 text-blue-600"
                          : "bg-emerald-50 border-emerald-100 text-emerald-600"
                      }`}
                    >
                      <Gamepad2 size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {t.listing.game}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isBuyerContext
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isBuyerContext ? "Sebagai Pembeli" : "Sebagai Penjual"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">#{t.id.slice(-6)}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {t.listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        • Penjual:{" "}
                        <span className="font-semibold text-slate-700">
                          {t.listing.seller.username}
                        </span>{" "}
                        • Pembeli:{" "}
                        <span className="font-semibold text-slate-700">
                          {t.buyer.username}
                        </span>{" "}
                        • Admin:{" "}
                        <span className="font-semibold text-blue-600">
                          {t.admin.user.username}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      {formatRupiah(t.price)}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <Link href={`/user/transactions/${t.id}`}>
                        <Button
                          size="sm"
                          className={`${
                            isBuyerContext
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          } text-white text-xs font-bold`}
                        >
                          <MessageSquare size={13} className="mr-1.5" />
                          Detail & Chat
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
