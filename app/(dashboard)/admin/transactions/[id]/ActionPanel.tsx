"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Clock, Loader2, ShieldCheck } from "lucide-react";
import type { TransactionStatus } from "@/types";

export function ActionPanel({
  transactionId,
  status,
  onStatusChange,
}: {
  transactionId: string;
  status: TransactionStatus;
  onStatusChange?: (status: TransactionStatus) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startHandover() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START" }),
      });
      const payload = (await response.json()) as { handover?: { transactionStatus?: TransactionStatus }; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Handover belum dapat dimulai.");
      }

      const nextStatus = payload.handover?.transactionStatus;
      if (nextStatus) onStatusChange?.(nextStatus);
      toast.success("Proses handover berhasil dimulai.");
      setConfirming(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Handover belum dapat dimulai.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {status === "PAYMENT_CONFIRMED" && (
        <div className="space-y-1.5">
          <Button
            className="w-full"
            onClick={() => setConfirming(true)}
            disabled={isSubmitting}
          >
            Mulai Handover
          </Button>
          <p className="px-1 text-center text-[11px] leading-relaxed text-slate-500">
            Aktifkan proses serah terima akun setelah pembayaran terkonfirmasi.
          </p>
        </div>
      )}

      {status === "IN_HANDOVER" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <Clock size={15} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="text-xs font-bold text-blue-800">Handover sedang berlangsung</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-blue-600">
              Buyer dan seller dapat melihat status ini. Tunggu buyer mengonfirmasi akun telah diterima.
            </p>
          </div>
        </div>
      )}

      {status === "COMPLETED" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
          <p className="text-xs font-bold text-emerald-800">
            Handover selesai. Transaksi dan listing sudah ditutup.
          </p>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !isSubmitting && setConfirming(false)}
        >
          <div
            className="glass-card w-full max-w-sm rounded-2xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-2 font-semibold">Mulai proses handover?</h3>
            <p className="mb-5 text-sm text-txt-secondary">
              Status transaksi akan berubah menjadi <strong>Serah Terima</strong> dan dapat dilihat buyer serta seller.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirming(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button className="flex-1" onClick={() => void startHandover()} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-1.5 animate-spin" size={14} />}
                Ya, Mulai
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
