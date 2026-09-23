import type { ReactNode } from "react";
import { UserDashboardShell } from "@/components/layout/UserDashboardShell";
import { CurrentUserProvider } from "@/hooks/useCurrentUser";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <UserDashboardShell>{children}</UserDashboardShell>
    </CurrentUserProvider>
  );
}
