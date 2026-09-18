"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Gamepad2, RefreshCw, ShieldCheck } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useTransactions } from "@/hooks/useTransactions";
import { mapTransactionApiToViewModel } from "@/lib/transaction-view-model";
import { formatRupiah } from "@/lib/utils";

export default function AdminTransactionsPage() {
  const { data, isLoading, error, refetch } = useTransactions();
  const [viewer, setViewer] = useState<{ id: string; role: string } | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (!active) return;
        const user = session?.user as { id?: unknown; role?: unknown } | undefined;
        setViewer(
          typeof user?.id === "string" && typeof user.role === "string"
            ? { id: user.id, role: user.role }
            : null
        );
      })
      .catch(() => {
        if (active) setViewer(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const isAuthorizedAdmin =
    viewer !== null &&
    viewer !== undefined &&
    ["ADMIN", "SUPER_ADMIN"].includes(viewer.role);
  const transactions = isAuthorizedAdmin
    ? data
        .filter((transaction) => transaction.adminId === viewer.id)
        .map(mapTransactionApiToViewModel)
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="admin" />
      <div className="flex-1 space-y-6" aria-busy={isLoading || viewer === undefined}>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Transaksi yang Ditugaskan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hanya transaksi yang menugaskan akun admin Anda yang ditampilkan.
          </p>
        </div>

        {isLoading || viewer === undefined ? (
          <div className="space-y-3" aria-live="polite">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-2xl border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : error || !isAuthorizedAdmin ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
            <p className="text-sm font-semibold text-red-800">
              {error ?? "Halaman ini hanya tersedia untuk akun admin Rekberin."}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button size="sm" onClick={() => void refetch()}>
                <RefreshCw size={14} className="mr-1.5" aria-hidden="true" /> Coba lagi
              </Button>
              <Link href="/login?callbackUrl=%2Fadmin%2Ftransactions">
                <Button size="sm" variant="secondary">Masuk sebagai admin</Button>
              </Link>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <ShieldCheck size={30} className="mx-auto mb-3 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">Belum ada transaksi yang ditugaskan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
                    <Gamepad2 size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-slate-400">#{transaction.id.slice(-6)}</p>
                    <h2 className="font-bold text-slate-900">{transaction.listing.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Buyer: <span className="font-semibold">{transaction.buyer.username}</span>
                      {" · "}Seller: <span className="font-semibold">{transaction.listing.seller.username}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  <span className="font-black text-slate-900">{formatRupiah(transaction.price)}</span>
                  <StatusBadge status={transaction.status} />
                  <Link href={`/admin/transactions/${transaction.id}`}>
                    <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">Lihat Detail</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
