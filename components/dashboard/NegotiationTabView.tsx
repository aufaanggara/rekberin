"use client";

import { ShieldAlert, Tag, Check, X, ArrowRight, Lock, AlertTriangle, User, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PriceOffer } from "@/types";

interface NegotiationTabViewProps {
  originalPrice: number;
  buyerName: string;
  sellerName: string;
  initialOffer?: PriceOffer | null;
  isLocked?: boolean;
  onProceedToCheckout?: (dealPrice: number) => void;
}

export function NegotiationTabView({
  originalPrice,
  buyerName,
  sellerName,
  initialOffer,
  isLocked = false,
  onProceedToCheckout,
}: NegotiationTabViewProps) {
  const offer = initialOffer ?? null;

  return (
    <div className="space-y-4">
      {/* 🔒 Locked Alert if Negotiation is finalized */}
      {isLocked && (
        <div className="bg-slate-900 text-white border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-100">
                Tahap Negosiasi Telah Selesai & Terkunci
              </h4>
              <p className="text-[11px] text-slate-300">
                Harga kesepakatan telah disetujui (Deal {formatCurrency(offer?.offeredPrice || originalPrice)}). Silakan lanjutkan di Tab Rekber & Amankan Akun.
              </p>
            </div>
          </div>
          {onProceedToCheckout && (
            <button
              type="button"
              onClick={() => onProceedToCheckout(offer?.offeredPrice || originalPrice)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
            >
              Buka Tab 2 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 🏷️ 1. Penawaran Harga Akun */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tahap 1: Deal Harga
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600" />
              Penawaran Harga Akun
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Harga Awal Katalog:</span>
            <div className="text-xs sm:text-sm font-bold text-slate-600 line-through">
              {formatCurrency(originalPrice)}
            </div>
          </div>
        </div>

        {/* Card Status Tawaran Saat Ini */}
        {offer && (
          <div className="mt-3.5 p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block">Tawaran Diajukan Oleh:</span>
                <p className="font-bold text-slate-800 text-xs sm:text-sm">{offer.buyerName}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Nominal Penawaran:</span>
                <p className="text-sm sm:text-lg font-extrabold text-emerald-600">
                  {formatCurrency(offer.offeredPrice)}
                </p>
              </div>
            </div>

            {offer.notes && (
              <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/70">
                &ldquo;{offer.notes}&rdquo;
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Status:</span>
                {offer.status === "ACCEPTED" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="w-3.5 h-3.5" /> Disetujui Penjual (Deal)
                  </span>
                ) : offer.status === "REJECTED" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                    <X className="w-3.5 h-3.5" /> Ditolak
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> Menunggu ACC Penjual
                  </span>
                )}
              </div>

              {/* Aksi Pembeli setelah deal */}
              {offer.status === "ACCEPTED" && (
                <div className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onProceedToCheckout?.(offer.offeredPrice)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Lanjut ke Tab Rekber & Bayar <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {!offer && (
          <p className="mt-3.5 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
            Belum ada data penawaran yang tersimpan untuk transaksi ini.
          </p>
        )}
      </div>

      {/* 👥 2. Pihak Terlibat & Panduan Transaksi (Diatas Peringatan Keamanan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Pihak Terlibat */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Pihak Terlibat Negosiasi
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Pembeli:</span>
                <span className="font-bold text-slate-800">{buyerName}</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">Buyer</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Penjual:</span>
                <span className="font-bold text-slate-800">{sellerName}</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">Seller</span>
            </div>
          </div>
        </div>

        {/* Panduan Transaksi Negosiasi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Panduan Negosiasi
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed list-disc pl-4">
            <li>Gunakan kolom chat di samping untuk menanyakan detail akun dan spek skuad.</li>
            <li>Setelah sepakat, pembeli memasukkan nominal deal pada kolom penawaran.</li>
            <li>Penjual mengklik tombol <strong>ACC / Terima Harga</strong>.</li>
            <li>Pembeli klik <strong>Lanjut ke Tab Rekber & Bayar</strong> untuk memilih admin.</li>
          </ul>
        </div>
      </div>

      {/* ⚠️ 3. Peringatan Keamanan & Anti-Bypass Rekber (Paling Bawah) */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-4.5 flex items-start gap-3 shadow-xs">
        <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="space-y-1 text-xs sm:text-sm">
          <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
            Peringatan Keamanan & Anti-Bypass Rekber
          </h4>
          <p className="text-amber-900 leading-relaxed text-[11px] sm:text-xs">
            Dilarang keras melakukan transfer langsung ke rekening penjual tanpa melalui sistem Rekberin.
            Segala transaksi di luar sistem <strong>TIDAK DILINDUNGI GARANSI</strong> dan akun rentan terkena
            penipuan (*hackback*). Seluruh proses bayar hanya dilakukan di Tab Rekber.
          </p>
        </div>
      </div>
    </div>
  );
}

