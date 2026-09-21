"use client";

import { useState, useEffect } from "react";
import { KeyRound, ShieldAlert, Lock, Eye, EyeOff, Send, CheckCircle2, Clock, Smartphone, AlertTriangle, ShieldCheck, ArrowRight, Wallet, HelpCircle, ListOrdered } from "lucide-react";
import type { ChatSenderRole, TransactionStatus, OtpLogEntry, AccountCredentials } from "@/types";
import { toast } from "sonner";

interface AmankanAkunTabViewProps {
  transactionId: string;
  role: ChatSenderRole;
  transactionStatus: TransactionStatus;
  initialCredentials?: AccountCredentials | null;
  onConfirmReceipt?: () => void;
  onProceedToDisbursement?: () => void;
}

export function AmankanAkunTabView({
  transactionId,
  role,
  transactionStatus,
  initialCredentials,
  onConfirmReceipt,
  onProceedToDisbursement,
}: AmankanAkunTabViewProps) {
  const [credentials, setCredentials] = useState<AccountCredentials | null>(
    initialCredentials || {
      loginMethod: "Konami ID",
      accountEmail: "efootball_seller@game.com",
      accountPassword: "SuperSecurePass123!",
      backupCodes: "183920, 482910",
      notes: "Akun login Konami ID. Mohon langsung ganti email ke akun pribadi pembeli.",
      submittedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    }
  );

  const [showPassword, setShowPassword] = useState(false);
  const [isAccountConfirmed, setIsAccountConfirmed] = useState(
    transactionStatus === "COMPLETED" || transactionStatus === "PENDING_BUYER_CONFIRM"
  );

  const [otpLogs, setOtpLogs] = useState<OtpLogEntry[]>([
    {
      id: "otp_1",
      transactionId,
      action: "REQUEST",
      actorRole: "BUYER",
      actorName: "Pembeli",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString("id-ID"),
    },
    {
      id: "otp_2",
      transactionId,
      action: "SUBMIT",
      actorRole: "SELLER",
      actorName: "Penjual",
      codeMasked: "938***",
      timestamp: new Date(Date.now() - 1000 * 60 * 6).toLocaleTimeString("id-ID"),
    },
  ]);

  const [inputOtp, setInputOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // 2-Hour Auto Release Countdown Timer
  const [autoReleaseSeconds, setAutoReleaseSeconds] = useState(7200); // 2 hours = 7200s
  const isCompleted = transactionStatus === "COMPLETED";

  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setAutoReleaseSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const formatAutoRelease = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}j ${mins}m ${secs}d`;
  };

  const handleRequestOtp = () => {
    const newLog: OtpLogEntry = {
      id: `otp_${Date.now()}`,
      transactionId,
      action: "REQUEST",
      actorRole: "BUYER",
      actorName: "Pembeli",
      timestamp: new Date().toLocaleTimeString("id-ID"),
    };
    setOtpLogs((prev) => [...prev, newLog]);
    toast.success("Permintaan kode OTP berhasil dikirim ke Penjual!");
  };

  const handleSubmitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOtp || inputOtp.length < 4) {
      toast.error("Masukkan minimal 4-6 digit kode OTP");
      return;
    }

    setIsSendingOtp(true);
    setTimeout(() => {
      const masked = inputOtp.slice(0, 3) + "***";
      const newLog: OtpLogEntry = {
        id: `otp_${Date.now()}`,
        transactionId,
        action: "SUBMIT",
        actorRole: "SELLER",
        actorName: "Penjual",
        codeMasked: masked,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      };
      setOtpLogs((prev) => [...prev, newLog]);
      setInputOtp("");
      setIsSendingOtp(false);
      toast.success("Kode OTP berhasil dikirim ke Pembeli!");
    }, 300);
  };

  const handleConfirm = () => {
    setIsAccountConfirmed(true);
    onConfirmReceipt?.();
    toast.success("Akun berhasil dikonfirmasi! Silakan lanjut ke Tahap 4 untuk pencairan dana.");
  };

  const isAdmin = role === "ADMIN";

  return (
    <div className="space-y-4">
      {/* 🧭 Panduan Alur Serah Terima & Pencairan Dana */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
          Petunjuk Serah Terima Kredensial Akun
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-blue-600 block mb-0.5">1. Cek & Amankan Akun</span>
            <p className="text-[11px] text-slate-600">
              Gunakan data login di bawah & koordinasi kode OTP 2FA untuk ubah email/password ke data Anda.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-blue-600 block mb-0.5">2. Konfirmasi Penerimaan</span>
            <p className="text-[11px] text-slate-600">
              Setelah akun berhasil diamankan pembeli, klik tombol <strong>Konfirmasi Terima Akun</strong>.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950">
            <span className="font-bold text-emerald-700 block mb-0.5">3. Lanjut ke Tahap 4</span>
            <p className="text-[11px] text-emerald-800">
              Masuk ke <strong>Tahap 4 (Pencairan Dana)</strong> bersama Admin Rekber untuk penutupan transaksi.
            </p>
          </div>
        </div>
      </div>

      {/* 🛡️ Banner Privasi Kredensial */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-sm flex items-center gap-2">
              Ruang Serah Terima & Amankan Akun (Privat 2 Arah)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kredensial dan kode OTP hanya dapat dilihat oleh Pembeli dan Penjual. 
              {isAdmin ? (
                <span className="text-amber-400 font-semibold block mt-1">
                  🔒 Mode Admin: Demi privasi dan keamanan pengguna, Admin Rekber tidak memiliki akses melihat password akun game.
                </span>
              ) : (
                " Admin Rekber tidak memiliki akses melihat password game untuk menjaga privasi akun Anda."
              )}
            </p>
          </div>
        </div>
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
      {!isAccountConfirmed && !isCompleted && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-amber-950">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Auto-Release:</strong> Dana otomatis cair ke Penjual dalam{" "}
              <span className="font-bold text-amber-900 font-mono bg-amber-100 px-1.5 py-0.5 rounded-md">
                {formatAutoRelease(autoReleaseSeconds)}
              </span>{" "}
              jika tidak ada dispute.
            </span>
          </div>
          {role === "BUYER" && onConfirmReceipt && (
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Konfirmasi Terima Akun
            </button>
          )}
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
              {credentials?.loginMethod || "Konami ID"}
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
                Koordinasi Kode OTP (2FA)
              </h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Live Logger
              </span>
            </div>

            {/* Riwayat Log OTP */}
            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {otpLogs.map((log) => (
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

          {/* Form / Tombol Aksi OTP */}
          <div className="pt-3.5 border-t border-slate-100 mt-3.5">
            {role === "BUYER" ? (
              <button
                type="button"
                onClick={handleRequestOtp}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" /> Minta Kode OTP Baru ke Penjual
              </button>
            ) : role === "SELLER" ? (
              <form onSubmit={handleSubmitOtp} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Input Kode OTP (6 digit)"
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSendingOtp || !inputOtp}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-400 text-center">
                Admin mode: Logger pemantauan aktivitas serah terima.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

