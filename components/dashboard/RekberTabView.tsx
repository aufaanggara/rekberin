"use client";

import { useState, useEffect } from "react";
import { Clock, ShieldCheck, QrCode, UploadCloud, AlertCircle, PhoneCall, CheckCircle2, AlertTriangle, ArrowRight, Wallet, Check, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TransactionStatus, ChatSenderRole } from "@/types";
import { toast } from "sonner";

interface RekberTabViewProps {
  transactionId: string;
  price: number;
  platformFee: number;
  adminFee: number;
  adminName: string;
  adminRole: string;
  transactionStatus: TransactionStatus;
  role: ChatSenderRole;
  onVerifyPayment?: () => void;
  onOpenDispute?: () => void;
  onMoveToHandover?: () => void;
}

export function RekberTabView({
  transactionId,
  price,
  platformFee,
  adminFee,
  adminName,
  adminRole,
  transactionStatus,
  role,
  onVerifyPayment,
  onOpenDispute,
  onMoveToHandover,
}: RekberTabViewProps) {
  const totalAmount = price + platformFee + adminFee;

  // 5-Minute Countdown Timer for Payment (only active if PENDING_PAYMENT)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minutes = 300s
  const isPaid =
    transactionStatus !== "PENDING_PAYMENT" && transactionStatus !== "CANCELLED";

  const isCompleted = transactionStatus === "COMPLETED";

  const [isDisbursed, setIsDisbursed] = useState(isCompleted);

  useEffect(() => {
    if (isPaid || transactionStatus === "CANCELLED") return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaid, transactionStatus]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSummonAdmin = () => {
    toast.success("Admin Rekber telah dipanggil ke room chat!");
  };

  const handleDisburseFunds = () => {
    setIsDisbursed(true);
    toast.success(`Dana ${formatCurrency(price)} berhasil dicairkan ke saldo/rekening Penjual!`);
  };

  return (
    <div className="space-y-4">
      {/* ⏱️ Timer 5 Menit Pembayaran (Hanya aktif saat belum bayar di Tab 2) */}
      {!isPaid && transactionStatus === "PENDING_PAYMENT" && (
        <div className="bg-blue-900 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg border border-blue-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-blue-300 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Batas Waktu Pembayaran QRIS
              </span>
              <h4 className="font-bold text-base sm:text-lg">
                Selesaikan Pembayaran dalam 5 Menit
              </h4>
            </div>
          </div>
          <div className="bg-slate-950/70 border border-blue-500/40 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Sisa Waktu</span>
            <span className="text-xl font-mono font-extrabold text-amber-300">
              {formatTimer(timeLeftSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* 🛡️ Status Escrow Banner (Jika sudah bayar & terverifikasi) */}
      {isPaid && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base">Dana Aman di Escrow Rekberin</h4>
              <p className="text-xs text-emerald-800">
                Admin <strong>{adminName}</strong> telah memverifikasi pembayaran. Silakan lanjut ke <strong>Tahap 3 (Amankan Akun)</strong> untuk serah terima akun.
              </p>
            </div>
          </div>
          {onMoveToHandover && (
            <button
              type="button"
              onClick={onMoveToHandover}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              Lanjut ke Tahap 3: Amankan Akun <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 📊 Card: Detail Transaksi & Rincian Tagihan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              ESC
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Detail Transaksi & Escrow</h3>
              <p className="text-xs text-slate-500">
                Diawasi oleh internal admin: <strong>{adminName}</strong> ({adminRole})
              </p>
            </div>
          </div>

          {/* Tombol Panggil Admin / Dispute */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSummonAdmin}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" /> Panggil Admin
            </button>
            {onOpenDispute && (
              <button
                type="button"
                onClick={onOpenDispute}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Dispute
              </button>
            )}
          </div>
        </div>

        {/* Breakdown Harga Lengkap */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Harga Kesepakatan (Deal):</span>
            <span className="font-bold text-slate-900 text-sm sm:text-base">{formatCurrency(price)}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Biaya Platform Rekberin:</span>
            <span className="font-bold text-slate-700 text-sm sm:text-base">{formatCurrency(platformFee)}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Biaya Jasa Admin:</span>
            <span className="font-bold text-slate-700 text-sm sm:text-base">{formatCurrency(adminFee)}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Total Tagihan Pembeli:</span>
            <span className="font-extrabold text-blue-700 text-sm sm:text-base">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Simulasi Aksi Admin Verifikasi */}
        {role === "ADMIN" && transactionStatus === "PENDING_PAYMENT" && onVerifyPayment && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <span className="text-xs text-amber-900 font-medium">
              Mode Admin: Verifikasi mutasi dana masuk ke rekening penampungan.
            </span>
            <button
              type="button"
              onClick={onVerifyPayment}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Konfirmasi Dana Masuk (Escrow)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

