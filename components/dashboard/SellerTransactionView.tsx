"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export function SellerTransactionView({ initialTransaction }: { initialTransaction: TransactionViewModel }) {
  const tx = initialTransaction;

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

  return (
    <div className="min-w-0 flex-1">
      {/* 🚀 Dynamic Floating Chat Button */}
      <FloatingChatJumpButton targetId="transaction-chat-section" theme="emerald" />

      <div className="flex-1 space-y-6">
        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-2">
            <Link href="/user" className="inline-flex items-center gap-1 hover:text-emerald-700">
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
                role="SELLER"
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                otherOffersCount={2}
                isLocked={activeStage !== "NEGOTIATION"}
                onProceedToCheckout={() => setActiveStage("REKBER")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="NEGOTIATION"
                defaultRole="SELLER"
                defaultUserName={tx.listing.seller.username}
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
                role="SELLER"
                onMoveToHandover={() => setActiveStage("HANDOVER")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="REKBER"
                defaultRole="SELLER"
                defaultUserName={tx.listing.seller.username}
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
                role="SELLER"
                transactionStatus={tx.status}
                onProceedToDisbursement={() => setActiveStage("DISBURSEMENT")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="HANDOVER"
                defaultRole="SELLER"
                defaultUserName={tx.listing.seller.username}
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
                role="SELLER"
                transactionStatus={tx.status}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="DISBURSEMENT"
                defaultRole="SELLER"
                defaultUserName={tx.listing.seller.username}
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                adminName={tx.admin.user.username}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


