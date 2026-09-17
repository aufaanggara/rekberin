"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, X, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { TransactionChat } from "@/components/dashboard/TransactionChat";

interface ListingChatLauncherProps {
  transactionId: string;
  listingTitle: string;
  buyerName?: string;
  sellerName?: string;
  adminName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ListingChatLauncher({
  transactionId,
  listingTitle,
  buyerName = "buyer_testing",
  sellerName = "efootball_seller1",
  adminName = "Rekber_Anto",
  isOpen: controlledIsOpen,
  onOpenChange,
}: ListingChatLauncherProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isChatOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setChatOpen = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    setInternalIsOpen(val);
  };

  return (
    <>
      {/* 1. BUTTON IN SIDEBAR PANEL */}
      <div className="w-full">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-800 font-bold text-xs transition-all shadow-xs flex items-center justify-between gap-2 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform">
              Room Chat Rekber (3 Arah)
            </span>
          </div>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
            Live
          </span>
        </button>
      </div>

      {/* 2. FLOATING BOTTOM-RIGHT TRIGGER BUTTON */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setChatOpen(!isChatOpen)}
          className="bg-slate-900 hover:bg-blue-600 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2.5 border border-slate-700 hover:border-blue-500 transition-all hover:scale-105 cursor-pointer"
          aria-label="Buka Chat Room 3 Arah"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <MessageSquare size={18} />
          <span className="text-xs font-bold hidden sm:inline">
            Room Chat Rekber (Real-time)
          </span>
        </button>
      </div>

      {/* 3. MODAL / SLIDE-OVER DRAWER */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center sm:p-4"
          onClick={() => setChatOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-none sm:rounded-2xl w-full max-w-2xl h-full sm:h-[680px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="truncate">
                  <h4 className="font-bold text-sm truncate flex items-center gap-1.5">
                    Room Chat Transaksi #{transactionId}
                  </h4>
                  <p className="text-[11px] text-slate-300 truncate">{listingTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/user/transactions/${transactionId}`}
                  className="text-[11px] font-semibold text-blue-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                  title="Buka di halaman penuh dashboard"
                >
                  <ExternalLink size={12} />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Tutup Chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Embedded Transaction Chat */}
            <div className="flex-1 overflow-hidden">
              <TransactionChat
                transactionId={transactionId}
                defaultRole="BUYER"
                defaultUserName={buyerName}
                buyerName={buyerName}
                sellerName={sellerName}
                adminName={adminName}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
