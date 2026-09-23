"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProgressiveTransactionTabs } from "@/components/dashboard/ProgressiveTransactionTabs";
import { RekberTabView } from "@/components/dashboard/RekberTabView";
import { AmankanAkunTabView } from "@/components/dashboard/AmankanAkunTabView";
import { DisbursementTabView } from "@/components/dashboard/DisbursementTabView";
import { TransactionChat } from "@/components/dashboard/TransactionChat";
import { FloatingChatJumpButton } from "@/components/dashboard/FloatingChatJumpButton";
import type { TransactionViewModel } from "@/types/transaction-view-model";
import type { ChatTabStage } from "@/types";
import { toast } from "sonner";

export function AdminTransactionView({
  initialTransaction,
}: {
  initialTransaction: TransactionViewModel;
}) {
  const tx = initialTransaction;
  const [activeStage, setActiveStage] = useState<ChatTabStage>("REKBER");

  const handleVerifyPayment = () => {
    toast.success("Pembayaran terverifikasi! Dana resmi diamankan di rekening escrow.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 flex flex-col lg:flex-row gap-8">
      {/* 🚀 Dynamic Floating Chat Button */}
      <FloatingChatJumpButton targetId="transaction-chat-section" theme="amber" />

      <div className="hidden lg:block">
        <DashboardSidebar role="admin" />
      </div>
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-2">
            <Link href="/admin" className="inline-flex items-center gap-1 hover:text-amber-800">
              <ArrowLeft size={14} /> Kembali ke Dashboard Admin
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/admin/transactions" className="text-slate-500 hover:text-slate-700">
              Antrean Transaksi
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

        {/* 🌟 Tab 2: Rekber & Escrow (Side by Side dengan Chat Admin) */}
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
                role="ADMIN"
                onVerifyPayment={handleVerifyPayment}
                onMoveToHandover={() => setActiveStage("HANDOVER")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="REKBER"
                defaultRole="ADMIN"
                defaultUserName={tx.admin.user.username}
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                adminName={tx.admin.user.username}
              />
            </div>
          </div>
        )}

        {/* 🌟 Tab 3: Amankan Akun (Side by Side dengan Chat Admin) */}
        {activeStage === "HANDOVER" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <AmankanAkunTabView
                transactionId={tx.id}
                role="ADMIN"
                transactionStatus={tx.status}
                onProceedToDisbursement={() => setActiveStage("DISBURSEMENT")}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="HANDOVER"
                defaultRole="ADMIN"
                defaultUserName={tx.admin.user.username}
                buyerName={tx.buyer.username}
                sellerName={tx.listing.seller.username}
                adminName={tx.admin.user.username}
              />
            </div>
          </div>
        )}

        {/* 🌟 Tab 4: Pencairan Dana (Side by Side dengan Chat Admin) */}
        {activeStage === "DISBURSEMENT" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <DisbursementTabView
                transactionId={tx.id}
                price={tx.price}
                sellerName={tx.listing.seller.username}
                buyerName={tx.buyer.username}
                adminName={tx.admin.user.username}
                role="ADMIN"
                transactionStatus={tx.status}
              />
            </div>
            <div id="transaction-chat-section" className="lg:col-span-6 scroll-mt-20">
              <TransactionChat
                transactionId={tx.id}
                transactionStatus={tx.status}
                stage="DISBURSEMENT"
                defaultRole="ADMIN"
                defaultUserName={tx.admin.user.username}
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


