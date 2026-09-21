"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Gamepad2,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Star,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { platformStats } from "@/data/dummy";

const quickTags = [
  { label: "🛡️ Nominus", query: "Nominus" },
  { label: "⭐ OVR 90+", query: "90" },
  { label: "🔥 Messi Big Time", query: "Messi" },
  { label: "👑 MLBB Mythic", query: "Mythic" },
  { label: "💰 Budget < 350rb", query: "350" },
  { label: "⚡ FC Mobile", query: "FC Mobile" },
];

const stats = [
  {
    icon: CheckCircle2,
    label: "Transaksi Berhasil",
    value: platformStats.totalTransactions,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    icon: ShieldCheck,
    label: "Admin Rekber KYC",
    value: platformStats.totalAdmins,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
  },
  {
    icon: Star,
    label: "Rating Kepuasan",
    value: platformStats.avgRating,
    suffix: "/5",
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-100",
  },
  {
    icon: Users,
    label: "Seller Aktif",
    value: platformStats.totalSellers,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-100",
  },
];

const socialFaces = [
  "Anto Wijaya",
  "Budi Santoso",
  "Cinta Amelia",
  "Rian Pratama",
  "Dewi Lestari",
];

export function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState("all");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200 pt-10 pb-14">
      {/* Background subtle dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 z-10">
        {/* Title */}
        <div className="text-center mb-6">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-1 text-xs text-blue-700 mb-5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="font-semibold">Marketplace & Rekber Akun Game Terpercaya</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-slate-900 mb-4 leading-[1.15]">
            Temukan Akun Impianmu,{" "}
            <br className="hidden sm:inline" />
            <span className="text-blue-600">Transaksi Aman</span> Terlindungi Rekber
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg mb-8 leading-relaxed">
            Marketplace akun eFootball & game kompetitif terbesar. Bebas ripper, dana tersimpan di admin escrow terverifikasi.
          </p>
        </div>

        {/* Glints-Style Search Widget — white card with shadow */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-2.5 shadow-xl shadow-blue-950/5 mb-6 text-left">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams({ q: searchQuery });
              if (selectedGame !== "all") {
                params.set("game", selectedGame);
              }
              router.push(`/listings?${params.toString()}`);
            }}
            className="flex flex-col md:flex-row items-stretch gap-2"
          >
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 md:bg-white rounded-xl border md:border-transparent border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <Search size={19} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari squad, pemain (Messi/Neymar), OVR, nama seller..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
            </div>

            {/* Game Selector */}
            <div className="md:w-52 flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 md:bg-white rounded-xl border md:border-transparent md:border-l md:border-slate-200 border-slate-200">
              <Gamepad2 size={18} className="text-slate-400 shrink-0" />
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Game</option>
                <option value="eFootball">eFootball Mobile</option>
                <option value="Mobile Legends">Mobile Legends</option>
                <option value="FC Mobile">FC Mobile</option>
              </select>
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="shrink-0 font-bold bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Cari Akun
            </Button>
          </form>
        </div>

        {/* Quick Tags (Populer) */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 mb-8">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <TrendingUp size={13} className="text-blue-600" /> Populer:
          </span>
          {quickTags.map((tag) => (
            <Link
              key={tag.label}
              href={`/listings?q=${encodeURIComponent(tag.query)}`}
              className="px-3 py-1 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 font-medium transition-colors shadow-xs"
            >
              {tag.label}
            </Link>
          ))}
        </div>

        {/* Social Proof */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600 mb-10">
          <div className="flex -space-x-2 items-center">
            {socialFaces.map((name) => (
              <Avatar
                key={name}
                name={name}
                size={28}
                className="ring-2 ring-white shadow-xs"
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <span className="font-bold text-slate-900">4.9/5</span>
            <span className="text-slate-400">•</span>
            <span>Dipercaya oleh <strong>2.400+</strong> gamer & seller</span>
          </div>
        </div>

        {/* 4 Stats Cards — Clean White Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow text-left flex items-start gap-3.5"
              >
                <div className={`p-2.5 rounded-lg border shrink-0 ${s.bg} ${s.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {s.value}
                    {s.suffix ?? ""}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
