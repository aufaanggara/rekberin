import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Rekberin — Marketplace & Rekber Akun Game Terpercaya",
  manifest: "/manifest.webmanifest",
  applicationName: "Rekberin",
  description:
    "Cari akun game impianmu dan transaksi aman dengan admin rekber terverifikasi di Rekberin. Seperti Glints tapi khusus gamer!",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rekberin",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="font-sans bg-slate-50 text-slate-800 min-h-screen flex flex-col antialiased selection:bg-blue-100 selection:text-blue-700">
        <AuthSessionProvider>
          <SmoothScrollProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </SmoothScrollProvider>
        </AuthSessionProvider>
        <Toaster theme="light" position="top-center" richColors />
        <ServiceWorkerRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
