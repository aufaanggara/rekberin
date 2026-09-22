"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Wallet,
  Sparkles,
  HelpCircle,
  Bell,
  Settings,
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isHighlight?: boolean;
  badge?: string;
}

const roleConfig = {
  buyer: {
    title: "Akun Saya",
    color: "blue",
    badge: "USER Terverifikasi",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    name: "Dimas Anggara",
    tag: "@buyer_dimas",
    balance: "Rp 350.000",
    balanceLabel: "Saldo Rekber",
    avatarBg: "bg-gradient-to-tr from-blue-600 to-indigo-500",
    notifications: [
      { id: "n1", title: "Dana Escrow Ditahan Aman", desc: "Pembayaran Anda untuk akun eFootball telah diamankan Admin Anto.", time: "10 mnt lalu", unread: true },
      { id: "n2", title: "Garansi Akun Aktif", desc: "Garansi anti-hackback 48 jam untuk pesanan #tx_3 sedang berjalan.", time: "2 jam lalu", unread: false },
    ],
    items: [
      { href: "/user", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/chat", label: "Transaksi & Chat", icon: MessageCircle, badge: "3" },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/listings", label: "Katalog Akun Game", icon: ShoppingBag },
      { href: "/listings/new", label: "Post Akun Baru", icon: PlusCircle, isHighlight: true },
    ] as NavItem[],
  },
  seller: {
    title: "Toko Penjual",
    color: "emerald",
    badge: "Star Seller 4.8★",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    name: "Rian Pratama",
    tag: "@efootball_seller1",
    balance: "Rp 2.450.000",
    balanceLabel: "Saldo Siap Tarik",
    avatarBg: "bg-gradient-to-tr from-emerald-600 to-teal-500",
    notifications: [
      { id: "n3", title: "Pesanan Masuk Baru", desc: "Buyer telah mentransfer dana ke escrow. Segera kirim data akun!", time: "5 mnt lalu", unread: true },
      { id: "n4", title: "Penarikan Dana Berhasil", desc: "Pencairan saldo Rp 1.500.000 ke BCA telah berhasil.", time: "1 hari lalu", unread: false },
    ],
    items: [
      { href: "/user?tab=seller", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/chat", label: "Transaksi & Chat", icon: MessageCircle, badge: "3" },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/listings", label: "Katalog Akun Game", icon: ShoppingBag },
      { href: "/listings/new", label: "Post Akun Baru", icon: PlusCircle, isHighlight: true },
    ] as NavItem[],
  },
  admin: {
    title: "Admin Rekber",
    color: "amber",
    badge: "Official Escrow Officer",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    name: "Anto Wijaya",
    tag: "@rekber_anto",
    balance: "Rp 4.200.000",
    balanceLabel: "Dana Escrow Ditahan",
    avatarBg: "bg-gradient-to-tr from-amber-600 to-orange-500",
    notifications: [
      { id: "n5", title: "Bukti Transfer Perlu Dicek", desc: "Transaksi #tx_1 mengunggah bukti transfer Rp 865.000.", time: "2 mnt lalu", unread: true },
      { id: "n6", title: "Laporan Sengketa Baru", desc: "Ada pertanyaan seputar perubahan email Konami ID.", time: "15 mnt lalu", unread: true },
    ],
    items: [
      { href: "/admin", label: "Overview & Pool", icon: LayoutDashboard },
      { href: "/admin/transactions", label: "Antrean Transaksi", icon: ShieldCheck },
    ] as NavItem[],
  },
  // role "user" = satu akun USER dengan dua konteks (beli & jual) — Section 17.1
  user: {
    title: "Akun Saya",
    color: "blue",
    badge: "USER Terverifikasi",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    name: "Dimas Anggara",
    tag: "@buyer_dimas",
    balance: "Rp 350.000",
    balanceLabel: "Saldo Rekber",
    avatarBg: "bg-gradient-to-tr from-blue-600 to-indigo-500",
    notifications: [
      { id: "n1", title: "Dana Escrow Ditahan Aman", desc: "Pembayaran Anda untuk akun eFootball telah diamankan Admin Anto.", time: "10 mnt lalu", unread: true },
      { id: "n2", title: "Pesanan Masuk Baru", desc: "Buyer telah mentransfer dana ke escrow. Segera kirim data akun!", time: "5 mnt lalu", unread: true },
    ],
    items: [
      { href: "/user", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/chat", label: "Transaksi & Chat", icon: MessageCircle, badge: "3" },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/listings", label: "Katalog Akun Game", icon: ShoppingBag },
      { href: "/listings/new", label: "Post Akun Baru", icon: PlusCircle, isHighlight: true },
    ] as NavItem[],
  },
};

// Inner nav component that reads searchParams (needs Suspense)
function SidebarNav({ role, currentRole }: { role: "buyer" | "seller" | "admin" | "user"; currentRole: (typeof roleConfig)[keyof typeof roleConfig] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams?.get("view");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1.5">
        Menu {currentRole.title}
      </p>
      <nav className="flex flex-col gap-1">
        {currentRole.items.map((item) => {
          const isChat = item.href === "/user/chat";
          const isTransactionsHistory = item.href === "/user/transactions";
          const isDashboard = item.href === "/user" || item.href === "/user?tab=seller";

          let active = false;
          if (isChat) {
            active = pathname === "/user/chat" || pathname.startsWith("/user/transactions/");
          } else if (isTransactionsHistory) {
            active = pathname === "/user/transactions";
          } else if (isDashboard) {
            active = pathname === "/user" && !currentView;
          } else {
            active =
              pathname === item.href ||
              (!["/admin", "/user"].includes(item.href) &&
                pathname.startsWith(item.href));
          }

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
              {item.badge && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
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
  );
}

export function DashboardSidebar({ role }: { role: "buyer" | "seller" | "admin" | "user" }) {
  const currentRole = roleConfig[role];
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const unreadCount = currentRole.notifications.filter((n) => n.unread).length;

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-3 sm:space-y-4">
      {/* Back to Home & Notification Bar */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex-1 group"
        >
          <ArrowLeft size={14} className="text-slate-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span className="truncate">Kembali ke Beranda</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-600 relative transition-colors cursor-pointer"
            title="Pusat Notifikasi"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800">Notifikasi Transaksi</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">
                  {unreadCount} Baru
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {currentRole.notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-2.5 rounded-xl text-xs space-y-0.5 transition-colors",
                      n.unread ? "bg-blue-50/70 border border-blue-100" : "bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">{n.title}</span>
                      <span className="text-[9px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          title="Pengaturan Akun & Rekening"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Role Switcher Pills */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 sm:py-1">
          Ganti Mode Role:
        </p>
        <div className="grid grid-cols-2 gap-1">
          <Link
            href="/user"
            className={cn(
              "flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl text-[11px] font-bold transition-all",
              role === "user" || role === "buyer" || role === "seller"
                ? "bg-white text-blue-600 shadow-xs border border-blue-200/60"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            )}
          >
            <User size={13} className="mb-0.5" />
            <span>Akun Saya</span>
          </Link>

          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl text-[11px] font-bold transition-all",
              role === "admin"
                ? "bg-white text-amber-600 shadow-xs border border-amber-200/60"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            )}
          >
            <ShieldCheck size={13} className="mb-0.5" />
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* User Profile & Saldo Card in Sidebar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0",
              currentRole.avatarBg
            )}
          >
            {currentRole.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 text-sm truncate">{currentRole.name}</h4>
            <p className="text-xs text-slate-400 truncate">{currentRole.tag}</p>
          </div>
        </div>

        <div className="mb-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border",
              currentRole.badgeColor
            )}
          >
            <Sparkles size={10} />
            {currentRole.badge}
          </span>
        </div>

        {/* Saldo Snippet */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">
              {currentRole.balanceLabel}
            </span>
            <span className="text-sm font-black text-slate-800 tracking-tight">
              {currentRole.balance}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200/70">
            <Wallet size={15} />
          </div>
        </div>
      </div>

      {/* Role Navigation Menu — Suspense boundary for useSearchParams */}
      <Suspense fallback={
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 animate-pulse">
          <div className="h-3 bg-slate-100 rounded mb-3 w-24" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-9 bg-slate-50 rounded-xl" />)}
          </div>
        </div>
      }>
        <SidebarNav role={role} currentRole={currentRole} />
      </Suspense>

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

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pengaturan Akun & Rekening</h3>
                <p className="text-xs text-slate-400">Kelola profil penarikan saldo dan keamanan akun.</p>
              </div>
            </div>

            {savedSettings ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Pengaturan Berhasil Disimpan!</h4>
                <p className="text-xs text-slate-500">Data rekening bank dan notifikasi telah diperbarui.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSavedSettings(true);
                  setTimeout(() => {
                    setSavedSettings(false);
                    setSettingsOpen(false);
                  }, 1500);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Pemilik Akun</label>
                  <input
                    type="text"
                    defaultValue={currentRole.name}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp Notifikasi Transaksi</label>
                  <input
                    type="tel"
                    defaultValue="081234567890"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rekening Bank Utama (Pencairan Saldo)</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      defaultValue="BCA"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-center font-bold"
                      readOnly
                    />
                    <input
                      type="text"
                      defaultValue="8920192819"
                      className="col-span-2 px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
