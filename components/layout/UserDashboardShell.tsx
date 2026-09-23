"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
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
  const [badges, setBadges] = useState<SidebarBadges>({
    actionRequiredCount: 0,
    unrepliedCount: 0,
  });

  return (
    <SidebarBadgeContext.Provider value={setBadges}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-8">
        <div className="w-full lg:sticky lg:top-20 lg:w-64 lg:shrink-0 lg:self-start">
          <DashboardSidebar role="user" {...badges} />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SidebarBadgeContext.Provider>
  );
}
