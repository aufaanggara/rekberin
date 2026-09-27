"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Clock3, MessageSquareText, RefreshCw, Store, Tag } from "lucide-react";
import { AccountSettings } from "@/components/dashboard/AccountSettings";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatRupiah } from "@/lib/utils";
import { selectUserActivity, type ActivityRole } from "@/lib/user-activity";

type DashboardView = "ongoing" | "history" | "settings";
type DashboardNegotiation = {
  id: string;
  buyerId: string;
  sellerId: string;
  offeredPrice: number | null;
  offerStatus: string;
  listing: { id: string; title: string; price: number; status: string };
  buyer: { username: string };
  seller: { username: string };
  transaction: { id: string } | null;
};
type DashboardTransaction = {
  id: string;
  buyerId: string;
  sellerId: string;
  status: string;
  price: number;
  listing: { id: string; title: string };
  buyer: { username: string };
  seller: { username: string };
};

const viewLabels: Record<DashboardView, string> = {
  ongoing: "Transaksi Berjalan",
  history: "Riwayat Transaksi",
  settings: "Pengaturan Akun",
};

const transactionStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran",
  PAYMENT_CONFIRMED: "Pembayaran dikonfirmasi",
  IN_HANDOVER: "Serah terima akun",
  PENDING_BUYER_CONFIRM: "Menunggu konfirmasi buyer",
  DISPUTED: "Sedang ditinjau admin",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

function parseView(value: string | null): DashboardView {
  return value === "history" || value === "settings" ? value : "ongoing";
}

function UserDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: currentUser, isLoading: isUserLoading, session, sessionStatus } = useCurrentUser();
  const sessionUser = session?.user as { id?: unknown } | undefined;
  const sessionUserId = typeof sessionUser?.id === "string" ? sessionUser.id : null;
  const userId = sessionStatus === "authenticated"
    ? sessionUserId ?? currentUser?.id ?? null
    : null;
  const view = parseView(searchParams.get("view"));
  const scope: ActivityRole = searchParams.get("scope") === "seller" ? "seller" : "buyer";
  const activityQuery = useQuery({
    queryKey: ["user-activity", userId],
    enabled: userId !== null && view !== "settings",
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/user/activity", { cache: "no-store", signal });
      const payload = await response.json().catch(() => ({})) as {
        error?: string;
        negotiations?: DashboardNegotiation[];
        transactions?: DashboardTransaction[];
      };
      if (!response.ok) {
        throw new Error(payload.error || "Aktivitas transaksi tidak dapat dimuat.");
      }
      return {
        negotiations: Array.isArray(payload.negotiations) ? payload.negotiations : [],
        transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
      };
    },
  });
  const negotiations = activityQuery.data?.negotiations ?? [];
  const transactions = activityQuery.data?.transactions ?? [];
  const activityError = activityQuery.error instanceof Error
    ? activityQuery.error.message
    : activityQuery.error
      ? "Aktivitas transaksi tidak dapat dimuat."
      : null;
  const hasActivityData = activityQuery.data !== undefined;

  const activity = useMemo(() => userId
    ? selectUserActivity(userId, scope, negotiations, transactions)
    : { negotiations: [], ongoingTransactions: [], history: [] },
  [userId, negotiations, scope, transactions]);

  function changeScope(nextScope: ActivityRole) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextScope === "buyer") params.delete("scope");
    else params.set("scope", nextScope);
    const query = params.toString();
    router.push(`/user${query ? `?${query}` : ""}`);
  }

  const isLoading = (!userId && isUserLoading) || (!!userId && activityQuery.isLoading);
  const isEmpty = activity.negotiations.length === 0 && activity.ongoingTransactions.length === 0;
  const roleLabel = scope === "buyer" ? "buyer" : "seller";

  return (
    <div className="min-w-0 flex-1 px-3 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-0 lg:pb-0 lg:pt-0">
      <header className="sticky top-16 z-30 -mx-3 -mt-5 mb-5 flex flex-col items-stretch gap-3 border-b border-slate-200 bg-white/95 px-3 pb-3 pt-5 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mt-0 lg:flex-row lg:items-start lg:justify-between lg:gap-3 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-0">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Akun Saya</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">{viewLabels[view]}</h1>
          <p className="mt-1 text-sm text-slate-600">Kelola aktivitas dan profil buyer maupun seller Anda.</p>
        </div>
        {view !== "settings" && userId && (
          <div role="group" aria-label="Filter aktivitas berdasarkan peran" className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
            {(["buyer", "seller"] as const).map((item) => {
              const selected = scope === item;
              const Icon = item === "buyer" ? MessageSquareText : Store;
              return <button key={item} type="button" aria-pressed={selected} onClick={() => changeScope(item)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold capitalize ${selected ? "bg-blue-50 text-blue-800" : "text-slate-500 hover:text-slate-800"}`}><Icon className="h-4 w-4" aria-hidden="true" />{item}</button>;
            })}
          </div>
        )}
      </header>

      {view === "settings" ? <AccountSettings /> : (
        <div className="space-y-5">
          {activityError && userId && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span>{activityError}</span><button type="button" onClick={() => { void activityQuery.refetch(); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 font-semibold"><RefreshCw className="h-4 w-4" aria-hidden="true" />Coba lagi</button></div>}

          {isLoading && <div className="space-y-3" aria-busy="true"><div className="h-20 animate-pulse rounded-2xl bg-white" /><div className="h-20 animate-pulse rounded-2xl bg-white" /></div>}

          {!isLoading && !userId && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><p className="text-sm text-slate-600">Masuk untuk melihat transaksi dan negosiasi Anda.</p><Link href="/login?callbackUrl=%2Fuser" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">Masuk</Link></div>}

          {!isLoading && userId && hasActivityData && view === "ongoing" && isEmpty && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <MessageSquareText className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
              <h2 className="mt-3 text-base font-bold text-slate-900">Belum ada aktivitas berjalan</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">Negosiasi yang belum menjadi transaksi dan transaksi yang masih berlangsung akan muncul di sini.</p>
              <Link href="/listings" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">Jelajahi listing</Link>
            </div>
          )}

          {!isLoading && userId && hasActivityData && view === "history" && activity.history.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
              <h2 className="mt-3 text-base font-bold text-slate-900">Riwayat masih kosong</h2>
              <p className="mt-1 text-sm text-slate-600">Transaksi selesai atau dibatalkan sebagai {roleLabel} akan tersimpan di sini.</p>
            </div>
          )}

          {!isLoading && userId && hasActivityData && view === "ongoing" && activity.negotiations.length > 0 && (
            <section className="space-y-3" aria-labelledby="ongoing-negotiations-title">
              <h2 id="ongoing-negotiations-title" className="text-base font-bold text-slate-900">Chat dan penawaran <span className="ml-1 text-xs font-semibold text-slate-500">{activity.negotiations.length}</span></h2>
              {activity.negotiations.map((item) => {
                const isBuyer = item.buyerId === userId;
                const partner = isBuyer ? item.seller : item.buyer;
                return <Link key={item.id} href={`/user/negotiations/${encodeURIComponent(item.id)}`} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Tag className="h-5 w-5" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-slate-900">{item.listing.title}</h3><p className="mt-1 truncate text-xs text-slate-500">Dengan @{partner.username} · {isBuyer ? "Anda buyer" : "Anda seller"}</p><p className="mt-1 text-xs font-semibold text-slate-700">{item.offeredPrice === null ? "Belum ada tawaran" : `${formatRupiah(item.offeredPrice)} · ${item.offerStatus === "PENDING" ? "Menunggu respons" : item.offerStatus === "ACCEPTED" ? "Tawaran diterima" : item.offerStatus === "REJECTED" ? "Tawaran ditolak" : "Tawaran kedaluwarsa"}`}</p></div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                </Link>;
              })}
            </section>
          )}

          {!isLoading && userId && hasActivityData && view === "ongoing" && activity.ongoingTransactions.length > 0 && (
            <section className="space-y-3" aria-labelledby="ongoing-transactions-title">
              <h2 id="ongoing-transactions-title" className="text-base font-bold text-slate-900">Transaksi belum selesai <span className="ml-1 text-xs font-semibold text-slate-500">{activity.ongoingTransactions.length}</span></h2>
              {activity.ongoingTransactions.map((item) => {
                const isBuyer = item.buyerId === userId;
                const partner = isBuyer ? item.seller : item.buyer;
                return <Link key={item.id} href={`/user/transactions/${encodeURIComponent(item.id)}`} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Clock3 className="h-5 w-5" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-slate-900">{item.listing.title}</h3><p className="mt-1 truncate text-xs text-slate-500">Dengan @{partner.username} · {isBuyer ? "Anda buyer" : "Anda seller"}</p><p className="mt-1 text-xs font-semibold text-blue-800">{transactionStatusLabels[item.status] ?? item.status.replaceAll("_", " ")} · {formatRupiah(item.price)}</p></div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                </Link>;
              })}
            </section>
          )}

          {!isLoading && userId && hasActivityData && view === "history" && activity.history.length > 0 && (
            <section className="space-y-3" aria-label="Riwayat transaksi">
              {activity.history.map((item) => {
                const isBuyer = item.buyerId === userId;
                const partner = isBuyer ? item.seller : item.buyer;
                const completed = item.status === "COMPLETED";
                return <Link key={item.id} href={`/user/transactions/${encodeURIComponent(item.id)}`} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${completed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold text-slate-900">{item.listing.title}</h2><p className="mt-1 truncate text-xs text-slate-500">Dengan @{partner.username} · {isBuyer ? "Anda buyer" : "Anda seller"}</p><p className={`mt-1 text-xs font-bold ${completed ? "text-emerald-700" : "text-slate-600"}`}>{transactionStatusLabels[item.status] ?? item.status} · {formatRupiah(item.price)}</p></div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                </Link>;
              })}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function UserDashboardPage() {
  return <Suspense fallback={<div className="min-h-64 animate-pulse rounded-2xl bg-white" />}><UserDashboardContent /></Suspense>;
}
