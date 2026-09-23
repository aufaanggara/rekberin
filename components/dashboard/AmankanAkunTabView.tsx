"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, Clock, Smartphone, ShieldCheck, ArrowRight, Wallet, ListOrdered, AlertTriangle } from "lucide-react";
import type { ChatSenderRole, TransactionStatus, OtpLogEntry, AccountCredentials } from "@/types";

interface AmankanAkunTabViewProps {
  role: ChatSenderRole;
  transactionStatus: TransactionStatus;
  initialCredentials?: AccountCredentials | null;
  initialOtpLogs?: OtpLogEntry[];
  autoReleaseAt?: string | null;
  onConfirmReceipt?: () => void | Promise<void>;
  onOpenDispute?: () => void;
  onProceedToDisbursement?: () => void;
}

export function AmankanAkunTabView({
  role,
  transactionStatus,
  initialCredentials,
  initialOtpLogs,
  autoReleaseAt,
  onConfirmReceipt,
  onOpenDispute,
  onProceedToDisbursement,
}: AmankanAkunTabViewProps) {
  const credentials = initialCredentials ?? null;
  const otpLogs = initialOtpLogs ?? [];
  const isAdmin = role === "ADMIN";

  const [showPassword, setShowPassword] = useState(false);
  const isAccountConfirmed = transactionStatus === "COMPLETED";

  const handoverStatus = {
    PENDING_PAYMENT: {
      label: "Menunggu pembayaran",
      description: "Handover akan tersedia setelah pembayaran transaksi dikonfirmasi.",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    PAYMENT_CONFIRMED: {
      label: "Siap dimulai admin",
      description: "Pembayaran sudah dikonfirmasi. Admin perlu memulai proses handover.",
      classes: "border-blue-200 bg-blue-50 text-blue-950",
    },
    IN_HANDOVER: {
      label: "Handover sedang berlangsung",
      description: "Buyer dan seller dapat melihat proses serah terima akun pada transaksi ini.",
      classes: "border-blue-200 bg-blue-50 text-blue-950",
    },
    PENDING_BUYER_CONFIRM: {
      label: "Menunggu konfirmasi buyer",
      description: "Buyer perlu mengonfirmasi bahwa akun telah diterima.",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    COMPLETED: {
      label: "Handover selesai",
      description: "Buyer telah mengonfirmasi penerimaan akun dan transaksi selesai.",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    DISPUTED: {
      label: "Handover dihentikan",
      description: "Transaksi sedang berada dalam status sengketa.",
      classes: "border-red-200 bg-red-50 text-red-950",
    },
    CANCELLED: {
      label: "Handover tidak tersedia",
      description: "Transaksi telah dibatalkan.",
      classes: "border-slate-200 bg-slate-50 text-slate-950",
    },
  }[transactionStatus];

  const releaseAtMs = autoReleaseAt
    ? Date.parse(autoReleaseAt) + 2 * 60 * 60 * 1000
    : null;
  const [autoReleaseSeconds, setAutoReleaseSeconds] = useState<number | null>(null);
  const isCompleted = transactionStatus === "COMPLETED";

  useEffect(() => {
    if (isCompleted || releaseAtMs === null || !Number.isFinite(releaseAtMs)) {
      setAutoReleaseSeconds(null);
      return;
    }

    const updateRemaining = () => {
      setAutoReleaseSeconds(Math.max(0, Math.floor((releaseAtMs - Date.now()) / 1000)));
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, releaseAtMs]);

  const formatAutoRelease = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}j ${mins}m ${secs}d`;
  };

  const handleConfirm = async () => {
    try {
      await onConfirmReceipt?.();
    } catch {
      // The parent callback owns the error toast and transaction state.
    }
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${handoverStatus.classes}`} role="status">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">Status handover: {handoverStatus.label}</p>
            <p className="mt-1 text-xs leading-relaxed">{handoverStatus.description}</p>
          </div>
        </div>
      </div>
      {/* 🧭 Panduan Alur Serah Terima & Pencairan Dana */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
          <ListOrdered className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          Instruksi Serah Terima Akun
        </h4>
        <p className="text-xs leading-relaxed text-slate-600">
          Segera login menggunakan data di bawah. Jika berhasil, lakukan konfirmasi dan lanjut ke tahap 4.
        </p>
      </div>

      {/* 🚀 Handshake Box: Konfirmasi Selesai & Arahan Lanjut ke Tahap 4 */}
      {isAccountConfirmed && (
        <div className="bg-emerald-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-400/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">Akun Game Berhasil Diamankan!</h4>
              <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed">
                Tahap serah terima akun selesai. Silakan lanjut ke <strong>Tahap 4 (Pencairan Dana)</strong> bersama Admin Rekber untuk pencairan dana ke Penjual.
              </p>
            </div>
          </div>
          {onProceedToDisbursement && (
            <button
              type="button"
              onClick={onProceedToDisbursement}
              className="px-4 py-2 bg-white text-emerald-800 font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md hover:bg-emerald-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Wallet className="w-4 h-4" /> Lanjut ke Tahap 4: Pencairan Dana <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 2-Hour Auto Release Warning Banner */}
      {role === "BUYER" && !isAccountConfirmed && ["IN_HANDOVER", "PENDING_BUYER_CONFIRM"].includes(transactionStatus) && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 text-sm">
          <div className="flex items-start gap-2 text-amber-950">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="leading-relaxed">
              Lakukan dispute
              {autoReleaseSeconds !== null && (
                <>
                  {" "}sebelum{" "}
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono font-bold text-amber-900">
                    {formatAutoRelease(autoReleaseSeconds)}
                  </span>
                </>
              )}{" "}
              jika tidak bisa membuka akun.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {onConfirmReceipt && ["IN_HANDOVER", "PENDING_BUYER_CONFIRM"].includes(transactionStatus) && (
              <button
                type="button"
                onClick={() => void handleConfirm()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Konfirmasi Akun Diterima
              </button>
            )}
            {onOpenDispute && (
              <button
                type="button"
                onClick={onOpenDispute}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                Dispute
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid: Kredensial Akun & Panel OTP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel Kredensial */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Data Login Akun Game
            </h3>
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
              {credentials?.loginMethod || "Belum tersedia"}
            </span>
          </div>

          {credentials ? (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Email Login / ID:</label>
                <div className="font-mono bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold text-slate-800 break-all">
                  {credentials.accountEmail}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Password Akun:</label>
                <div className="relative font-mono bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold text-slate-800 flex items-center justify-between">
                  <span>
                    {isAdmin
                      ? "•••••••• (Dirahasiakan)"
                      : showPassword
                      ? credentials.accountPassword
                      : "••••••••••••"}
                  </span>
                  {!isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {credentials.backupCodes && (
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Kode Cadangan 2FA:</label>
                  <div className="font-mono text-xs bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-700">
                    {credentials.backupCodes}
                  </div>
                </div>
              )}

              {credentials.notes && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
                  <strong>Instruksi Penjual:</strong> {credentials.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              Penjual belum mengirimkan data akun.
            </div>
          )}
        </div>

        {/* Panel Koordinasi OTP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Kode OTP/2FA
              </h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Live Logger
              </span>
            </div>

            {/* Riwayat Log OTP */}
            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {otpLogs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  Belum ada riwayat kode OTP/2FA untuk transaksi ini.
                </p>
              ) : otpLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                    log.action === "REQUEST"
                      ? "bg-amber-50/80 border-amber-200/60 text-amber-950"
                      : "bg-emerald-50/80 border-emerald-200/60 text-emerald-950 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.action === "REQUEST" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    <span>
                      {log.action === "REQUEST" ? (
                        <>Pembeli meminta kode OTP</>
                      ) : (
                        <>
                          Penjual mengirim OTP:{" "}
                          <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800">
                            {log.codeMasked || "******"}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 mt-3.5">
            <p className="text-xs text-slate-500 text-center">
              Koordinasi kode OTP/2FA belum tersedia untuk transaksi ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

