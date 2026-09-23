"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, CheckCircle2, Star, Send, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ChatSenderRole, TransactionStatus } from "@/types";
import { toast } from "sonner";

interface DisbursementTabViewProps {
  transactionId: string;
  price: number;
  sellerName: string;
  adminName: string;
  role: ChatSenderRole;
  transactionStatus: TransactionStatus;
}

export function DisbursementTabView({
  transactionId,
  price,
  sellerName,
  adminName,
  role,
  transactionStatus,
}: DisbursementTabViewProps) {
  const isTransactionComplete = transactionStatus === "COMPLETED";

  // Review & Rating State (Buyer)
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Tuliskan ulasan singkat pengalaman transaksi Anda");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: reviewComment,
          type: "BUYER_TO_SELLER",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim ulasan.");
      }

      setIsReviewSubmitted(true);
      toast.success("Terima kasih! Ulasan dan rating berhasil dikirim.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim ulasan");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 🌟 Status Banner Pencairan */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-600/30 text-blue-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
                Tahap 4: Finalisasi & Pencairan
              </span>
              <h4 className="font-bold text-sm sm:text-base">
                {isTransactionComplete ? "Menunggu pencairan dana oleh admin" : "Tahap pencairan belum dimulai"}
              </h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-300 block">Nilai transaksi:</span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono">
              {formatCurrency(price)}
            </span>
          </div>
        </div>
      </div>

      {/* 🏦 Rekening Pencairan Penjual */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Rekening / E-Wallet Penjual
          </h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            Belum tersedia
          </span>
        </div>
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
          Data rekening pencairan belum tersedia untuk transaksi ini.
        </p>
      </div>

      {/* 👮 Panel Aksi Admin (Pencairan Dana) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Eksekusi Pencairan Dana (Admin Escrow)
          </h3>
          <span className="text-xs text-slate-500">
            Admin Bertugas: <strong>{adminName}</strong>
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          Belum ada catatan pencairan atau bukti transfer yang tersimpan untuk transaksi ini.
        </div>
      </div>

      {/* ⭐ Form Ulasan & Rating Penjual (Pembeli) */}
      {role === "BUYER" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Beri Ulasan & Rating Penjual
            </h3>
            <span className="text-[11px] text-slate-400">Penjual: {sellerName}</span>
          </div>

          {isReviewSubmitted ? (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ulasan Anda ({rating} ⭐) telah berhasil dipublikasikan ke profil penjual!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1 font-medium">Beri Bintang:</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1 font-medium">Ulasan Transaksi:</label>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Contoh: Penjual sangat responsif, akun sesuai spek dan serah terima cepat via Rekberin!"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim Ulasan
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
