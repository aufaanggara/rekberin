"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useTransactions } from "@/hooks/useTransactions";
import { mapTransactionApiToViewModel } from "@/lib/transaction-view-model";
import { formatRupiah } from "@/lib/utils";
import { ArrowRight, Gamepad2, RefreshCw, ShoppingBag, Store, Clock, CheckCircle2 } from "lucide-react";

type RoleFilter = "ALL" | "BUYER" | "SELLER";
type StatusCategoryFilter = "ALL" | "ONGOING" | "COMPLETED";
type TransactionContext = "BUYER" | "SELLER" | "UNKNOWN";

function getViewerId(session: Awaited<ReturnType<typeof getSession>>) {
  const user = session?.user as { id?: unknown } | undefined;
  return typeof user?.id === "string" ? user.id : null;
}

function getTransactionContext(
  transaction: ReturnType<typeof mapTransactionApiToViewModel>,
  viewerId: string | null
): TransactionContext {
  if (!viewerId) return "UNKNOWN";
  if (transaction.buyer.id === viewerId) return "BUYER";
  if (transaction.listing.seller.id === viewerId) return "SELLER";
  return "UNKNOWN";
}

export default function UserTransactionsPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusCategoryFilter>("ALL");
  const [viewerId, setViewerId] = useState<string | null | undefined>(undefined);
  const { data, isLoading, error, refetch } = useTransactions();

  useEffect(() => {
    let active = true;

    getSession()
      .then((session) => {
        if (active) setViewerId(getViewerId(session));
      })
      .catch(() => {
        if (active) setViewerId(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const transactions = useMemo(
    () => data.map(mapTransactionApiToViewModel),
    [data]
  );

  const relatedTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const context = getTransactionContext(transaction, viewerId ?? null);
        return context === "BUYER" || context === "SELLER";
      }),
    [transactions, viewerId]
  );

  // Filter based on both Role (Pembeli/Penjual) and Status Category (Dalam Proses / Selesai)
  const filteredTransactions = useMemo(() => {
    return relatedTransactions.filter((transaction) => {
      const context = getTransactionContext(transaction, viewerId ?? null);
      
      // Role match
      if (roleFilter === "BUYER" && context !== "BUYER") return false;
      if (roleFilter === "SELLER" && context !== "SELLER") return false;

      // Status match
      const isOngoing =
        transaction.status === "PENDING_PAYMENT" ||
        transaction.status === "PAYMENT_CONFIRMED" ||
        transaction.status === "IN_HANDOVER" ||
        transaction.status === "PENDING_BUYER_CONFIRM" ||
        transaction.status === "DISPUTED";

      const isCompleted =
        transaction.status === "COMPLETED" || transaction.status === "CANCELLED";

      if (statusFilter === "ONGOING" && !isOngoing) return false;
      if (statusFilter === "COMPLETED" && !isCompleted) return false;

      return true;
    });
  }, [roleFilter, statusFilter, relatedTransactions, viewerId]);

  const ongoingCount = relatedTransactions.filter((t) =>
    ["PENDING_PAYMENT", "PAYMENT_CONFIRMED", "IN_HANDOVER", "PENDING_BUYER_CONFIRM", "DISPUTED"].includes(t.status)
  ).length;

  const completedCount = relatedTransactions.filter((t) =>
    ["COMPLETED", "CANCELLED"].includes(t.status)
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="user" />

      <div className="flex-1 space-y-6" aria-busy={isLoading || viewerId === undefined}>
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau transaksi dalam proses dan arsip pesanan yang telah selesai.
            </p>
          </div>

          {/* Status Category Tabs: Dalam Proses vs Selesai */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({relatedTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ONGOING")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "ONGOING"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock size={13} className="text-amber-500" />
              <span>Dalam Proses ({ongoingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("COMPLETED")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "COMPLETED"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Selesai ({completedCount})</span>
            </button>
          </div>
        </div>

        {/* Sub-Filter: Pembelian vs Penjualan */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Peran:</span>
          <button
            type="button"
            onClick={() => setRoleFilter("ALL")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              roleFilter === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("BUYER")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              roleFilter === "BUYER" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShoppingBag size={12} /> Pembelian
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("SELLER")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              roleFilter === "SELLER" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Store size={12} /> Penjualan
          </button>
        </div>

        {isLoading || viewerId === undefined ? (
          <div className="space-y-3" aria-live="polite">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-2xl border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
            <p className="text-sm font-semibold text-red-800">{error}</p>
            {viewerId === null ? (
              <Link href="/login" className="inline-block mt-4">
                <Button size="sm">Masuk untuk melihat transaksi</Button>
              </Link>
            ) : (
              <Button size="sm" className="mt-4" onClick={() => void refetch()}>
                <RefreshCw size={14} className="mr-1.5" /> Coba lagi
              </Button>
            )}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Gamepad2 size={28} className="mx-auto text-slate-300 mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">
              {relatedTransactions.length === 0
                ? "Belum ada transaksi yang terkait dengan akun Anda."
                : "Tidak ada transaksi yang sesuai dengan filter ini."}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Transaksi baru akan muncul setelah Anda berdiskusi dan checkout listing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const context = getTransactionContext(transaction, viewerId);
              const isBuyerContext = context === "BUYER";
              const isOngoing = [
                "PENDING_PAYMENT",
                "PAYMENT_CONFIRMED",
                "IN_HANDOVER",
                "PENDING_BUYER_CONFIRM",
                "DISPUTED",
              ].includes(transaction.status);

              return (
                <Link
                  key={transaction.id}
                  href={`/user/transactions/${transaction.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group block"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        #{transaction.id.slice(-6)}
                      </span>
                      <StatusBadge status={transaction.status} />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isBuyerContext
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isBuyerContext ? "Sebagai Pembeli" : "Sebagai Penjual"}
                      </span>
                      {isOngoing && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">
                          ● Sedang Berlangsung
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
                      {transaction.listing.title}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Partner:{" "}
                      <strong>
                        {isBuyerContext ? transaction.listing.seller.username : transaction.buyer.username}
                      </strong>{" "}
                      · Dibuat {new Date(transaction.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Total Nilai</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {formatRupiah(transaction.price + transaction.platformFee + transaction.adminFee)}
                      </span>
                    </div>

                    <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                      isOngoing
                        ? "bg-blue-600 text-white group-hover:bg-blue-700"
                        : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                    }`}>
                      <span>{isOngoing ? "Buka Transaksi & Chat" : "Lihat Detail Transaksi"}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
