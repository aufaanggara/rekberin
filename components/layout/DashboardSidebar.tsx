"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock3, LayoutDashboard, ReceiptText, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type SidebarRole = "buyer" | "seller" | "admin" | "user";
type UserSection = "ongoing" | "history" | "settings";

export interface DashboardSidebarProps {
  role: SidebarRole;
  activeTab?: "buyer" | "seller";
  onTabChange?: (tab: "buyer" | "seller") => void;
  actionRequiredCount?: number;
  unrepliedCount?: number;
}

const userItems: { section: UserSection; label: string; icon: typeof LayoutDashboard }[] = [
  { section: "ongoing", label: "Transaksi Berjalan", icon: Clock3 },
  { section: "history", label: "Riwayat Transaksi", icon: ReceiptText },
  { section: "settings", label: "Pengaturan Akun", icon: Settings },
];

function UserNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const selected: UserSection = viewParam === "history" || viewParam === "settings" ? viewParam : "ongoing";
  const scope = searchParams.get("scope");

  return (
    <nav aria-label="Navigasi akun" className={mobile ? "fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-slate-200 bg-white px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden" : "hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:block"}>
      {!mobile && <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Akun</p>}
      <div className={mobile ? "grid w-full max-w-md grid-cols-3" : "space-y-1"}>
        {userItems.map(({ section, label, icon: Icon }) => {
          const params = new URLSearchParams();
          if (section !== "ongoing") params.set("view", section);
          if (scope === "seller") params.set("scope", "seller");
          const query = params.toString();
          const href = `/user${query ? `?${query}` : ""}`;
          const active = pathname === "/user" && selected === section;
          return (
            <Link
              key={section}
              href={href}
              aria-current={active ? "page" : undefined}
              className={mobile
                ? `flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-bold leading-tight ${active ? "text-blue-800" : "text-slate-500"}`
                : `flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Icon className={mobile ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi admin" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Admin</p>
      <Link href="/admin" className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold ${pathname === "/admin" ? "bg-amber-50 text-amber-800" : "text-slate-600 hover:bg-slate-50"}`}><LayoutDashboard className="h-4 w-4" aria-hidden="true" />Overview &amp; Pool</Link>
      <Link href="/admin/transactions" className={`mt-1 flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold ${pathname.startsWith("/admin/transactions") ? "bg-amber-50 text-amber-800" : "text-slate-600 hover:bg-slate-50"}`}><ShieldCheck className="h-4 w-4" aria-hidden="true" />Antrean Transaksi</Link>
    </nav>
  );
}

function DashboardSidebarContent({ role }: DashboardSidebarProps) {
  const { data: user, isLoading } = useCurrentUser();
  const isAdmin = role === "admin";
  const title = user?.fullName ?? (isLoading ? "Memuat profil..." : "Akun Saya");
  const initial = title && title !== "Memuat profil..." ? title.charAt(0).toUpperCase() : "?";

  const compactUserProfile = role === "user";

  return (
    <aside className="w-full shrink-0 space-y-3 sm:space-y-4 lg:w-64">
      <div className={compactUserProfile ? "flex items-stretch gap-2 lg:block lg:space-y-3" : "space-y-3"}>
        <Link href="/" className={compactUserProfile
          ? "inline-flex min-h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-center text-[11px] font-semibold leading-tight text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-700 lg:min-h-10 lg:w-full lg:justify-start lg:px-3 lg:text-xs"
          : "inline-flex min-h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-700"}>
          <ArrowLeft className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> <span className="min-w-0">Kembali ke Beranda</span>
        </Link>

        <section aria-label="Profil akun" className={compactUserProfile
          ? "min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm lg:p-4"
          : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
          <div className={compactUserProfile ? "flex min-w-0 items-center gap-2 lg:gap-3" : "flex items-center gap-3"}>
            <div className={compactUserProfile
              ? "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 font-bold text-blue-700 lg:h-11 lg:w-11"
              : "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 font-bold text-blue-700"}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span>{initial || <UserRound className="h-5 w-5" aria-hidden="true" />}</span>}
            </div>
            <div className="min-w-0">
              <p className={compactUserProfile ? "truncate text-[13px] font-bold text-slate-900 lg:text-sm" : "truncate text-sm font-bold text-slate-900"}>{title}</p>
              {user?.username && <p className="truncate text-xs text-slate-500">@{user.username}</p>}
              {user?.email && <p className={compactUserProfile ? "hidden truncate text-[11px] text-slate-400 lg:block" : "truncate text-[11px] text-slate-400"}>{user.email}</p>}
            </div>
          </div>
          {isAdmin && <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Panel Admin Rekber</p>}
        </section>
      </div>

      {role === "user" ? (
        <>
          <UserNavigation />
          <UserNavigation mobile />
        </>
      ) : <AdminNavigation />}

      {role === "user" && <div className="hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40 p-3.5 text-xs lg:block">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />Proteksi Rekberin Escrow</p>
        <p className="mt-1.5 leading-relaxed text-slate-500">Dana transaksi tersimpan di escrow hingga proses serah terima selesai.</p>
      </div>}
    </aside>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  return <Suspense fallback={<aside className="h-40 w-full animate-pulse rounded-2xl bg-white lg:w-64" />}><DashboardSidebarContent {...props} /></Suspense>;
}
