import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const role = request.nextauth.token?.role;

    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("example.supabase.co")
    );

    if (
      pathname.startsWith("/admin") &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      if (isConfigured) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    if (
      (pathname.startsWith("/listings/new") || pathname.includes("/edit")) &&
      role !== "USER"
    ) {
      if (isConfigured) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        const isConfigured = Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("example.supabase.co")
        );
        if (!isConfigured) {
          return true;
        }
        return Boolean(token);
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "rekberin_dev_secret_key_12345678901234567890",
  }
);

export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/listings/new/:path*", "/listings/:id/edit/:path*"],
};