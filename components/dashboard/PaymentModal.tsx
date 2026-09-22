"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Clock, QrCode, ShieldCheck, X } from "lucide-react";
import type { PaymentApiResponse } from "@/types/payment-api";
import { formatRupiah } from "@/lib/utils";

export function PaymentModal({ isOpen, onClose, payment, listingTitle, isSyncing, onSync }: { isOpen: boolean; onClose: () => void; payment: PaymentApiResponse; listingTitle: string; isSyncing: boolean; onSync: () => Promise<unknown> }) {
  const [remaining, setRemaining] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const update = () => setRemaining(payment.expiresAt ? Math.max(0, Math.floor((Date.parse(payment.expiresAt) - Date.now()) / 1000)) : 0);
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, payment.expiresAt]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const statusLabel = {
    PENDING: "Menunggu pembayaran",
    SETTLEMENT: "Berhasil",
    EXPIRE: "Kedaluwarsa",
    DENY: "Ditolak",
    CANCEL: "Dibatalkan",
    FAILURE: "Gagal",
  }[payment.status];

  const copyQrUrl = async () => {
    if (!payment.qrCodeUrl) return;
    try {
      await navigator.clipboard.writeText(payment.qrCodeUrl);
      setCopyStatus("URL QR berhasil disalin. Tempel URL ini di Midtrans QRIS Simulator.");
    } catch {
      setCopyStatus("URL QR belum dapat disalin. Salin dari alamat gambar secara manual.");
    }
  };

  return <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 p-4" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-describedby="payment-description">
        <div className="flex items-center justify-between bg-slate-900 p-5 text-white">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">QRIS Sandbox</p><Dialog.Title className="font-bold">Bayar transaksi</Dialog.Title></div>
          <Dialog.Close asChild><button type="button" aria-label="Tutup" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"><X size={18} /></button></Dialog.Close>
        </div>
        <div className="space-y-4 p-5">
          <Dialog.Description id="payment-description" className="sr-only">QRIS pembayaran Sandbox untuk transaksi {listingTitle}.</Dialog.Description>
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950" role="note">
            <p className="font-bold">Ini hanya Sandbox Midtrans.</p>
            <p className="mt-1">Jangan scan atau bayar QR ini dengan aplikasi QRIS, mobile banking, atau bank sungguhan. Gunakan <a href="https://simulator.sandbox.midtrans.com/openapi/qris/index" target="_blank" rel="noreferrer" className="font-bold underline decoration-2 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700">Midtrans QRIS Simulator</a>.</p>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="flex items-center gap-1"><Clock size={14} /> Berlaku sampai expiry server</span><strong className="font-mono">{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center"><p className="mb-3 text-sm font-semibold text-slate-900">{listingTitle}</p>{payment.qrCodeUrl ? <Image src={payment.qrCodeUrl} alt="QRIS Sandbox pembayaran" width={256} height={256} className="mx-auto h-64 w-64 rounded-lg bg-white object-contain p-2" priority unoptimized /> : <div className="flex h-64 items-center justify-center text-sm text-slate-500"><QrCode size={32} /></div>}<p className="mt-3 text-xs text-slate-600">Gunakan URL gambar ini di simulator Sandbox; jangan scan dengan aplikasi pembayaran sungguhan.</p>{payment.qrCodeUrl && <button type="button" onClick={() => void copyQrUrl()} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Salin URL gambar QR</button>}</div>
          <p className="min-h-5 text-center text-xs text-blue-700" aria-live="polite" role="status">{copyStatus}</p>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">Total pembayaran</span><strong className="text-lg text-blue-600">{formatRupiah(payment.amount)}</strong></div>
          <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-sm"><span className="text-slate-600">Status pembayaran</span><strong className="text-slate-900">{statusLabel}</strong></div>
          <p className="text-center text-[11px] text-slate-500">Status pembayaran diperbarui otomatis setiap 10 detik.</p>
          <button type="button" onClick={() => void onSync()} disabled={isSyncing} aria-busy={isSyncing} className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60">{isSyncing ? "Memeriksa status..." : "Perbarui status"}</button>
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800"><ShieldCheck size={15} className="mt-0.5 shrink-0" />Status tetap diproses oleh Midtrans meskipun halaman ini ditutup.</div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
