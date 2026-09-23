"use client";

import { X, Printer, ShieldCheck, CheckCircle2, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/utils";
import type { Transaction } from "@/types";
import type { TransactionViewModel } from "@/types/transaction-view-model";

interface InvoiceModalProps {
  transaction: Transaction | TransactionViewModel;
  onClose: () => void;
}

export function InvoiceModal({ transaction: t, onClose }: InvoiceModalProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(t.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalAmount = t.price + t.platformFee + t.adminFee;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Struk Transaksi Escrow Resmi</h3>
              <p className="text-[10px] text-slate-400">Rekberin Marketplace Garansi 100%</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Struk Body */}
        <div id="invoice-printable" className="p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Header Info */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                No. Transaksi Escrow
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900">
                  #{t.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-blue-600"
                  title="Salin No Transaksi"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Waktu: {new Date(t.createdAt).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <ShieldCheck size={13} />
                LUNAS & TERLINDUNGI
              </span>
            </div>
          </div>

          {/* Details Parties */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Pembeli (Buyer)
              </span>
              <p className="font-bold text-slate-900">{t.buyer.fullName || t.buyer.username}</p>
              <p className="text-slate-500 text-[11px]">@{t.buyer.username}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Penjual (Seller)
              </span>
              <p className="font-bold text-slate-900">
                {t.listing.seller.fullName || t.listing.seller.username}
              </p>
              <p className="text-slate-500 text-[11px]">@{t.listing.seller.username}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Admin Rekber Pendamping
              </span>
              <p className="font-bold text-blue-700">
                {t.admin.user.fullName} ({t.admin.user.username}) • Lisensi Resmi
              </p>
            </div>
          </div>

          {/* Item Description */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Rincian Akun Game
            </span>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  {t.listing.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {t.listing.game}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Garansi Anti-Hackback 48 Jam • Serah Terima Akun Dipantau Admin
              </p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Harga Akun Game</span>
              <span className="font-semibold text-slate-900">{formatRupiah(t.price)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Biaya Jasa Admin Rekber</span>
              <span className="font-semibold text-slate-900">{formatRupiah(t.adminFee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Biaya Sistem & Proteksi Escrow</span>
              <span className="font-semibold text-slate-900">{formatRupiah(t.platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 border-t border-dashed border-slate-200 pt-2 mt-2">
              <span>Total Pembayaran</span>
              <span className="text-blue-600">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          {/* Official Guarantee Seal */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-blue-900 block">Jaminan Keamanan Rekberin</span>
              <span className="text-blue-700/80">
                Struk ini merupakan bukti sah transaksi escrow. Simpan struk ini untuk keperluan klaim garansi akun.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            <Printer size={14} className="mr-1.5" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
