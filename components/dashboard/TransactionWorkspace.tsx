"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Gamepad2, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ConversationChat } from "@/components/dashboard/ConversationChat";
import { ConversationTabs, type ConversationTab } from "@/components/dashboard/MobileConversationTabs";
import { PaymentDetails } from "@/components/dashboard/PaymentModal";
import { usePayment } from "@/hooks/usePayment";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { submitHandoverAction } from "@/lib/handover-api-client";
import { formatRupiah } from "@/lib/utils";
import type { TransactionApiResponse } from "@/types/transaction-api";

type ViewerRole = "buyer" | "seller" | "admin";

function remainingTime(deadline: string | null | undefined, now: number) {
  if (!deadline) return "Belum tersedia";
  const seconds = Math.max(0, Math.floor((Date.parse(deadline) - now) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} jam ${minutes} menit`;
}

export function TransactionWorkspace({
  transaction,
  viewerId,
  role,
  onRefresh,
}: {
  transaction: TransactionApiResponse;
  viewerId: string;
  role: ViewerRole;
  onRefresh: (silent?: boolean) => Promise<void>;
}) {
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [channel, setChannel] = useState<"web" | "whatsapp">("web");
  const [mobileTab, setMobileTab] = useState<ConversationTab>("action");
  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const isAdmin = role === "admin";
  const status = transaction.status;
  const { data: currentUser } = useCurrentUser();
  const payment = usePayment(transaction.id, isBuyer && status === "PENDING_PAYMENT");
  const handover = transaction.handover;
  const handoverActive = ["PAYMENT_CONFIRMED", "IN_HANDOVER", "PENDING_BUYER_CONFIRM"].includes(status);
  const inDispute = status === "DISPUTED";
  const isClosed = status === "COMPLETED" || status === "CANCELLED";
  const deadlinePassed = !!handover?.deadlineAt && Date.parse(handover.deadlineAt) <= now;
  const ownWhatsapp = isBuyer ? handover?.buyerWhatsapp : handover?.sellerWhatsapp;
  const partnerWhatsapp = isBuyer ? handover?.sellerWhatsapp : handover?.buyerWhatsapp;

  useEffect(() => {
    const savedNumber = ownWhatsapp ?? currentUser?.whatsappNumber;
    if (savedNumber) setWhatsapp((current) => current || savedNumber);
  }, [ownWhatsapp, currentUser?.whatsappNumber]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isClosed) return;
    const timer = window.setInterval(() => void onRefresh(true), 8_000);
    return () => window.clearInterval(timer);
  }, [isClosed, onRefresh]);

  useEffect(() => {
    if (payment.payment?.status === "SETTLEMENT" && status === "PENDING_PAYMENT") {
      void onRefresh(true);
    }
  }, [payment.payment?.status, status, onRefresh]);

  async function act(action: "START" | "CONFIRM_RECEIPT" | "REPORT_ISSUE" | "RESUME" | "CANCEL" | "SET_WHATSAPP", details: { reason?: string; whatsapp?: string | null } = {}) {
    setBusy(true);
    try {
      await submitHandoverAction(transaction.id, action, details);
      await onRefresh(true);
      if (action === "REPORT_ISSUE") { setReportOpen(false); setReason(""); }
      toast.success(action === "SET_WHATSAPP" ? "Kontak WhatsApp disimpan." : "Status transaksi diperbarui.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aksi gagal diproses.");
    } finally {
      setBusy(false);
    }
  }

  function submitReport(event: FormEvent) {
    event.preventDefault();
    void act("REPORT_ISSUE", { reason });
  }

  function submitWhatsapp(event: FormEvent) {
    event.preventDefault();
    void act("SET_WHATSAPP", { whatsapp });
  }

  async function openPayment() {
    if (!payment.payment) {
      const created = await payment.create();
      if (!created) return;
    }
    setMobileTab("action");
  }

  const statusLabel: Record<string, string> = {
    PENDING_PAYMENT: "Menunggu pembayaran",
    PAYMENT_CONFIRMED: "Pembayaran dikonfirmasi",
    IN_HANDOVER: "Serah terima akun",
    PENDING_BUYER_CONFIRM: "Menunggu konfirmasi buyer",
    DISPUTED: "Masalah dilaporkan",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  const actionLabel = status === "PENDING_PAYMENT" ? "Pembayaran" : isClosed ? "Ringkasan" : "Serah terima";
  const ActionIcon = status === "PENDING_PAYMENT" ? QrCode : isClosed ? CheckCircle2 : ShieldCheck;
  const partner = isBuyer ? transaction.seller : transaction.buyer;

  return (
    <main className="mx-auto max-w-7xl space-y-0 pb-24 lg:space-y-5 lg:px-4 lg:py-6">
      <Link href={isAdmin ? "/admin/transactions" : "/user"} className={`min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline ${isAdmin ? "inline-flex px-4 lg:px-0" : "hidden lg:inline-flex"}`}>← Kembali ke dashboard</Link>
      <div className="hidden flex-wrap items-start justify-between gap-3 lg:flex">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{mobileTab === "chat" ? "Chat" : actionLabel}</h1>
          <p className="mt-1 text-sm text-slate-600">{transaction.listing.title} · Transaksi #{transaction.id} · {formatRupiah(transaction.price)}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">{statusLabel[status] ?? status}</span>
      </div>
      <div className="flex items-center gap-3 bg-white px-4 py-3 lg:hidden">
        {transaction.listing.images[0] ? <Image src={transaction.listing.images[0]} alt="" width={56} height={56} unoptimized className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Gamepad2 aria-hidden="true" /></div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{isAdmin ? "Transaksi buyer dan seller" : partner.fullName}</p>
          <h1 className="truncate text-sm font-bold text-blue-800">{mobileTab === "chat" ? "Chat" : actionLabel}</h1>
          <p className="truncate text-xs text-slate-600">{transaction.listing.title} · {formatRupiah(transaction.price)}</p>
        </div>
        <span className="max-w-24 rounded-full bg-blue-50 px-2 py-1 text-center text-[11px] font-bold leading-tight text-blue-800">{statusLabel[status] ?? status}</span>
      </div>
      <ConversationTabs active={mobileTab} onChange={setMobileTab} actionLabel={actionLabel} ActionIcon={ActionIcon} />
      <div className="mx-auto max-w-4xl">
        <div id="mobile-chat-panel" role="tabpanel" aria-labelledby="mobile-chat-tab" className={mobileTab === "chat" ? "block" : "hidden"}>
        {isAdmin && !handover?.adminJoinedAt ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">Admin akan bergabung ke chat jika buyer melaporkan masalah.</div>
        ) : (
          <ConversationChat
            apiPath={`/api/transactions/${encodeURIComponent(transaction.id)}/messages`}
            viewerId={viewerId}
            canSend={!isClosed}
            note={inDispute ? "Admin telah bergabung untuk meninjau laporan buyer." : "Buyer dan seller dapat berbicara di sini selama transaksi berlangsung."}
          />
        )}
        </div>
        <section id="mobile-action-panel" role="tabpanel" aria-labelledby="mobile-action-tab" className={`${mobileTab === "action" ? "block" : "hidden"} h-fit space-y-5 bg-white px-4 py-5 lg:rounded-2xl lg:border lg:border-slate-200 lg:p-5 lg:shadow-sm`}>
          {status === "PENDING_PAYMENT" && (
            <>
              <h2 className="text-lg font-bold text-slate-900">Pembayaran</h2>
              <p className="text-sm text-slate-600">Tawaran seller telah diterima. Buyer dapat membayar melalui QRIS sandbox.</p>
              {isBuyer ? (
                <>
                  {payment.error && <p role="alert" className="text-sm text-red-700">{payment.error}</p>}
                  <button disabled={payment.isLoading} onClick={() => void openPayment()} className="min-h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{payment.isLoading ? "Memuat..." : payment.payment ? "Lihat pembayaran" : "Buat pembayaran"}</button>
                  {payment.payment && <PaymentDetails payment={payment.payment} listingTitle={transaction.listing.title} isSyncing={payment.isLoading} onSync={payment.sync} />}
                </>
              ) : <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Menunggu buyer menyelesaikan pembayaran.</p>}
            </>
          )}

          {(handoverActive || inDispute) && (
            <>
              <h2 className="text-lg font-bold text-slate-900">Serah terima akun</h2>
              <p className="text-sm text-slate-600">Pembayaran dikonfirmasi {handover?.startedAt ? new Date(handover.startedAt).toLocaleString("id-ID") : ""}. Buyer dan seller dapat bertukar data akun melalui chat web atau WhatsApp.</p>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-bold">{inDispute ? "Waktu konfirmasi ditunda selama masalah ditinjau" : `Sisa waktu konfirmasi: ${remainingTime(handover?.deadlineAt, now)}`}</p>
                <p className="mt-1">Jika buyer tidak mengonfirmasi atau melaporkan masalah dalam 2 jam sejak pembayaran dikonfirmasi, sistem menyelesaikan transaksi dan mencatat transfer dummy ke seller.</p>
              </div>
              {(isBuyer || isSeller) && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-bold text-slate-900">Pilih saluran berbagi data</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setChannel("web")} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${channel === "web" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-300 text-slate-700"}`}>Chat web</button>
                    <button type="button" onClick={() => setChannel("whatsapp")} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${channel === "whatsapp" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700"}`}>WhatsApp</button>
                  </div>
                  {channel === "web" ? <button type="button" onClick={() => setMobileTab("chat")} className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:underline">Buka chat web ↑</button> : (
                    <>
                      <form onSubmit={submitWhatsapp} className="space-y-2">
                        <label htmlFor="whatsapp-number" className="block text-sm font-semibold text-slate-700">Nomor WhatsApp Anda {ownWhatsapp ? `(tersimpan: +${ownWhatsapp})` : ""}</label>
                        <div className="flex gap-2"><input id="whatsapp-number" type="tel" inputMode="tel" placeholder="contoh: 628123456789" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm" /><button type="submit" disabled={busy || !whatsapp.trim()} className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50">Simpan</button></div>
                      </form>
                      {partnerWhatsapp ? <a href={`https://wa.me/${partnerWhatsapp}?text=${encodeURIComponent(`Halo, saya dari transaksi ${transaction.id} di Rekberin.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700">Buka WhatsApp {isBuyer ? "seller" : "buyer"}</a> : <p className="text-sm text-slate-600">Menunggu nomor WhatsApp {isBuyer ? "seller" : "buyer"}.</p>}
                    </>
                  )}
                </div>
              )}
              {isBuyer && handoverActive && status !== "PAYMENT_CONFIRMED" && (
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <button disabled={busy} onClick={() => void act("CONFIRM_RECEIPT")} className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Akun diterima</button>
                  {deadlinePassed ? <p className="text-sm text-amber-800">Batas laporan telah berakhir. Sistem sedang menyelesaikan transaksi.</p> : <button disabled={busy} onClick={() => setReportOpen((value) => !value)} className="min-h-11 w-full rounded-xl border border-red-300 px-4 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Laporkan masalah</button>}
                  {reportOpen && !deadlinePassed && <form onSubmit={submitReport} className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3"><label htmlFor="issue-reason" className="block text-sm font-bold text-red-900">Jelaskan masalah untuk admin</label><textarea id="issue-reason" required minLength={10} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28 w-full rounded-lg border border-red-300 p-3 text-sm" /><button disabled={busy || reason.trim().length < 10} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50">Kirim laporan</button></form>}
                </div>
              )}
              {inDispute && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Laporan buyer</p><p className="mt-1 whitespace-pre-wrap">{transaction.disputeReason}</p><p className="mt-2">Admin bergabung ke chat dan menentukan lanjut atau batal.</p></div>}
              {isAdmin && status === "PAYMENT_CONFIRMED" && <button disabled={busy} onClick={() => void act("START")} className="min-h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50">Mulai serah terima</button>}
              {isAdmin && inDispute && <div className="flex gap-2"><button disabled={busy} onClick={() => void act("RESUME")} className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50">Lanjutkan</button><button disabled={busy} onClick={() => void act("CANCEL")} className="min-h-11 flex-1 rounded-xl bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50">Batalkan</button></div>}
            </>
          )}

          {isClosed && (
            <>
              <h2 className="text-lg font-bold text-slate-900">{status === "COMPLETED" ? "Transaksi selesai" : "Transaksi dibatalkan"}</h2>
              <p className="text-sm text-slate-600">Listing: <strong>{status === "COMPLETED" ? "Terjual" : "Tersedia kembali"}</strong>.</p>
              {transaction.escrowTransfer ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Transfer dummy tercatat</p><p className="mt-1">{transaction.escrowTransfer.kind === "SELLER_PAYOUT" ? "Ke seller" : "Pengembalian ke buyer"}: {formatRupiah(transaction.escrowTransfer.amount)}</p><p className="mt-1 text-xs">Belum ada transfer bank atau e-wallet sungguhan. Provider payout belum terhubung.</p></div> : <p className="text-sm text-slate-600">Belum ada catatan transfer dummy untuk transaksi ini.</p>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
