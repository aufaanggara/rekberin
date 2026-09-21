import Link from "next/link";
import { ShieldCheck, Lock, ExternalLink, Mail, Phone, Heart } from "lucide-react";

export function Footer() {
  const paymentMethods = ["BCA", "Mandiri", "BNI", "BRI", "GoPay", "OVO", "DANA", "QRIS"];

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <span className="font-bold text-lg text-slate-900">
                Rekber<span className="text-blue-600">in</span>
              </span>
            </div>

            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Platform marketplace & direktori escrow terpercaya untuk jual-beli akun game (eFootball, Mobile Legends, FC Mobile) di Indonesia. Aman, tercatat, dan anti-ripper.
            </p>

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Dukungan Pembayaran:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom 1: Untuk Pembeli */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3.5">
              Untuk Pembeli
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/listings" className="hover:text-blue-600 transition-colors">
                  List Akun Game
                </Link>
              </li>
              <li>
                <Link href="/#cara-kerja" className="hover:text-blue-600 transition-colors">
                  Panduan Transaksi Aman
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 2: Untuk Penjual & Admin */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3.5">
              Untuk Penjual & Admin
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/listings/new" className="hover:text-blue-600 transition-colors">
                  Post Akun Game
                </Link>
              </li>
              <li>
                <Link href="/kebijakan" className="hover:text-blue-600 transition-colors">
                  Aturan Komunitas
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Bantuan & Hubungi */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3.5">
              Bantuan & Layanan
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/faq" className="hover:text-blue-600 transition-colors">
                  Pusat Bantuan / FAQ
                </Link>
              </li>
              <li>
                <Link href="/lapor" className="hover:text-blue-600 transition-colors text-red-600 font-medium">
                  Lapor Ripper / Penipuan
                </Link>
              </li>
              <li>
                <a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                  WhatsApp Support
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <Link href="/status" className="hover:text-blue-600 transition-colors">
                  Status Sistem
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Escrow Aktif & Terlindungi
            </span>
          </div>
          <p>© {new Date().getFullYear()} Rekberin Inc. All rights reserved. Dibuat untuk komunitas game Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}
