"use client";

import { MessageSquare, Shield, KeyRound, CheckCircle2, Lock, ArrowRight, Clock, Wallet } from "lucide-react";
import type { ChatTabStage, TransactionStatus } from "@/types";

interface ProgressiveTransactionTabsProps {
  currentStage: ChatTabStage;
  onSelectStage: (stage: ChatTabStage) => void;
  transactionStatus: TransactionStatus;
  offerStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
}

export function ProgressiveTransactionTabs({
  currentStage,
  onSelectStage,
  transactionStatus,
  offerStatus = "ACCEPTED",
}: ProgressiveTransactionTabsProps) {
  const hasMovedPastNegotiation =
    currentStage === "REKBER" ||
    currentStage === "HANDOVER" ||
    currentStage === "DISBURSEMENT" ||
    transactionStatus !== "PENDING_PAYMENT";

  const isTab1Completed = hasMovedPastNegotiation || offerStatus === "ACCEPTED";
  const isTab1Locked = hasMovedPastNegotiation;

  const isTab2Unlocked = true;
  const isTab2Completed =
    transactionStatus === "PAYMENT_CONFIRMED" ||
    transactionStatus === "IN_HANDOVER" ||
    transactionStatus === "PENDING_BUYER_CONFIRM" ||
    transactionStatus === "COMPLETED" ||
    currentStage === "HANDOVER" ||
    currentStage === "DISBURSEMENT";

  const isTab3Unlocked =
    transactionStatus === "PAYMENT_CONFIRMED" ||
    transactionStatus === "IN_HANDOVER" ||
    transactionStatus === "PENDING_BUYER_CONFIRM" ||
    transactionStatus === "COMPLETED" ||
    currentStage === "HANDOVER" ||
    currentStage === "DISBURSEMENT";

  const isTab3Completed =
    transactionStatus === "PENDING_BUYER_CONFIRM" ||
    transactionStatus === "COMPLETED" ||
    currentStage === "DISBURSEMENT";

  const isTab4Unlocked =
    transactionStatus === "PENDING_BUYER_CONFIRM" ||
    transactionStatus === "COMPLETED" ||
    currentStage === "DISBURSEMENT";

  const isTab4Completed = transactionStatus === "COMPLETED";

  // Note: All tabs unlocked for interactive developer review and UI inspection
  const tabs: {
    id: ChatTabStage;
    stepNumber: number;
    label: string;
    description: string;
    icon: typeof MessageSquare;
    isUnlocked: boolean;
    isCompleted: boolean;
    isLockedState?: boolean;
  }[] = [
    {
      id: "NEGOTIATION",
      stepNumber: 1,
      label: "1. Negosiasi",
      description: "2 Arah (Buyer-Seller)",
      icon: MessageSquare,
      isUnlocked: true,
      isCompleted: isTab1Completed,
      isLockedState: false,
    },
    {
      id: "REKBER",
      stepNumber: 2,
      label: "2. Bayar Rekber",
      description: "3 Arah (QRIS & Escrow)",
      icon: Shield,
      isUnlocked: true,
      isCompleted: isTab2Completed,
      isLockedState: false,
    },
    {
      id: "HANDOVER",
      stepNumber: 3,
      label: "3. Amankan Akun",
      description: "2 Arah Privat (Login & OTP)",
      icon: KeyRound,
      isUnlocked: true,
      isCompleted: isTab3Completed,
      isLockedState: false,
    },
    {
      id: "DISBURSEMENT",
      stepNumber: 4,
      label: "4. Pencairan Dana",
      description: "3 Arah (Transfer & Selesai)",
      icon: Wallet,
      isUnlocked: true,
      isCompleted: isTab4Completed,
      isLockedState: false,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4.5 shadow-md text-white">
      {/* Timeline Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
            Timeline Alur Transaksi Rekberin (4 Tahap)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Tahap Berjalan:</span>
          <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {currentStage === "NEGOTIATION"
              ? "Tahap 1: Negosiasi & Deal"
              : currentStage === "REKBER"
              ? "Tahap 2: Bayar ke Rekber (Escrow)"
              : currentStage === "HANDOVER"
              ? "Tahap 3: Amankan Akun (Privat)"
              : "Tahap 4: Pencairan Dana & Selesai"}
          </span>
        </div>
      </div>

      {/* 4 Step Interactive Timeline Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentStage === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.isLockedState || !tab.isUnlocked}
              onClick={() => {
                if (!tab.isLockedState && tab.isUnlocked) {
                  onSelectStage(tab.id);
                }
              }}
              className={`relative flex items-center justify-between p-3 sm:p-3.5 rounded-xl transition-all text-left ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg border border-blue-400/50 ring-2 ring-blue-500/30 cursor-default"
                  : tab.isLockedState
                  ? "bg-slate-950/60 text-slate-400 border border-slate-800/80 cursor-not-allowed opacity-75"
                  : tab.isCompleted
                  ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-emerald-500/30 cursor-pointer"
                  : tab.isUnlocked
                  ? "bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50 cursor-pointer"
                  : "bg-slate-950/40 text-slate-500 border border-slate-800/40 cursor-not-allowed opacity-50"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm ${
                    isActive
                      ? "bg-white text-blue-600 shadow-xs"
                      : tab.isLockedState
                      ? "bg-slate-800 text-slate-400"
                      : tab.isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : tab.isUnlocked
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-900 text-slate-600"
                  }`}
                >
                  {tab.isLockedState ? (
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  ) : tab.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </div>

                <div className="truncate">
                  <div className="font-bold text-xs sm:text-sm truncate">
                    {tab.label}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-300/80 truncate mt-0.5">
                    {tab.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-1.5 sm:ml-2">
                {isActive ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-white text-blue-700">
                    Aktif
                  </span>
                ) : tab.isLockedState ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                ) : tab.isCompleted ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓
                  </span>
                ) : tab.isUnlocked ? (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-800 text-slate-500">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


