"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, CheckCircle2, Star, Send, Building2, AlertCircle, ArrowRight, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ChatSenderRole, TransactionStatus } from "@/types";
import { toast } from "sonner";

interface DisbursementTabViewProps {
  transactionId: string;
  price: number;
  sellerName: string;
  buyerName: string;
  adminName: string;
  role: ChatSenderRole;
  transactionStatus: TransactionStatus;
  onCompleteTransaction?: () => void;
}

export function DisbursementTabView({
  transactionId,
  price,
  sellerName,
  buyerName,
  adminName,
  role,
  transactionStatus,
  onCompleteTransaction,
}: DisbursementTabViewProps) {
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("8920193821");
  const [accountHolder, setAccountHolder] = useState(sellerName);
  const [isSavedBank, setIsSavedBank] = useState(true);

  const [isDisbursed, setIsDisbursed] = useState(transactionStatus === "COMPLETED");
  const [disburseProof, setDisburseProof] = useState<string | null>(
    transactionStatus === "COMPLETED" ? "/screenshots/efootball_89.jpg" : null
  );

  // Review & Rating State (Buyer)
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !accountHolder) {
      toast.error("Lengkapi detail nomor rekening dan nama pemilik");
      return;
    }
    setIsSavedBank(true);
    toast.success("Informasi rekening pencairan berhasil disimpan!");
  };

  const handleAdminDisburse = () => {
    setIsDisbursed(true);
    setDisburseProof("/screenshots/efootball_89.jpg");
    onCompleteTransaction?.();
    toast.success(`Dana ${formatCurrency(price)} resmi dicairkan ke rekening Penjual (${bankName} - ${accountNumber})!`);
  };

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
      <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm ${
        isDisbursed
          ? "bg-emerald-900 text-white border-emerald-700"
          : "bg-slate-900 text-white border-slate-800"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDisbursed ? "bg-emerald-500 text-white" : "bg-blue-600/30 text-blue-400 border border-blue-500/40"
            }`}>
              {isDisbursed ? <CheckCircle2 className="w-6 h-6" /> : <Wallet className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
                Tahap 4: Finalisasi & Pencairan
              </span>
              <h4 className="font-bold text-sm sm:text-base">
                {isDisbursed ? "Transaksi Selesai & Dana Berhasil Dicairkan!" : "Pencairan Dana Hasil Penjualan"}
              </h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-300 block">Nominal Bersih Penjual:</span>
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
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isSavedBank ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}>
            {isSavedBank ? "Data Terverifikasi" : "Perlu Diisi Penjual"}
          </span>
        </div>

        {role === "SELLER" && !isDisbursed && (
          <form onSubmit={handleSaveBank} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1 font-medium">Bank / E-Wallet:</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="BCA">BCA</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BRI">BRI</option>
                <option value="BNI">BNI</option>
                <option value="DANA">DANA</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1 font-medium">Nomor Rekening / HP:</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 8920193821"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1 font-medium">Atas Nama:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Nama Pemilik"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>
        )}

        {(role !== "SELLER" || isDisbursed) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tujuan Transfer:</span>
              <span className="font-bold text-slate-800">{bankName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nomor Rekening:</span>
              <span className="font-bold text-slate-800 font-mono">{accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Atas Nama:</span>
              <span className="font-bold text-slate-800">{accountHolder}</span>
            </div>
          </div>
        )}
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

        {isDisbursed ? (
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3 text-emerald-950 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Dana Telah Diteruskan ke Penjual</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Bukti transfer pencairan telah diunggah ke room chat bersama Admin.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
              STATUS: LUNAS
            </span>
          </div>
        ) : role === "ADMIN" ? (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-amber-950">
              <p className="font-bold">Konfirmasi Mutasi Pencairan</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Pastikan transfer sebesar {formatCurrency(price)} ke {bankName} {accountNumber} ({accountHolder}) telah berhasil.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAdminDisburse}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Konfirmasi Dana Sudah Cair
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            Admin {adminName} sedang memproses transfer pencairan dana sebesar <strong>{formatCurrency(price)}</strong> ke rekening Penjual. Bukti transfer akan otomatis dikirimkan ke chat di samping.
          </div>
        )}
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
