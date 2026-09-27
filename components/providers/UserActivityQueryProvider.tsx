"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function UserActivityQueryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const sessionUser = session?.user as { id?: unknown } | undefined;
  const userId = typeof sessionUser?.id === "string" ? sessionUser.id : null;
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: 1,
      },
    },
  }));
  const previousPathname = useRef(pathname);
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    if (previousUserId.current !== undefined && previousUserId.current !== userId) {
      queryClient.clear();
    }
    previousUserId.current = userId;
  }, [queryClient, status, userId]);

  useEffect(() => {
    const returnedFromChild = previousPathname.current.startsWith("/user/");
    previousPathname.current = pathname;
    if (pathname === "/user" && returnedFromChild) {
      void queryClient.invalidateQueries({ queryKey: ["user-activity"] });
    }
  }, [pathname, queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
