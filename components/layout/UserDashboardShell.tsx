"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface SidebarBadges {
  actionRequiredCount: number;
  unrepliedCount: number;
}

const SidebarBadgeContext = createContext<Dispatch<SetStateAction<SidebarBadges>> | null>(null);

export function useUserSidebarBadges(actionRequiredCount: number, unrepliedCount: number) {
  const setBadges = useContext(SidebarBadgeContext);

  useEffect(() => {
    setBadges?.((previous) =>
      previous.actionRequiredCount === actionRequiredCount && previous.unrepliedCount === unrepliedCount
        ? previous
        : { actionRequiredCount, unrepliedCount }
    );
  }, [actionRequiredCount, unrepliedCount, setBadges]);
}

export function UserDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChildPage = pathname !== "/user";
  const [badges, setBadges] = useState<SidebarBadges>({
    actionRequiredCount: 0,
    unrepliedCount: 0,
  });

  return (
    <SidebarBadgeContext.Provider value={setBadges}>
      <div data-user-child-page={isChildPage ? "" : undefined} className={`mx-auto flex max-w-7xl flex-col lg:flex-row lg:gap-8 ${isChildPage ? "gap-0 px-0 py-0 lg:px-6 lg:py-8" : "gap-4 px-3 py-6 sm:gap-6 sm:px-6 sm:py-8"}`}>
        <div className={`${isChildPage ? "hidden lg:block" : "w-full"} lg:sticky lg:top-20 lg:w-64 lg:shrink-0 lg:self-start`}>
          <DashboardSidebar role="user" {...badges} />
        </div>
        <main className="min-w-0 flex-1">
          {isChildPage && <Link href="/user" className="inline-flex min-h-11 items-center gap-2 px-4 pt-2 text-sm font-semibold text-blue-700 lg:hidden"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke dashboard</Link>}
          {children}
        </main>
      </div>
    </SidebarBadgeContext.Provider>
  );
}
