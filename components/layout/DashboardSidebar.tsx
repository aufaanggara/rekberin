"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  LayoutDashboard,
  MessageCircle,
  PlusCircle,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

type SidebarRole = "buyer" | "seller" | "admin" | "user";

interface SidebarSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  username?: string;
  role?: "USER" | "ADMIN" | "SUPER_ADMIN";
  isVerified?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
}

const userItems: NavItem[] = [
  { href: "/user", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/chat", label: "Transaksi & Chat", icon: MessageCircle },
  { href: "/user/transactions", label: "Riwayat Transaksi", icon: Receipt },
  { href: "/user?tab=seller&view=withdraw", label: "Saldo & Penarikan", icon: Wallet },
  { href: "/user?view=warranty", label: "Panduan Garansi", icon: ShieldCheck },
  { href: "/listings", label: "Katalog Akun Game", icon: ShoppingBag },
  { href: "/listings/new", label: "Post Akun Baru", icon: PlusCircle, highlight: true },
];

const roleConfig: Record<
  SidebarRole,
  {
    title: string;
    accent: "blue" | "emerald" | "amber";
    items: NavItem[];
  }
> = {
  buyer: { title: "Akun Saya", accent: "blue", items: userItems },
  seller: { title: "Toko Saya", accent: "emerald", items: userItems },
  user: { title: "Akun Saya", accent: "blue", items: userItems },
  admin: {
    title: "Admin Rekber",
    accent: "amber",
    items: [
      { href: "/admin", label: "Overview Admin", icon: LayoutDashboard },
      { href: "/admin/transactions", label: "Antrean Transaksi", icon: ShieldCheck },
    ],
  },
};

function SidebarNav({ role }: { role: SidebarRole }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRole = roleConfig[role];
  const currentView = searchParams.get("view");
  const currentTab = searchParams.get("tab");

  const isItemActive = (item: NavItem) => {
    const [itemPath, itemQuery] = item.href.split("?");
    const itemParams = new URLSearchParams(itemQuery ?? "");

    if (itemPath === "/user" && !itemQuery) {
      return pathname === "/user" && !currentView && !currentTab;
    }

    if (itemPath === "/user" && itemParams.get("view")) {
      return pathname === "/user" && itemParams.get("view") === currentView;
    }

    if (itemPath === "/user" && itemParams.get("tab")) {
      return pathname === "/user" && itemParams.get("tab") === currentTab && itemParams.get("view") === currentView;
    }

    if (itemPath === "/user/chat") {
      return pathname === "/user/chat" || pathname.startsWith("/user/transactions/");
    }

    if (itemPath === "/user/transactions") {
      return pathname === "/user/transactions";
    }

    if (itemPath === "/admin") {
      return pathname === "/admin";
    }

    if (itemPath === "/listings") {
      return pathname === "/listings" || pathname.startsWith("/listings/");
    }

    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  const activeClass =
    currentRole.accent === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : currentRole.accent === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs">
      <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Menu {currentRole.title}
      </p>
      <nav className="flex flex-col gap-1" aria-label={`Navigasi ${currentRole.title}`}>
        {currentRole.items.map((item) => {
          const active = isItemActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                active
                  ? activeClass
                  : item.highlight
                    ? "border-dashed border-emerald-300 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/70"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={16} aria-hidden="true" className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.highlight && (
                <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
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

function SidebarLoading() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4" aria-label="Memuat menu">
      <div className="h-32 animate-pulse rounded-xl bg-slate-50" />
    </div>
  );
}

export function DashboardSidebar({ role }: { role: SidebarRole }) {
  const { data: session, status } = useSession();
  const sessionUser = session?.user as SidebarSessionUser | undefined;
  const displayName = sessionUser?.name?.trim() || "Pengguna Rekberin";
  const displayTag = sessionUser?.username
    ? `@${sessionUser.username}`
    : sessionUser?.email || "Profil akun";
  const canAccessAdmin =
    sessionUser?.role === "ADMIN" || sessionUser?.role === "SUPER_ADMIN";
  const badgeLabel = sessionUser?.isVerified
    ? "Akun terverifikasi"
    : sessionUser?.role === "ADMIN" || sessionUser?.role === "SUPER_ADMIN"
      ? "Admin Rekber"
      : "Akun pengguna";

  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-64" aria-busy={status === "loading"}>
      <Link
        href="/"
        className="group inline-flex min-h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-xs transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <ArrowLeft
          size={14}
          aria-hidden="true"
          className="text-slate-400 transition-transform group-hover:-translate-x-0.5"
        />
        <span>Kembali ke Beranda</span>
      </Link>

      {canAccessAdmin && (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ganti ruang kerja
          </p>
          <div className="grid grid-cols-2 gap-1">
            <Link
              href="/user"
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-bold transition-colors",
                role !== "admin"
                  ? "border border-blue-200/60 bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:bg-white/60"
              )}
            >
              <User size={14} aria-hidden="true" />
              <span>Akun Saya</span>
            </Link>
            <Link
              href="/admin"
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-bold transition-colors",
                role === "admin"
                  ? "border border-amber-200/60 bg-white text-amber-600 shadow-xs"
                  : "text-slate-500 hover:bg-white/60"
              )}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        {status === "loading" ? (
          <div className="space-y-3" aria-label="Memuat profil">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar name={displayName} size={44} />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-slate-900">{displayName}</h4>
                <p className="truncate text-xs text-slate-500">{displayTag}</p>
              </div>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                <Sparkles size={10} aria-hidden="true" />
                {badgeLabel}
              </span>
            </div>
          </>
        )}
      </div>

      <Suspense fallback={<SidebarLoading />}>
        <SidebarNav role={role} />
      </Suspense>

      <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-3.5 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
          <ShieldCheck size={14} aria-hidden="true" className="text-emerald-600" />
          <span>Proteksi Rekberin Escrow</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Status transaksi dan pembayaran diambil langsung dari API Rekberin.
        </p>
      </div>

      {role !== "admin" && (
        <Link
          href="/listings/new"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Store size={15} aria-hidden="true" />
          Jual akun game
        </Link>
      )}
    </aside>
  );
}
