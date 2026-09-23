"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  User,
  ArrowLeft,
  Wallet,
  Sparkles,
  Bell,
  Settings,
  X,
  CheckCircle2,
  MessageCircle,
  Loader2,
  ShoppingCart,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { LucideIcon } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isHighlight?: boolean;
  badge?: string;
}

// Static role configuration — only UI/color/nav data, NOT user identity
const roleStaticConfig = {
  buyer: {
    title: "Akun Saya",
    color: "blue",
    badge: "USER Terverifikasi",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    avatarBg: "bg-gradient-to-tr from-blue-600 to-indigo-500",
    items: [
      { href: "/user", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/chat", label: "Transaksi & Chat", icon: MessageCircle },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/user?tab=seller&view=withdraw", label: "Saldo & Penarikan", icon: Wallet },
      { href: "/user?view=warranty", label: "Panduan Garansi", icon: ShieldCheck },
    ] as NavItem[],
  },
  seller: {
    title: "Toko Penjual",
    color: "emerald",
    badge: "Penjual Aktif",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    avatarBg: "bg-gradient-to-tr from-emerald-600 to-teal-500",
    items: [
      { href: "/user?tab=seller", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/chat", label: "Transaksi & Chat", icon: MessageCircle },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/user?tab=seller&view=withdraw", label: "Saldo & Penarikan", icon: Wallet },
      { href: "/user?view=warranty", label: "Panduan Garansi", icon: ShieldCheck },
    ] as NavItem[],
  },
  admin: {
    title: "Admin Rekber",
    color: "amber",
    badge: "Official Escrow Officer",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    avatarBg: "bg-gradient-to-tr from-amber-600 to-orange-500",
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
    avatarBg: "bg-gradient-to-tr from-blue-600 to-indigo-500",
    items: [
      { href: "/user", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/chat", label: "Transaksi & Chat", icon: MessageCircle },
      { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
      { href: "/user?tab=seller&view=withdraw", label: "Saldo & Penarikan", icon: Wallet },
      { href: "/user?view=warranty", label: "Panduan Garansi", icon: ShieldCheck },
    ] as NavItem[],
  },
};

// Inner nav component that reads searchParams (needs Suspense)
function SidebarNav({
  role,
  currentTab,
  staticConfig,
}: {
  role: "buyer" | "seller" | "admin" | "user";
  currentTab?: "buyer" | "seller";
  staticConfig: (typeof roleStaticConfig)[keyof typeof roleStaticConfig];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams?.get("view");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1.5">
        Menu {staticConfig.title}
      </p>
      <nav className="flex flex-col gap-1">
        {staticConfig.items.map((item) => {
          const isChat = item.href === "/user/chat";
          const isTransactionsHistory = item.href === "/user/transactions";
          const href = role === "user" && currentTab === "seller" && (isChat || isTransactionsHistory)
            ? `${item.href}?tab=seller`
            : item.href;
          const isWithdraw = item.href.includes("view=withdraw");
          const isWarranty = item.href.includes("view=warranty");
          const isDashboard =
            (item.href === "/user" || item.href === "/user?tab=seller") &&
            !isWithdraw &&
            !isWarranty;

          let active = false;
          if (isWarranty) {
            active = pathname === "/user" && currentView === "warranty";
          } else if (isWithdraw) {
            active = pathname === "/user" && currentView === "withdraw";
          } else if (isChat) {
            active = pathname === "/user/chat" || pathname.startsWith("/user/transactions/");
          } else if (isTransactionsHistory) {
            active = pathname === "/user/transactions";
          } else if (isDashboard) {
            if (role === "user") {
              active =
                pathname === "/user" &&
                !currentView &&
                (currentTab === "seller"
                  ? item.href.includes("tab=seller")
                  : !item.href.includes("tab=seller"));
            } else {
              active = pathname === "/user" && !currentView;
            }
          } else {
            active =
              pathname === item.href ||
              (!["/admin", "/user"].includes(item.href) &&
                pathname.startsWith(item.href));
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                active
                  ? currentTab === "seller" || role === "seller"
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
                    ? currentTab === "seller" || role === "seller"
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

export interface DashboardSidebarProps {
  role: "buyer" | "seller" | "admin" | "user";
  activeTab?: "buyer" | "seller";
  onTabChange?: (tab: "buyer" | "seller") => void;
  actionRequiredCount?: number;
  unrepliedCount?: number;
}

function DashboardSidebarContent({
  role,
  activeTab,
  onTabChange,
  actionRequiredCount,
  unrepliedCount,
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const viewParam = searchParams?.get("view");
  const [selectedTab, setSelectedTab] = useState<"buyer" | "seller">(
    tabParam === "seller" || viewParam === "withdraw" ? "seller" : "buyer"
  );
  const currentTab = activeTab ?? selectedTab;

  useEffect(() => {
    if (tabParam === "seller" || viewParam === "withdraw" || viewParam === "chat" || viewParam === "orders") {
      setSelectedTab("seller");
    } else if (tabParam === "buyer" || viewParam === "warranty" || pathname === "/user") {
      setSelectedTab("buyer");
    }
  }, [pathname, tabParam, viewParam]);

  const effectiveConfig =
    role === "user"
      ? currentTab === "seller"
        ? roleStaticConfig.seller
        : roleStaticConfig.buyer
      : roleStaticConfig[role];

  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  // Derive display values from real user data (with fallback for loading state)
  const displayName = isUserLoading
    ? "Memuat..."
    : currentUser?.fullName ?? "—";
  const displayTag = isUserLoading
    ? ""
    : currentUser?.username ? `@${currentUser.username}` : "—";
  const displayInitial = displayName && displayName !== "Memuat..." && displayName !== "—"
    ? displayName[0].toUpperCase()
    : "?";

  // Badge text
  const badgeText = role === "admin"
    ? effectiveConfig.badge
    : currentTab === "seller"
      ? "Penjual Aktif"
      : currentUser?.isVerified
        ? "Pembeli Terverifikasi"
        : "Pembeli";

  const changeTab = (tab: "buyer" | "seller") => {
    setSelectedTab(tab);
    if (onTabChange) {
      onTabChange(tab);
      return;
    }
    const destination = pathname === "/user/chat" || pathname === "/user/transactions"
      ? pathname
      : "/user";
    router.push(`${destination}${tab === "seller" ? "?tab=seller" : ""}`);
  };

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

        {/* Notification Bell — notifikasi belum ada model DB, tampilkan kosong */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-600 relative transition-colors cursor-pointer"
            title="Pusat Notifikasi"
          >
            <Bell size={16} />
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800">Notifikasi Transaksi</span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada notifikasi.
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

      {/* Switcher Mode: Sebagai Pembeli vs Sebagai Penjual — Dibuat kecil di atas profil */}
      {role === "user" && (
        <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 sm:py-1">
            Mode Aktivitas:
          </p>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => changeTab("buyer")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer",
                currentTab === "buyer"
                  ? "bg-white text-blue-600 shadow-xs border border-blue-200/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              )}
            >
              <ShoppingCart size={13} className="shrink-0" />
              <span>Pembeli</span>
              {(actionRequiredCount ?? 0) > 0 && (
                <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shrink-0">
                  {actionRequiredCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => changeTab("seller")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer",
                currentTab === "seller"
                  ? "bg-white text-emerald-600 shadow-xs border border-emerald-200/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              )}
            >
              <Store size={13} className="shrink-0" />
              <span>Penjual</span>
              {(unrepliedCount ?? 0) > 0 && (
                <span className="w-4 h-4 bg-purple-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shrink-0">
                  {unrepliedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Role Admin Badge jika di Dashboard Admin */}
      {role === "admin" && (
        <div className="bg-amber-50/80 p-2 rounded-2xl border border-amber-200/60 flex items-center gap-2 text-xs font-bold text-amber-800">
          <ShieldCheck size={16} className="text-amber-600" />
          <span>Panel Admin Rekber</span>
        </div>
      )}

      {/* User Profile Card — data real dari useCurrentUser */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 transition-colors",
              effectiveConfig.avatarBg
            )}
          >
            {isUserLoading ? (
              <Loader2 size={18} className="animate-spin opacity-70" />
            ) : (
              displayInitial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 text-sm truncate">
              {displayName}
            </h4>
            <p className="text-xs text-slate-400 truncate">{displayTag}</p>
          </div>
        </div>

        <div className="mb-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors",
              effectiveConfig.badgeColor
            )}
          >
            <Sparkles size={10} />
            {badgeText}
          </span>
        </div>

        {/* Email snippet */}
        {!isUserLoading && currentUser?.email && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {currentUser.email}
            </span>
          </div>
        )}
        {isUserLoading && (
          <div className="pt-3 border-t border-slate-100">
            <div className="h-3 bg-slate-100 rounded animate-pulse w-32" />
          </div>
        )}
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
        <SidebarNav role={role} currentTab={currentTab} staticConfig={effectiveConfig} />
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
                    defaultValue={currentUser?.fullName ?? ""}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username</label>
                  <input
                    type="text"
                    defaultValue={currentUser?.username ?? ""}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={currentUser?.email ?? ""}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    readOnly
                  />
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

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <Suspense
      fallback={
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-9 bg-slate-100 rounded-xl" />
              <div className="h-9 bg-slate-100 rounded-xl" />
              <div className="h-9 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </aside>
      }
    >
      <DashboardSidebarContent {...props} />
    </Suspense>
  );
}
