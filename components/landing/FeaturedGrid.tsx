"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { dummyListings } from "@/data/dummy";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ArrowRight, Sparkles } from "lucide-react";

const GAME_TABS = [
  { id: "all", label: "Semua Game" },
  { id: "eFootball", label: "eFootball 2025" },
  { id: "Mobile Legends", label: "Mobile Legends" },
  { id: "FC Mobile", label: "FC Mobile" },
];

export function FeaturedGrid() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("rekber_featured_tab");
        if (saved && ["all", "eFootball", "Mobile Legends", "FC Mobile"].includes(saved)) {
          return saved;
        }
      } catch (e) {}
    }
    return "all";
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("rekber_featured_tab", tabId);
      } catch (e) {}
    }
  };

  const filtered = useMemo(() => {
    const available = dummyListings.filter((l) => l.status === "AVAILABLE");
    if (activeTab === "all") return available;
    return available.filter(
      (l) => l.game.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab]);

  // Show max 6 on homepage
  const displayListings = filtered.slice(0, 6);

  return (
    <section className="py-12 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Akun Game Pilihan
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            Akun terverifikasi dengan harga terbaik, siap transaksi aman via rekber
          </p>
        </div>

        {/* Game Tabs — Glints style */}
        <div className="flex items-center gap-1 border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
          {GAME_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? "text-blue-600 border-blue-600"
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Listing Cards Grid */}
        {displayListings.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-sm">
              Belum ada akun untuk kategori ini. Coba pilih game lain!
            </p>
          </div>
        )}

        {/* CTA Button — "Lihat Semua Katalog" */}
        <div className="text-center mt-10">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            LIHAT SEMUA KATALOG
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
