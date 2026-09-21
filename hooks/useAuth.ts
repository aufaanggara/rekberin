import { signOut, useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const logout = async () => {
    await signOut({ redirect: false });
    window.location.assign("/");
  };

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout,
  };
}
