"use client";
import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, Menu, X, PlusCircle, ChevronRight, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/listings", label: "Cari Akun" },
  { href: "/rekber", label: "Admin Rekber" },
  { href: "/tentang-kami", label: "Tentang Kami" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [dashboardDropdown, setDashboardDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand Logo - Glints inspired clean style */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <ShieldCheck size={22} className="stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 leading-none">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Rekber<span className="text-blue-600">in</span>
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                ESCROW
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5">
              Marketplace Akun Game
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-blue-600 transition-colors py-1 font-medium"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Quick link to Transactions & Live Chat */}
          <Link href="/user/transactions">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all cursor-pointer">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <MessageSquare size={13} className="text-blue-600" />
              <span>Transaksi & Chat</span>
            </button>
          </Link>

          {/* Quick Dashboard Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setDashboardDropdown(!dashboardDropdown)}
              onBlur={() => setTimeout(() => setDashboardDropdown(false), 200)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LayoutDashboard size={14} className="text-slate-500" />
              <span>Dashboard</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {dashboardDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Tampilan:
                </div>
                <Link
                  href="/user"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-medium"
                >
                  <User size={13} className="text-blue-500" /> Dashboard User
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-amber-600 font-medium"
                >
                  <ShieldCheck size={13} className="text-amber-500" /> Dashboard Admin
                </Link>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <Link href="/listings/new">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs text-slate-700 hover:text-blue-600 border-slate-300"
            >
              <PlusCircle size={15} className="text-blue-600" />
              Pasang Iklan
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 flex flex-col gap-3 shadow-lg">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                <span>{l.label}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Pilih Role Dashboard:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/user"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold"
              >
                <User size={13} /> Dashboard User
              </Link>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold"
              >
                <ShieldCheck size={13} /> Dashboard Admin
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/listings/new" onClick={() => setOpen(false)}>
              <Button
                variant="outline"
                size="md"
                className="w-full gap-2 justify-center border-blue-600 text-blue-600 bg-blue-50/50"
              >
                <PlusCircle size={16} /> Pasang Iklan Akun
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="secondary" size="md" className="w-full">
                  Masuk
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button variant="primary" size="md" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Daftar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
