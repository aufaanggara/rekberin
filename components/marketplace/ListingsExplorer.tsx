"use client";
import { useState, useMemo } from "react";
import { useListings } from "@/hooks/useListings";
import { ListingCard } from "@/components/marketplace/ListingCard";
import {
  Search,
  Filter,
  RotateCcw,
  X,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Flame,
  AlertCircle,
  Gamepad2,
  ArrowUpDown,
  SlidersHorizontal,
  Check,
  RefreshCw,
} from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, RadioItem } from "@/components/ui/RadioGroup";
import { formatRupiah } from "@/lib/utils";

// Game categories
const GAME_TABS = [
  { id: "all", label: "Semua Game" },
  { id: "eFootball", label: "eFootball 2025" },
  { id: "Mobile Legends", label: "Mobile Legends" },
  { id: "FC Mobile", label: "FC Mobile" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Terbaru Ditambahkan" },
  { value: "ovr_desc", label: "OVR Squad Tertinggi" },
  { value: "price_asc", label: "Harga: Termurah" },
  { value: "price_desc", label: "Harga: Termahal" },
  { value: "rating_desc", label: "Rating Penjual" },
];

export function ListingsExplorer({ initialSearch = "" }: { initialSearch?: string }) {
  const { data: listings, isLoading, error, refetch } = useListings();

  // State
  const [search, setSearch] = useState(initialSearch);
  const [selectedGame, setSelectedGame] = useState("all");
  const [priceRange, setPriceRange] = useState<number[]>([50000, 3000000]);
  const [isNominusOnly, setIsNominusOnly] = useState(false);
  const [hasWarrantyOnly, setHasWarrantyOnly] = useState(false);
  const [selectedLoginMethod, setSelectedLoginMethod] = useState("all");
  const [minOvr, setMinOvr] = useState("all");
  const [minRating, setMinRating] = useState("all");
  const [statusFilter, setStatusFilter] = useState("AVAILABLE");
  const [sortBy, setSortBy] = useState("latest");

  // Mobile Drawer Modals
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  // Filter logic
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // 1. Game filter
      if (selectedGame !== "all" && l.game.toLowerCase() !== selectedGame.toLowerCase()) {
        return false;
      }

      // 2. Keyword search
      if (search.trim()) {
        const query = search.toLowerCase();
        const inTitle = l.title.toLowerCase().includes(query);
        const inDesc = l.description.toLowerCase().includes(query);
        const inNotes = l.details.notes?.toLowerCase().includes(query);
        const inSeller = l.seller.username.toLowerCase().includes(query);
        const inPlayers = l.details.players.some((p) => p.toLowerCase().includes(query));
        const inCards = l.details.cardTypes?.some((c) => c.toLowerCase().includes(query));
        const inLeague = l.details.league?.toLowerCase().includes(query);
        const inLogin = l.details.loginMethod?.toLowerCase().includes(query);

        if (!inTitle && !inDesc && !inNotes && !inSeller && !inPlayers && !inCards && !inLeague && !inLogin) {
          return false;
        }
      }

      // 3. Price range
      if (l.price < priceRange[0] || l.price > priceRange[1]) {
        return false;
      }

      // 4. Nominus
      if (isNominusOnly && !l.details.isNominus) {
        return false;
      }

      // 5. Warranty
      if (hasWarrantyOnly && !l.details.hasWarranty) {
        return false;
      }

      // 6. Login method
      if (selectedLoginMethod !== "all" && l.details.loginMethod !== selectedLoginMethod) {
        return false;
      }

      // 7. OVR
      if (minOvr !== "all") {
        const minVal = parseInt(minOvr, 10);
        if (l.details.overall < minVal) {
          return false;
        }
      }

      // 8. Seller Rating
      if (minRating !== "all") {
        const minRat = parseFloat(minRating);
        if ((l.seller.rating ?? 0) < minRat) {
          return false;
        }
      }

      // 9. Status
      if (statusFilter !== "ALL" && l.status !== statusFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "ovr_desc") return b.details.overall - a.details.overall;
      if (sortBy === "rating_desc") return (b.seller.rating ?? 0) - (a.seller.rating ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    search,
    selectedGame,
    priceRange,
    isNominusOnly,
    hasWarrantyOnly,
    selectedLoginMethod,
    minOvr,
    minRating,
    statusFilter,
    sortBy,
    listings,
  ]);

  // Reset helper
  const resetFilters = () => {
    setSearch("");
    setSelectedGame("all");
    setPriceRange([50000, 3000000]);
    setIsNominusOnly(false);
    setHasWarrantyOnly(false);
    setSelectedLoginMethod("all");
    setMinOvr("all");
    setMinRating("all");
    setStatusFilter("AVAILABLE");
    setSortBy("latest");
  };

  // Count active specific filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedGame !== "all") count++;
    if (priceRange[0] !== 50000 || priceRange[1] !== 3000000) count++;
    if (isNominusOnly) count++;
    if (hasWarrantyOnly) count++;
    if (selectedLoginMethod !== "all") count++;
    if (minOvr !== "all") count++;
    if (minRating !== "all") count++;
    if (statusFilter !== "AVAILABLE") count++;
    return count;
  }, [selectedGame, priceRange, isNominusOnly, hasWarrantyOnly, selectedLoginMethod, minOvr, minRating, statusFilter]);

  const hasActiveFilters = search !== "" || activeFilterCount > 0;

  // Reusable Filter Content (for both Desktop Sidebar & Mobile Sheet)
  const renderFilterFields = () => (
    <div className="space-y-6">
      {/* Filter: Rentang Harga */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Budget / Harga
          </label>
        </div>
        <Slider
          value={priceRange}
          min={50000}
          max={3000000}
          step={50000}
          onValueChange={setPriceRange}
        />
        <div className="flex justify-between text-xs text-slate-600 mt-2 font-semibold">
          <span>{formatRupiah(priceRange[0])}</span>
          <span>{formatRupiah(priceRange[1])}</span>
        </div>

        {/* Quick Price Buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          {[
            { label: "< 200rb", range: [50000, 200000] },
            { label: "200k - 500k", range: [200000, 500000] },
            { label: "500k - 1.5M", range: [500000, 1500000] },
            { label: "> 1.5 Juta", range: [1500000, 3000000] },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => setPriceRange(p.range)}
              className={`text-[11px] py-1.5 px-2 rounded-lg font-medium border text-center transition-colors cursor-pointer ${
                priceRange[0] === p.range[0] && priceRange[1] === p.range[1]
                  ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter: Keamanan Akun & Tautan */}
      <div className="pt-5 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
          Keamanan Akun
        </label>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:text-slate-900">
            <Checkbox
              checked={isNominusOnly}
              onCheckedChange={(v) => setIsNominusOnly(v === true)}
            />
            <span>Hanya Nominus (Email Siap Ganti)</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:text-slate-900">
            <Checkbox
              checked={hasWarrantyOnly}
              onCheckedChange={(v) => setHasWarrantyOnly(v === true)}
            />
            <span>Garansi Anti-Hackback</span>
          </label>
        </div>
      </div>

      {/* Filter: Tipe Login Akun */}
      <div className="pt-5 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
          Metode Login
        </label>
        <select
          value={selectedLoginMethod}
          onChange={(e) => setSelectedLoginMethod(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="all">Semua Tipe Login</option>
          <option value="Konami ID">Konami ID (Single Login)</option>
          <option value="Moonton">Moonton (All Unbind)</option>
          <option value="EA Account">EA Account / FC Mobile</option>
        </select>
      </div>

      {/* Filter: Minimal OVR Squad */}
      <div className="pt-5 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
          Tingkat OVR Squad
        </label>
        <RadioGroup value={minOvr} onValueChange={setMinOvr} className="space-y-2">
          {[
            { value: "all", label: "Semua OVR" },
            { value: "90", label: "OVR 90+ (Full Legend/Meta)" },
            { value: "85", label: "OVR 85+ (Divisi Tinggi)" },
            { value: "80", label: "OVR 80+ (Kompetitif)" },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:text-slate-900">
              <RadioItem value={item.value} />
              <span>{item.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Filter: Status Ketersediaan */}
      <div className="pt-5 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
          Status Listing
        </label>
        <RadioGroup value={statusFilter} onValueChange={setStatusFilter} className="space-y-2">
          {[
            { value: "AVAILABLE", label: "Tersedia Saja (Ready)" },
            { value: "ALL", label: "Semua (Termasuk Terjual)" },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:text-slate-900">
              <RadioItem value={item.value} />
              <span>{item.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );

  return (
    <div id="listings-section" className="relative pb-16 lg:pb-0">
      {/* 1. Main Search & Game Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs mb-5">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 mb-3 sm:mb-4">
          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Messi, Chou, OVR, Konami ID..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Hapus kata kunci"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Game Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
            <Gamepad2 size={16} className="text-blue-600 shrink-0" />
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {GAME_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Chips — Horizontally Scrollable on Mobile for sleek native app feel */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 flex-nowrap -mx-1 px-1 text-xs">
          <span className="font-semibold text-slate-400 flex items-center gap-1 text-[10px] uppercase tracking-wider shrink-0">
            <Flame size={12} className="text-amber-500" /> Filter Cepat:
          </span>

          <button
            onClick={() => setIsNominusOnly(!isNominusOnly)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              isNominusOnly
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            <CheckCircle2 size={13} />
            Nominus
          </button>

          <button
            onClick={() => setHasWarrantyOnly(!hasWarrantyOnly)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              hasWarrantyOnly
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            <ShieldCheck size={13} />
            Garansi Hackback
          </button>

          <button
            onClick={() => setMinOvr(minOvr === "90" ? "all" : "90")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              minOvr === "90"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            <Trophy size={13} />
            OVR 90+
          </button>

          <button
            onClick={() => {
              if (priceRange[1] === 350000) {
                setPriceRange([50000, 3000000]);
              } else {
                setPriceRange([50000, 350000]);
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              priceRange[1] === 350000
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            Budget &lt; 350k
          </button>
        </div>
      </div>

      {/* 2. Main Layout: Desktop Sidebar & Listings Grid */}
      <div className="grid lg:grid-cols-[270px_1fr] gap-8 items-start">
        {/* Left Sidebar Filter (DESKTOP ONLY — Hidden on Mobile for clean view) */}
        <aside className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Filter Spesifik</h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>

          {renderFilterFields()}
        </aside>

        {/* Right Content: Sort Toolbar, Active Filter Chips, Listings Grid */}
        <div>
          {/* Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-xs mb-4 flex items-center justify-between gap-2">
            <div className="text-xs sm:text-sm text-slate-600 font-medium truncate">
              Menemukan <strong className="text-slate-900 font-bold">{filteredListings.length}</strong> akun
            </div>

            {/* Sort Dropdown (Desktop & Tablet) */}
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:flex text-xs text-slate-500 font-medium items-center gap-1">
                <ArrowUpDown size={12} /> Urutkan:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Aktif:</span>

              {search && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium text-[11px]">
                  &quot;{search}&quot;
                  <button onClick={() => setSearch("")} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedGame !== "all" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium text-[11px]">
                  {selectedGame}
                  <button onClick={() => setSelectedGame("all")} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {isNominusOnly && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium text-[11px]">
                  Nominus
                  <button onClick={() => setIsNominusOnly(false)} className="hover:text-emerald-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {hasWarrantyOnly && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium text-[11px]">
                  Garansi
                  <button onClick={() => setHasWarrantyOnly(false)} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {minOvr !== "all" && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 font-medium text-[11px]">
                  OVR {minOvr}+
                  <button onClick={() => setMinOvr("all")} className="hover:text-amber-950">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedLoginMethod !== "all" && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-medium text-[11px]">
                  {selectedLoginMethod}
                  <button onClick={() => setSelectedLoginMethod("all")} className="hover:text-slate-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {(priceRange[0] !== 50000 || priceRange[1] !== 3000000) && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-medium text-[11px]">
                  {formatRupiah(priceRange[0])} - {formatRupiah(priceRange[1])}
                  <button onClick={() => setPriceRange([50000, 3000000])} className="hover:text-slate-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold underline ml-1 cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* Listings Cards Grid */}
          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
              aria-busy="true"
              aria-live="polite"
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-96 rounded-2xl border border-slate-200 bg-white animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-xs" role="alert">
              <AlertCircle size={28} className="mx-auto text-red-500 mb-3" aria-hidden="true" />
              <h3 className="font-bold text-slate-900">Katalog tidak dapat dimuat</h3>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
              >
                <RefreshCw size={15} aria-hidden="true" /> Coba lagi
              </button>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
              <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                Tidak Ada Akun yang Cocok
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
                Tidak ditemukan akun dengan filter saat ini. Coba perlebar rentang harga atau reset filter.
              </p>
              <button
                onClick={resetFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MOBILE FLOATING STICKY ACTION BAR (HP ONLY — App-like UI) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 text-white backdrop-blur-lg border border-white/15 shadow-2xl">
        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <SlidersHorizontal size={15} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-white text-blue-700 text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile Quick Sort Button */}
        <button
          onClick={() => setIsMobileSortOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowUpDown size={14} />
          <span>Urutkan</span>
        </button>
      </div>

      {/* 4. MOBILE FILTER BOTTOM SHEET MODAL (HP ONLY) */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="relative bg-white rounded-t-3xl max-h-[85vh] w-full flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden z-10 animate-in slide-in-from-bottom duration-300">
            {/* Modal Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />

            {/* Modal Header */}
            <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Filter size={18} className="text-blue-600" /> Filter Akun Game
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  Ditemukan {filteredListings.length} akun sesuai kriteria
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {renderFilterFields()}
            </div>

            {/* Modal Footer (Sticky Button) */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                TAMPILKAN {filteredListings.length} AKUN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MOBILE SORT BOTTOM SHEET MODAL (HP ONLY) */}
      {isMobileSortOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileSortOpen(false)}
          />

          <div className="relative bg-white rounded-t-3xl w-full flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden z-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />

            <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowUpDown size={18} className="text-blue-600" /> Urutkan Akun
              </h3>
              <button
                onClick={() => setIsMobileSortOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setIsMobileSortOpen(false);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    sortBy === opt.value
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.value && <Check size={16} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
