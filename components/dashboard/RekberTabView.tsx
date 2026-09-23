"use client";

import { ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TransactionStatus, ChatSenderRole } from "@/types";

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

  const isPaid =
    transactionStatus !== "PENDING_PAYMENT" && transactionStatus !== "CANCELLED";

  return (
    <div className="space-y-4">
      {!isPaid && transactionStatus === "PENDING_PAYMENT" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Status pembayaran: <strong>menunggu konfirmasi</strong>.
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

          {/* Tombol dispute */}
          <div className="flex items-center gap-2">
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

