"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TransactionChat } from "@/components/dashboard/TransactionChat";
import { ProgressiveTransactionTabs } from "@/components/dashboard/ProgressiveTransactionTabs";
import { NegotiationTabView } from "@/components/dashboard/NegotiationTabView";
import { RekberTabView } from "@/components/dashboard/RekberTabView";
import { AmankanAkunTabView } from "@/components/dashboard/AmankanAkunTabView";
import { DisbursementTabView } from "@/components/dashboard/DisbursementTabView";
import { FloatingChatJumpButton } from "@/components/dashboard/FloatingChatJumpButton";
import type { TransactionViewModel } from "@/types/transaction-view-model";
import type { ChatTabStage } from "@/types";
import { getTransactionBuyerTotal } from "@/components/dashboard/TransactionFeeSummary";
import { formatRupiah } from "@/lib/utils";
import { usePayment } from "@/hooks/usePayment";
import { PaymentModal } from "@/components/dashboard/PaymentModal";
import { toast } from "sonner";

export function BuyerTransactionView({ initialTransaction }: { initialTransaction: TransactionViewModel }) {
  const tx = initialTransaction;

  const totalPayment = getTransactionBuyerTotal(tx);
  const isPendingPayment = tx.status === "PENDING_PAYMENT";
  const { payment, isLoading: paymentLoading, error: paymentError, create, sync } = usePayment(tx.id, true);
  const [isPaymentOpen, setPaymentOpen] = useState(false);

  const paymentStatusLabel = payment
    ? {
        PENDING: "Menunggu pembayaran",
        SETTLEMENT: "Berhasil",
        EXPIRE: "Kedaluwarsa",
        DENY: "Ditolak",
        CANCEL: "Dibatalkan",
        FAILURE: "Gagal",
      }[payment.status]
    : null;

  useEffect(() => {
    if (
      isPendingPayment &&
      payment &&
      ["SETTLEMENT", "EXPIRE", "DENY", "CANCEL", "FAILURE"].includes(payment.status)
    ) {
      window.location.reload();
    }
  }, [isPendingPayment, payment?.status]);

  const openPayment = async () => {
    const nextPayment = payment ?? (await create());
    if (nextPayment) setPaymentOpen(true);
  };

  const getInitialStage = (): ChatTabStage => {
    if (tx.status === "COMPLETED") {
      return "DISBURSEMENT";
    }
    if (
      tx.status === "PAYMENT_CONFIRMED" ||
      tx.status === "IN_HANDOVER" ||
      tx.status === "PENDING_BUYER_CONFIRM"
    ) {
      return "HANDOVER";
    }
    if (tx.status === "PENDING_PAYMENT") {
      return "REKBER";
    }
    return "NEGOTIATION";
  };

  const [activeStage, setActiveStage] = useState<ChatTabStage>(getInitialStage());

  const handleConfirmReceipt = () => {
    toast.success("Akun berhasil dikonfirmasi! Silakan lanjut ke Tahap 4 untuk pencairan dana bersama Admin.");
  };

  const handleOpenDispute = () => {
    toast.info("Form komplain/dispute terbuka. Admin Rekber akan segera meninjau.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 flex flex-col lg:flex-row gap-8">
      {/* 🚀 Dynamic Floating Chat Button */}
      <FloatingChatJumpButton targetId="transaction-chat-section" theme="blue" />

      <div className="hidden lg:block">
        <DashboardSidebar role="user" />
      </div>
      <div className="flex-1 space-y-6">
        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
            <Link href="/user" className="inline-flex items-center gap-1 hover:text-blue-700">
              <ArrowLeft size={14} /> Kembali ke Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/user/transactions" className="text-slate-500 hover:text-slate-700">
              Riwayat
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold">
                Transaksi #{tx.id.startsWith("trx_") ? tx.id.replace("trx_", "TRX-") : tx.id}
              </h1>
              <p className="text-txt-muted text-xs sm:text-sm">
                Item: <strong className="text-slate-800">{tx.listing.title}</strong> · {new Date(tx.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
            <StatusBadge status={tx.status} />
          </div>
        </div>

        {/* 🌟 4-Stage Progressive Tab Navigation & Timeline Bar */}
        {isPendingPayment && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5" role="status">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl bg-amber-500 p-2 text-white">
                <AlertTriangle size={20} aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Menunggu Pembayaran</h4>
                <p className="mt-0.5 text-xs text-amber-800">
                  Total transaksi <strong>{formatRupiah(totalPayment)}</strong>. Buat QRIS untuk membayar melalui Midtrans Sandbox.
                </p>
                <button
                  type="button"
                  onClick={() => void openPayment()}
                  disabled={paymentLoading}
                  aria-busy={paymentLoading}
                  className="mt-3 min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
                >
                  {paymentLoading ? "Menyiapkan QRIS..." : payment ? "Tampilkan QRIS" : "Buat QRIS"}
                </button>
                {paymentError && <p className="mt-2 text-xs text-amber-800">{paymentError}</p>}
              </div>
            </div>
          </div>
        )}

        {!isPendingPayment && payment && (
          <div
            className={`rounded-2xl border p-4 sm:p-5 ${
              payment.status === "SETTLEMENT"
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
            role="status"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status pembayaran QRIS
                </p>
                <p className="mt-1 font-bold text-slate-900">{paymentStatusLabel}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Nominal {formatRupiah(payment.amount)} melalui Midtrans Sandbox.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Lihat detail pembayaran
              </button>
            </div>
          </div>
        )}

        <ProgressiveTransactionTabs
          currentStage={activeStage}
          onSelectStage={setActiveStage}
          transactionStatus={tx.status}
          offerStatus="ACCEPTED"
        />

        {/* 🌟 Tab 1: Negosiasi (Side by Side dengan Chat 2 Arah) */}
        {activeStage === "NEGOTIATION" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <NegotiationTabView
                listingId={tx.listing.id}
                originalPrice={tx.price}
                role="BUYER"
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                isSuspendedDueToOtherBuyer={tx.id === "trx_buyer_suspended"}
                isLocked={activeStage !== "NEGOTIATION"}
                onProceedToCheckout={() => setActiveStage("REKBER")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="NEGOTIATION"
                defaultRole="BUYER"
                defaultUserName={tx.buyer.username}
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                adminName={tx.admin.user.username}
              />
            </div>
          </div>
        )}

        {/* 🌟 Tab 2: Bayar ke Rekber (Side by Side dengan Chat 3 Arah) */}
        {activeStage === "REKBER" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <RekberTabView
                transactionId={tx.id}
                price={tx.price}
                platformFee={tx.platformFee}
                adminFee={tx.adminFee}
                adminName={tx.admin.user.username}
                adminRole="Admin Rekber Internal"
                transactionStatus={tx.status}
                role="BUYER"
                onOpenDispute={handleOpenDispute}
                onMoveToHandover={() => setActiveStage("HANDOVER")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="REKBER"
                defaultRole="BUYER"
                defaultUserName={tx.buyer.username}
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                adminName={tx.admin.user.username}
              />
            </div>
          </div>
        )}

        {/* 🌟 Tab 3: Amankan Akun (Side by Side dengan Chat 2 Arah Privat) */}
        {activeStage === "HANDOVER" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <AmankanAkunTabView
                transactionId={tx.id}
                role="BUYER"
                transactionStatus={tx.status}
                onConfirmReceipt={handleConfirmReceipt}
                onProceedToDisbursement={() => setActiveStage("DISBURSEMENT")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="HANDOVER"
                defaultRole="BUYER"
                defaultUserName={tx.buyer.username}
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                adminName={tx.admin.user.username}
              />
            </div>
          </div>
        )}

        {/* 🌟 Tab 4: Pencairan Dana & Selesai (Side by Side dengan Chat 3 Arah) */}
        {activeStage === "DISBURSEMENT" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <DisbursementTabView
                transactionId={tx.id}
                price={tx.price}
                sellerName={tx.listing.seller.username}
                buyerName={tx.buyer.username}
                adminName={tx.admin.user.username}
                role="BUYER"
                transactionStatus={tx.status}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="DISBURSEMENT"
                defaultRole="BUYER"
                defaultUserName={tx.buyer.username}
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                adminName={tx.admin.user.username}
              />
            </div>
          </div>
        )}
      </div>
      {payment && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setPaymentOpen(false)}
          payment={payment}
          listingTitle={tx.listing.title}
          isSyncing={paymentLoading}
          onSync={async () => {
            const next = await sync();
            if (next && ["SETTLEMENT", "EXPIRE", "DENY", "CANCEL", "FAILURE"].includes(next.status)) {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}

