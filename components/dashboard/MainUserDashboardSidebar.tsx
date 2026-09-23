"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Receipt,
  Package,
  PlusCircle,
  ShieldCheck,
  Store,
  User,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import type { LucideIcon } from "lucide-react";

interface SidebarSessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  role?: "USER" | "ADMIN" | "SUPER_ADMIN";
  isVerified?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isHighlight?: boolean;
}

const roleConfig = {
  buyer: {
    title: "Akun Saya",
    color: "blue",
    items: [
      { href: "/user", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/listings", label: "Katalog Akun Game", icon: ShoppingBag },
      { href: "/listings/new", label: "Pasang Iklan Baru", icon: PlusCircle, isHighlight: true },
    ] as NavItem[],
  },
  seller: {
    title: "Toko Penjual",
    color: "emerald",
    items: [
      { href: "/user?tab=seller", label: "Overview", icon: LayoutDashboard },
      { href: "/user/transactions", label: "Transaksi Penjualan", icon: Receipt },
      { href: "/user?tab=seller", label: "Kelola Listing", icon: Package },
      { href: "/listings/new", label: "Pasang Iklan Baru", icon: PlusCircle, isHighlight: true },
    ] as NavItem[],
  },
  admin: {
    title: "Admin Rekber",
    color: "amber",
    items: [
      { href: "/admin", label: "Overview & Pool", icon: LayoutDashboard },
      { href: "/admin/transactions", label: "Antrean Transaksi", icon: ShieldCheck },
    ] as NavItem[],
  },
  // role "user" = satu akun USER dengan dua konteks (beli & jual) — Section 17.1
  user: {
    title: "Akun Saya",
    color: "blue",
    items: [
      { href: "/user", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/listings", label: "Katalog Akun Game", icon: ShoppingBag },
      { href: "/listings/new", label: "Pasang Iklan Baru", icon: PlusCircle, isHighlight: true },
    ] as NavItem[],
  },
};

export function DashboardSidebar({ role }: { role: "buyer" | "seller" | "admin" | "user" }) {
  const pathname = usePathname();
  const currentRole = roleConfig[role];
  const { data: session, status } = useSession();
  const sessionUser = session?.user as SidebarSessionUser | undefined;
  const displayName = sessionUser?.name?.trim() || "Pengguna Rekberin";
  const displayTag = sessionUser?.username
    ? `@${sessionUser.username}`
    : sessionUser?.email || "Profil akun";
  const badgeLabel = sessionUser?.isVerified
    ? "Akun terverifikasi"
    : sessionUser?.role === "ADMIN" || sessionUser?.role === "SUPER_ADMIN"
      ? "Admin Rekber"
      : "Akun pengguna";
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      {/* Back to Home & Notification Bar */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex-1 group"
        >
          <ArrowLeft size={14} className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-600 transition-colors"
          title="Informasi Profil"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Role Switcher Pills */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
          Ganti Mode Role:
        </p>
        <div className="grid grid-cols-2 gap-1">
          <Link
            href="/user"
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all",
              role === "user" || role === "buyer" || role === "seller"
                ? "bg-white text-blue-600 shadow-xs border border-blue-200/60"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            )}
          >
            <User size={14} className="mb-0.5" />
            <span>Akun Saya</span>
          </Link>

          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all",
              role === "admin"
                ? "bg-white text-amber-600 shadow-xs border border-amber-200/60"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            )}
          >
            <ShieldCheck size={14} className="mb-0.5" />
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* Profil akun dari sesi yang disinkronkan dengan database */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
        {status === "loading" ? (
          <div className="flex items-center gap-3" aria-label="Memuat profil">
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {sessionUser?.image ? (
                <Image
                  src={sessionUser.image}
                  alt={`Foto profil ${displayName}`}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Avatar name={displayName} size={44} />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{displayName}</h4>
                <p className="text-xs text-slate-400 truncate">{displayTag}</p>
              </div>
            </div>
            {sessionUser && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700">
                  <Sparkles size={10} aria-hidden="true" />
                  {badgeLabel}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Role Navigation Menu */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1.5">
          Menu {currentRole.title}
        </p>
        <nav className="flex flex-col gap-1">
          {currentRole.items.map((item) => {
            const active =
              pathname === item.href ||
              (!["/admin", "/user"].includes(item.href) &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                  active
                    ? role === "seller"
                      ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 shadow-xs"
                      : role === "admin"
                      ? "bg-amber-50 text-amber-800 font-bold border border-amber-200/80 shadow-xs"
                      : "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                    : item.isHighlight
                    ? "bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/70 border border-dashed border-emerald-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <item.icon
                  size={16}
                  className={cn(
                    active
                      ? role === "seller"
                        ? "text-emerald-600"
                        : role === "admin"
                        ? "text-amber-600"
                        : "text-blue-600"
                      : "text-slate-400"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.isHighlight && (
                  <span className="text-[9px] uppercase font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                    Baru
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Escrow Guarantee Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Proteksi Rekberin Escrow</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Dana & data akun tersimpan aman di penampungan rekber hingga serah terima tuntas 100%.
        </p>
      </div>

      {/* Informasi profil dari sesi database */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Tutup informasi profil"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Settings size={20} />
              </div>
              <div>
                <h3 id="profile-dialog-title" className="font-bold text-slate-900 text-base">Informasi Profil</h3>
                <p className="text-xs text-slate-400">Data akun yang tersimpan di Rekberin.</p>
              </div>
            </div>

            {sessionUser ? (
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="font-bold text-slate-700">Nama Pemilik Akun</dt>
                  <dd className="mt-1 text-slate-600">{displayName}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-700">Username</dt>
                  <dd className="mt-1 text-slate-600">{sessionUser.username ? `@${sessionUser.username}` : "Belum tersedia"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-700">Email</dt>
                  <dd className="mt-1 text-slate-600">{sessionUser.email || "Belum tersedia"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-700">Status Akun</dt>
                  <dd className="mt-1 text-slate-600">{badgeLabel}</dd>
                </div>
              </dl>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Masuk untuk melihat profil
              </Link>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
