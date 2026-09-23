"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { getApiErrorMessage, readJsonResponse } from "@/lib/transaction-api-client";

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isVerified: boolean;
  createdAt: string;
}

function useCurrentUserRequest(enabled: boolean) {
  const { data: session, status } = useSession();
  const [data, setData] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Profil tidak dapat dimuat."));
      }

      const result = payload as { user: CurrentUser };
      setData(result.user);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Profil tidak dapat dimuat."
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, status]);

  useEffect(() => {
    if (enabled) void refetch();
  }, [enabled, refetch]);

  return { data, isLoading, error, refetch, session };
}

const CurrentUserContext = createContext<ReturnType<typeof useCurrentUserRequest> | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUserRequest(true);
  return createElement(CurrentUserContext.Provider, { value: currentUser }, children);
}

export function useCurrentUser() {
  const shared = useContext(CurrentUserContext);
  const standalone = useCurrentUserRequest(shared === null);
  return shared ?? standalone;
}
