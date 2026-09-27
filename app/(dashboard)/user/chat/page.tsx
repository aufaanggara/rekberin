"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { MessageSquare, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { TransactionApiResponse } from "@/types/transaction-api";

interface NegotiationItem {
  id: string;
  buyerId: string;
  sellerId: string;
  offeredPrice: number | null;
  offerStatus: string;
  listing: { title: string; price: number; status: string };
  transaction: { id: string } | null;
}

export default function ChatPage() {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [negotiations, setNegotiations] = useState<NegotiationItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [negotiationResponse, transactionResponse] = await Promise.all([
        fetch("/api/negotiations", { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
      ]);
      const [negotiationPayload, transactionPayload] = await Promise.all([
        negotiationResponse.json(), transactionResponse.json(),
      ]);
      if (!negotiationResponse.ok || !transactionResponse.ok) {
        throw new Error(negotiationPayload.error || transactionPayload.error || "Percakapan tidak dapat dimuat.");
      }
      setNegotiations(negotiationPayload.negotiations);
      setTransactions(transactionPayload.transactions);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Percakapan tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getSession().then((session) => {
      const user = session?.user as { id?: unknown } | undefined;
      setViewerId(typeof user?.id === "string" ? user.id : null);
    });
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const activeNegotiations = negotiations.filter((item) => !item.transaction);
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><MessageSquare className="h-6 w-6 text-blue-600" /> Percakapan</h1><p className="mt-1 text-sm text-slate-600">Lanjutkan negosiasi, pembayaran, dan serah terima di satu tempat.</p></div>
      {loading && <p className="text-sm text-slate-600">Memuat percakapan...</p>}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {!loading && !error && !viewerId && <Link href="/login" className="text-sm font-bold text-blue-700 hover:underline">Masuk untuk melihat percakapan</Link>}
      {!loading && !error && viewerId && activeNegotiations.length === 0 && transactions.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="text-sm text-slate-600">Belum ada percakapan.</p><Link href="/listings" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">Jelajahi listing</Link></div>}
      {activeNegotiations.length > 0 && <section className="space-y-3"><h2 className="text-base font-bold text-slate-900">Chat dan penawaran</h2>{activeNegotiations.map((item) => <Link key={item.id} href={`/user/negotiations/${item.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-400"><div><h3 className="font-bold text-slate-900">{item.listing.title}</h3><p className="mt-1 text-sm text-slate-600">{viewerId === item.buyerId ? "Anda pembeli" : "Anda penjual"} · {item.offeredPrice ? `Tawaran ${formatRupiah(item.offeredPrice)} · ${item.offerStatus}` : "Belum ada tawaran"}</p></div><ArrowRight className="h-5 w-5 shrink-0 text-blue-600" /></Link>)}</section>}
      {transactions.length > 0 && <section className="space-y-3"><h2 className="text-base font-bold text-slate-900">Chat dan transaksi</h2>{transactions.filter((item) => item.buyerId === viewerId || item.sellerId === viewerId).map((item) => <Link key={item.id} href={`/user/transactions/${item.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-400"><div><h3 className="font-bold text-slate-900">{item.listing.title}</h3><p className="mt-1 text-sm text-slate-600">{viewerId === item.buyerId ? "Anda pembeli" : "Anda penjual"} · {formatRupiah(item.price)} · {item.status.replaceAll("_", " ")}</p></div><ArrowRight className="h-5 w-5 shrink-0 text-blue-600" /></Link>)}</section>}
    </main>
  );
}
