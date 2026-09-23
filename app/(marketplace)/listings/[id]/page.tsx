"use client";

import { Star, ShieldCheck, Sparkles, Lock, Info, RefreshCw } from "lucide-react";
import Link from "next/link";
import { dummyReviews } from "@/data/dummy";
import { Avatar } from "@/components/ui/Avatar";
import { formatRupiah } from "@/lib/utils";
import { useListing } from "@/hooks/useListings";
import { BuyPanel } from "./BuyPanel";
import { ImageGallery } from "./ImageGallery";
import { ShareListingButton } from "@/components/marketplace/ShareListingButton";

import { DetailBackButton } from "@/components/marketplace/DetailBackButton";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const { data: listing, isLoading, error, refetch } = useListing(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-busy="true" aria-live="polite">
        <div className="h-5 w-64 rounded bg-slate-200 animate-pulse" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-[34rem] rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm" role="alert">
          <h1 className="text-lg font-bold text-slate-900">Listing tidak dapat dibuka</h1>
          <p className="mt-2 text-sm text-slate-500">{error ?? "Listing tidak ditemukan."}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <RefreshCw size={15} aria-hidden="true" /> Coba lagi
            </button>
            <Link
              href="/listings"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const listingStatusLabel =
    listing.status === "AVAILABLE"
      ? "Akun Ready"
      : listing.status === "IN_TRANSACTION"
        ? "Dalam Transaksi"
        : listing.status === "SOLD"
          ? "Terjual"
          : "Tidak Aktif";

  return (
    <div className="bg-slate-50 min-h-screen py-6 sm:py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-4 sm:mb-6">
          <DetailBackButton />
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 truncate max-w-xs">{listing.title}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Main Account Details Column */}
          <div className="space-y-6">
            {/* Account Screenshot Gallery */}
            <ImageGallery images={listing.images} title={listing.title} />

            {/* Header Showcase Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    eFootball Mobile / PC
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {listing.details.league} Division
                  </span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  listing.status === "AVAILABLE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${listing.status === "AVAILABLE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  {listingStatusLabel}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
                {listing.title}
              </h1>

              <p className="text-slate-600 text-xs sm:text-base leading-relaxed mb-6">
                {listing.description}
              </p>

              {/* 4 Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-5 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Rating OVR
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
                    {listing.details.overall}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Divisi Liga
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 mt-1 block truncate">
                    {listing.details.league}
                  </span>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-left">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                    Koin Aktif
                  </span>
                  <span className="text-base sm:text-lg font-bold text-amber-800 mt-1 block">
                    {listing.details.coins.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 text-left">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                    Total GP
                  </span>
                  <span className="text-base sm:text-lg font-bold text-blue-800 mt-1 block">
                    {listing.details.gp.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Featured Players & Assets */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" /> Daftar Pemain Kunci & Aset
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {listing.details.players.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold"
                  >
                    ⭐ {p}
                  </span>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 sm:p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <Info size={14} className="text-blue-600" /> Catatan Keamanan dari Penjual:
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {listing.details.notes || "Email aman, belum pernah terkena suspend, siap bantu ganti email hingga tuntas bersama admin rekber."}
                </p>
              </div>
            </div>

            {/* Prosedur Transaksi Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" /> Prosedur Transaksi Rekberin
              </h2>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <span className="font-bold text-xs text-blue-900">Ajukan Transaksi</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                    Setelah sepakat dengan penjual, klik <strong>Ajukan Transaksi</strong> dan pilih admin Rekber untuk membuat ruang transaksi.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <span className="font-bold text-xs text-amber-900">Bayar Rekber</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                    Selesaikan pembayaran melalui ruang transaksi. Dana ditahan di escrow sampai akun diterima.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <span className="font-bold text-xs text-emerald-900">Amankan Akun</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                    Terima data login akun & panduan pengamanan dari admin/penjual, lalu konfirmasi terima akun.
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" /> Ulasan Pembeli Sebelumnya
              </h2>

              <div className="space-y-4">
                {dummyReviews.map((r) => (
                  <div key={r.id} className="pb-4 border-b border-slate-100 last:border-none last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.giverName} size={28} />
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {r.giverName}
                        </span>
                      </div>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      {r.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sticky Buy Panel (DESKTOP) */}
          <div className="space-y-5 lg:sticky top-24">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              {/* Desktop Only: Harga Akun & Tombol Chat */}
              <div className="hidden lg:block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Harga Akun
                </span>
                <div className="text-3xl font-black text-blue-600 mb-4">
                  {formatRupiah(listing.price)}
                </div>

                {/* Action Button: Create a database-backed transaction */}
                <div className="mb-3">
                  <BuyPanel listingId={listing.id} listingStatus={listing.status} />
                </div>
              </div>

              {/* Seller Profile Summary */}
              <div className="lg:mt-6 lg:pt-5 lg:border-t lg:border-slate-100">
                <div className="flex items-center gap-3">
                  <Avatar name={listing.seller.username} size={40} />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-slate-900">{listing.seller.username}</span>
                      <ShieldCheck size={14} className="text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                        <Star size={12} fill="currentColor" /> {listing.seller.rating ?? "4.9"}
                      </span>
                      <span>•</span>
                      <span>{listing.seller.totalTransactions ?? 12} Terjual</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escrow Guarantee Box */}
              <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Lock size={13} className="text-emerald-600" />
                  Jaminan Transaksi Rekberin:
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-[11px] text-slate-500">
                  <li>Dana aman di escrow admin sampai akun diterima</li>
                  <li>Panduan ganti email & 2FA aman</li>
                  <li>Refund 100% jika data akun tidak sesuai</li>
                </ul>
              </div>

              {/* Share Listing Button */}
              <div className="mt-4">
                <ShareListingButton title={listing.title} price={listing.price} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING STICKY BUY ACTION BAR (HP ONLY) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Harga Akun</span>
          <span className="text-lg font-black text-blue-600 tracking-tight leading-normal">
            {formatRupiah(listing.price)}
          </span>
        </div>
        <div className="w-44 shrink-0">
          <BuyPanel listingId={listing.id} listingStatus={listing.status} compact />
        </div>
      </div>
    </div>
  );
}
