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
import { ArrowRight, Gamepad2, RefreshCw, ShoppingBag, Store } from "lucide-react";

type TransactionFilter = "ALL" | "BUYER" | "SELLER";
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
  const [filter, setFilter] = useState<TransactionFilter>("ALL");
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

  const filteredTransactions = useMemo(
    () =>
      relatedTransactions.filter((transaction) => {
        const context = getTransactionContext(transaction, viewerId ?? null);
        if (filter === "BUYER") return context === "BUYER";
        if (filter === "SELLER") return context === "SELLER";
        return true;
      }),
    [filter, relatedTransactions, viewerId]
  );

  const buyerCount = relatedTransactions.filter(
    (transaction) => getTransactionContext(transaction, viewerId ?? null) === "BUYER"
  ).length;
  const sellerCount = relatedTransactions.filter(
    (transaction) => getTransactionContext(transaction, viewerId ?? null) === "SELLER"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="user" />

      <div className="flex-1 space-y-6" aria-busy={isLoading || viewerId === undefined}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Daftar transaksi pembelian dan penjualan yang terkait dengan akun Anda.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              aria-pressed={filter === "ALL"}
              className={`min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === "ALL"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({relatedTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("BUYER")}
              aria-pressed={filter === "BUYER"}
              className={`min-h-11 flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === "BUYER"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag size={13} aria-hidden="true" />
              <span>Pembelian ({buyerCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("SELLER")}
              aria-pressed={filter === "SELLER"}
              className={`min-h-11 flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === "SELLER"
                  ? "bg-white text-emerald-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store size={13} aria-hidden="true" />
              <span>Penjualan ({sellerCount})</span>
            </button>
          </div>
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
              Transaksi baru akan muncul setelah berhasil dibuat dari listing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const context = getTransactionContext(transaction, viewerId);
              const isBuyerContext = context === "BUYER";

              return (
                <div
                  key={transaction.id}
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
                      <Gamepad2 size={24} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {transaction.listing.game}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isBuyerContext
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isBuyerContext
                            ? "Sebagai Pembeli"
                            : "Sebagai Penjual"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">#{transaction.id.slice(-6)}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {transaction.listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        • Penjual: <span className="font-semibold text-slate-700">{transaction.listing.seller.username}</span>{" "}
                        • Pembeli: <span className="font-semibold text-slate-700">{transaction.buyer.username}</span>{" "}
                        • Admin: <span className="font-semibold text-blue-600">{transaction.admin.user.username}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      {formatRupiah(transaction.price)}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={transaction.status} />
                      <Link href={`/user/transactions/${transaction.id}`}>
                        <Button
                          size="sm"
                          className={`${
                            isBuyerContext
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          } text-white text-xs font-bold`}
                        >
                          <ArrowRight size={13} className="mr-1.5" aria-hidden="true" />
                          Lihat Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
