import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Rekberin — Marketplace & Rekber Akun Game",
    short_name: "Rekberin",
    description:
      "Marketplace jual beli akun game terverifikasi dengan jaminan escrow rekber aman dan garansi 48 jam anti-hackback.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    categories: ["shopping", "games", "finance"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Cari Akun Game",
        short_name: "Marketplace",
        description: "Jelajahi katalog akun game terverifikasi",
        url: "/listings",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Dashboard Saya",
        short_name: "Dashboard",
        description: "Akses riwayat transaksi dan pengelolaan akun",
        url: "/dashboard",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Jual Akun Game",
        short_name: "Jual Akun",
        description: "Pasang iklan akun game baru",
        url: "/sell",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
