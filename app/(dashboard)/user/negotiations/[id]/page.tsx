"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Gamepad2, Tag } from "lucide-react";
import Image from "next/image";
import { ConversationChat } from "@/components/dashboard/ConversationChat";
import { ConversationTabs, type ConversationTab } from "@/components/dashboard/MobileConversationTabs";
import { formatRupiah } from "@/lib/utils";

interface Negotiation {
  id: string;
  buyerId: string;
  sellerId: string;
  offeredPrice: number | null;
  offerNotes: string | null;
  offerStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  version: number;
  listing: { id: string; title: string; price: number; status: string; images: string[] };
  buyer: { fullName: string };
  seller: { fullName: string };
  transaction: { id: string } | null;
}

export default function NegotiationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const [viewerId, setViewerId] = useState<string | null | undefined>(undefined);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileTab, setMobileTab] = useState<ConversationTab>(search.get("focus") === "offer" ? "action" : "chat");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/negotiations/${encodeURIComponent(params.id)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Negosiasi tidak dapat dimuat.");
      setNegotiation(payload.negotiation);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Negosiasi tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void getSession().then((session) => {
      const user = session?.user as { id?: unknown } | undefined;
      setViewerId(typeof user?.id === "string" ? user.id : null);
    }).catch(() => setViewerId(null));
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (negotiation?.transaction) router.replace(`/user/transactions/${negotiation.transaction.id}`);
  }, [negotiation?.transaction?.id, router]);

  async function mutate(body: unknown) {
    setBusy(true);
    try {
      const response = await fetch(`/api/negotiations/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Tawaran tidak dapat diproses.");
      setNegotiation(payload.negotiation);
      toast.success("Status tawaran diperbarui.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Tawaran tidak dapat diproses.");
    } finally {
      setBusy(false);
    }
  }

  function submitOffer(event: FormEvent) {
    event.preventDefault();
    void mutate({ action: "OFFER", price: Number(price), notes });
  }

  async function checkout() {
    setBusy(true);
    try {
      const response = await fetch(`/api/negotiations/${encodeURIComponent(params.id)}/checkout`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Pembayaran belum dapat dibuka.");
      router.push(`/user/transactions/${payload.transactionId}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Pembayaran belum dapat dibuka.");
      setBusy(false);
    }
  }

  if (loading || viewerId === undefined) return <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-slate-600" aria-busy="true">Memuat negosiasi...</div>;
  if (!viewerId) return <div className="mx-auto max-w-6xl px-4 py-16"><p className="text-sm text-slate-700">Masuk untuk melihat negosiasi.</p><Link href={`/login?callbackUrl=${encodeURIComponent(`/user/negotiations/${params.id}`)}`} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">Masuk</Link></div>;
  if (error || !negotiation) return <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-red-700" role="alert">{error || "Negosiasi tidak ditemukan."}</div>;

  const isBuyer = viewerId === negotiation.buyerId;
  const isSeller = viewerId === negotiation.sellerId;
  if (!isBuyer && !isSeller) return <div className="mx-auto max-w-6xl px-4 py-16" role="alert">Akses negosiasi ditolak.</div>;
  const canOffer = isBuyer && negotiation.offerStatus !== "ACCEPTED" && negotiation.listing.status === "AVAILABLE";
  const canDecide = isSeller && negotiation.offeredPrice !== null && negotiation.offerStatus === "PENDING" && negotiation.listing.status === "AVAILABLE";
  const suggestedPrices = [...new Set([1, 0.95, 0.9, 0.85].map((factor) => Math.round(negotiation.listing.price * factor / 1000) * 1000))].filter((value) => value >= 10000 && value <= negotiation.listing.price);

  return (
    <main className="mx-auto max-w-7xl space-y-0 pb-24 lg:space-y-5 lg:px-4 lg:py-6">
      <Link href="/user" className="hidden min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline lg:inline-flex">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke dashboard
      </Link>
      <div className="hidden lg:block">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{mobileTab === "chat" ? "Chat" : "Ajukan penawaran"}</h1>
        <p className="mt-1 text-sm text-slate-600">{negotiation.listing.title} · {isBuyer ? negotiation.seller.fullName : negotiation.buyer.fullName}</p>
      </div>
      <div className="flex items-center gap-3 bg-white px-4 py-3 lg:hidden">
        {negotiation.listing.images[0] ? <Image src={negotiation.listing.images[0]} alt="" width={56} height={56} unoptimized className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Gamepad2 aria-hidden="true" /></div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{isBuyer ? negotiation.seller.fullName : negotiation.buyer.fullName}</p>
          <h1 className="truncate text-sm font-bold text-blue-800">{mobileTab === "chat" ? "Chat" : "Ajukan penawaran"}</h1>
          <p className="truncate text-xs text-slate-600">{negotiation.listing.title} · {formatRupiah(negotiation.listing.price)}</p>
        </div>
      </div>
      <ConversationTabs active={mobileTab} onChange={setMobileTab} actionLabel="Ajukan tawaran" ActionIcon={Tag} />
      <div className="mx-auto max-w-4xl">
        <div id="mobile-chat-panel" role="tabpanel" aria-labelledby="mobile-chat-tab" className={mobileTab === "chat" ? "block" : "hidden"}>
          <ConversationChat apiPath={`/api/negotiations/${encodeURIComponent(params.id)}/messages`} viewerId={viewerId} note="Percakapan ini tetap tersedia setelah pembayaran dimulai." />
        </div>
        <section id="mobile-action-panel" role="tabpanel" aria-labelledby="mobile-action-tab" className={`${mobileTab === "action" ? "block" : "hidden"} self-start bg-white px-4 py-5 lg:rounded-2xl lg:border lg:border-slate-200 lg:p-5 lg:shadow-sm`}>
          <div id="offer-panel">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Tag className="h-5 w-5 text-blue-600" aria-hidden="true" /> Ajukan penawaran</h2>
          <p className="mt-2 text-sm text-slate-600">Harga listing: <strong>{formatRupiah(negotiation.listing.price)}</strong></p>
          {negotiation.offeredPrice !== null && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-900">Tawaran: {formatRupiah(negotiation.offeredPrice)}</p>
              <p className="mt-1 text-sm text-blue-800">
                {negotiation.offerStatus === "ACCEPTED" ? "Diterima seller. Buyer dapat lanjut bayar." :
                  negotiation.offerStatus === "REJECTED" ? "Ditolak seller. Buyer dapat mengajukan tawaran baru." : "Menunggu keputusan seller."}
              </p>
              {negotiation.offerNotes && <p className="mt-2 text-xs text-slate-600">{negotiation.offerNotes}</p>}
            </div>
          )}
          {canOffer && (
            <form onSubmit={submitOffer} className="mt-5 space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Pilihan harga tawaran">
                {suggestedPrices.map((suggestion) => <button key={suggestion} type="button" onClick={() => setPrice(String(suggestion))} className="min-h-11 shrink-0 rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800 hover:bg-blue-100">{formatRupiah(suggestion)}</button>)}
              </div>
              <label className="block text-sm font-semibold text-slate-800" htmlFor="offer-price">Harga tawaran (Rp)</label>
              <input id="offer-price" type="number" inputMode="numeric" min={10000} max={negotiation.listing.price} required value={price} onChange={(event) => setPrice(event.target.value)} className="min-h-14 w-full rounded-xl border border-slate-300 px-3 text-2xl font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500" />
              <label className="block text-sm font-semibold text-slate-800" htmlFor="offer-notes">Catatan (opsional)</label>
              <textarea id="offer-notes" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm focus-visible:ring-2 focus-visible:ring-blue-500" />
              <button disabled={busy} type="submit" className="min-h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Memproses..." : "Kirim tawaran"}</button>
            </form>
          )}
          {canDecide && (
            <div className="mt-5 flex gap-3">
              <button disabled={busy} onClick={() => void mutate({ action: "REJECT", version: negotiation.version })} className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Tolak</button>
              <button disabled={busy} onClick={() => void mutate({ action: "ACCEPT", version: negotiation.version })} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Terima tawaran</button>
            </div>
          )}
          {isBuyer && negotiation.offerStatus === "ACCEPTED" && (
            <button disabled={busy} onClick={() => void checkout()} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Lanjut ke pembayaran
            </button>
          )}
          {isSeller && negotiation.offerStatus === "ACCEPTED" && <p className="mt-5 flex items-center gap-2 text-sm text-emerald-800"><Clock className="h-4 w-4" aria-hidden="true" /> Menunggu buyer membuka pembayaran.</p>}
          {negotiation.listing.status !== "AVAILABLE" && !negotiation.transaction && <p className="mt-5 text-sm text-amber-800">Listing sudah tidak tersedia.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
