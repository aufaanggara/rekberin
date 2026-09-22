import { ListingsExplorer } from "@/components/marketplace/ListingsExplorer";
import Link from "next/link";

export function generateMetadata() {
  return {
    title: "Marketplace Akun Game & Rekber — Rekberin",
    description: "Cari akun eFootball, Mobile Legends & FC Mobile terverifikasi dengan filter no minus, OVR, koin, dan tipe login.",
  };
}

export default function ListingsPage({
  searchParams,
}: {
  searchParams?: { q?: string; game?: string; maxPrice?: string };
}) {
  const initialQuery = searchParams?.q || "";
  const initialGame = searchParams?.game || "all";

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
            <Link href="/" className="hover:underline">Beranda</Link>
            <span className="text-slate-300">/</span>
            <Link href="/user" className="hover:underline">Dashboard</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700">Marketplace Akun Game</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pusat Jual Beli Akun Game (JB Terverifikasi)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Bukan grup FB/WA semrawut! Filter spesifik akun impianmu berdasarkan <strong>OVR</strong>, <strong>Koin</strong>, <strong>Nominus (Email Siap Ganti)</strong>, dan <strong>Garansi Anti-Hackback</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Live Interactive Explorer */}
        <ListingsExplorer initialSearch={initialQuery} initialGame={initialGame} />
      </div>
    </div>
  );
}
