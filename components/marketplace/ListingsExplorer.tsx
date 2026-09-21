"use client";
import { useState, useMemo } from "react";
import { useListings } from "@/hooks/useListings";
import { ListingCard } from "@/components/marketplace/ListingCard";
import {
  Search,
  Filter,
  RotateCcw,
  X,
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

const GAME_TABS = [
  { id: "all", label: "Semua Game" },
  { id: "eFootball", label: "eFootball 2025" },
  { id: "Mobile Legends", label: "Mobile Legends" },
  { id: "FC Mobile", label: "FC Mobile" },
] as const;

type GameId = (typeof GAME_TABS)[number]["id"];

type FilterOption = { value: string; label: string };

type GameFilterConfig = {
  searchPlaceholder: string;
  loginOptions: FilterOption[];
  metric?: {
    kind: "overall" | "league";
    label: string;
    options: FilterOption[];
    rankOrder?: string[];
  };
};

const GAME_FILTER_CONFIG: Record<GameId, GameFilterConfig> = {
  all: {
    searchPlaceholder: "Cari akun, pemain, seller, atau metode transaksi...",
    loginOptions: [],
  },
  eFootball: {
    searchPlaceholder: "Cari Messi, Neymar, OVR, Konami ID...",
    loginOptions: [{ value: "Konami ID", label: "Konami ID" }],
    metric: {
      kind: "overall",
      label: "Minimal OVR Squad",
      options: [
        { value: "90", label: "OVR 90+ (Full Legend/Meta)" },
        { value: "85", label: "OVR 85+ (Divisi Tinggi)" },
        { value: "80", label: "OVR 80+ (Kompetitif)" },
      ],
    },
  },
  "Mobile Legends": {
    searchPlaceholder: "Cari hero, skin, rank, Moonton...",
    loginOptions: [{ value: "Moonton", label: "Moonton" }],
    metric: {
      kind: "league",
      label: "Rank Minimum",
      options: [
        { value: "Mythic", label: "Mythic" },
        { value: "Legend", label: "Legend ke atas" },
        { value: "Epic", label: "Epic ke atas" },
      ],
      rankOrder: ["Mythic", "Legend", "Epic", "Grandmaster", "Master", "Warrior"],
    },
  },
  "FC Mobile": {
    searchPlaceholder: "Cari pemain, OVR, EA Account...",
    loginOptions: [{ value: "EA Account", label: "EA Account" }],
    metric: {
      kind: "overall",
      label: "Minimal OVR Squad",
      options: [
        { value: "100", label: "OVR 100+" },
        { value: "95", label: "OVR 95+" },
        { value: "90", label: "OVR 90+" },
      ],
    },
  },
};

function normalizeGame(value?: string): GameId {
  const normalized = value?.trim().toLowerCase();
  return (
    GAME_TABS.find((tab) => tab.id.toLowerCase() === normalized)?.id ?? "all"
  );
}

const SORT_OPTIONS = [
  { value: "latest", label: "Terbaru Ditambahkan" },
  { value: "ovr_desc", label: "OVR Squad Tertinggi" },
  { value: "price_asc", label: "Harga: Termurah" },
  { value: "price_desc", label: "Harga: Termahal" },
  { value: "rating_desc", label: "Rating Penjual" },
];

export function ListingsExplorer({
  initialSearch = "",
  initialGame = "all",
}: {
  initialSearch?: string;
  initialGame?: string;
}) {
  const { data: listings, isLoading, error, refetch } = useListings();

  // State
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch.trim());
  const [selectedGame, setSelectedGame] = useState<GameId>(() => normalizeGame(initialGame));
  const [priceRange, setPriceRange] = useState<number[]>([50000, 3000000]);
  const [isNominusOnly, setIsNominusOnly] = useState(false);
  const [hasWarrantyOnly, setHasWarrantyOnly] = useState(false);
  const [selectedLoginMethod, setSelectedLoginMethod] = useState("all");
  const [minOvr, setMinOvr] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [minRating, setMinRating] = useState("all");
  const [statusFilter, setStatusFilter] = useState("AVAILABLE");
  const [sortBy, setSortBy] = useState("latest");

  // Mobile Drawer Modals
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  // Filter logic
  const filteredListings = useMemo(() => {
    const gameConfig = GAME_FILTER_CONFIG[selectedGame];

    return listings.filter((l) => {
      // 1. Game filter
      if (selectedGame !== "all" && l.game.toLowerCase() !== selectedGame.toLowerCase()) {
        return false;
      }

      // 2. Keyword search
      if (appliedSearch.trim()) {
        const query = appliedSearch.toLowerCase();
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
      if (gameConfig.metric?.kind === "overall" && minOvr !== "all") {
        const minVal = parseInt(minOvr, 10);
        if (l.details.overall < minVal) {
          return false;
        }
      }

      // 8. Mobile Legends rank
      if (gameConfig.metric?.kind === "league" && selectedLeague !== "all") {
        const rankOrder = gameConfig.metric.rankOrder ?? [];
        const selectedRankIndex = rankOrder.indexOf(selectedLeague);
        const listingRankIndex = rankOrder.findIndex(
          (rank) => rank.toLowerCase() === l.details.league.toLowerCase()
        );
        if (selectedRankIndex === -1 || listingRankIndex === -1 || listingRankIndex > selectedRankIndex) {
          return false;
        }
      }

      // 9. Seller Rating
      if (minRating !== "all") {
        const minRat = parseFloat(minRating);
        if ((l.seller.rating ?? 0) < minRat) {
          return false;
        }
      }

      // 10. Status
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
    appliedSearch,
    selectedGame,
    priceRange,
    isNominusOnly,
    hasWarrantyOnly,
    selectedLoginMethod,
    minOvr,
    selectedLeague,
    minRating,
    statusFilter,
    sortBy,
    listings,
  ]);

  // Reset helper
  const resetFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setSelectedGame("all");
    setPriceRange([50000, 3000000]);
    setIsNominusOnly(false);
    setHasWarrantyOnly(false);
    setSelectedLoginMethod("all");
    setMinOvr("all");
    setSelectedLeague("all");
    setMinRating("all");
    setStatusFilter("AVAILABLE");
    setSortBy("latest");
  };

  // Count active specific filters
  const activeFilterCount = useMemo(() => {
    const gameConfig = GAME_FILTER_CONFIG[selectedGame];
    let count = 0;
    if (selectedGame !== "all") count++;
    if (priceRange[0] !== 50000 || priceRange[1] !== 3000000) count++;
    if (isNominusOnly) count++;
    if (hasWarrantyOnly) count++;
    if (selectedLoginMethod !== "all") count++;
    if (gameConfig.metric?.kind === "overall" && minOvr !== "all") count++;
    if (gameConfig.metric?.kind === "league" && selectedLeague !== "all") count++;
    if (minRating !== "all") count++;
    if (statusFilter !== "AVAILABLE") count++;
    return count;
  }, [selectedGame, priceRange, isNominusOnly, hasWarrantyOnly, selectedLoginMethod, minOvr, selectedLeague, minRating, statusFilter]);

  const hasActiveFilters = appliedSearch !== "" || activeFilterCount > 0;

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  const handleGameChange = (game: GameId) => {
    setSelectedGame(game);
    setSelectedLoginMethod("all");
    setMinOvr("all");
    setSelectedLeague("all");
  };

  // Reusable Filter Content (for both Desktop Sidebar & Mobile Sheet)
  const renderFilterFields = (idPrefix: string) => {
    const gameConfig = GAME_FILTER_CONFIG[selectedGame];

    return (
      <div className="space-y-6">
        {/* Filter: Game */}
        <div>
          <label
            htmlFor={`${idPrefix}-game`}
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Game
          </label>
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
            <Gamepad2 size={16} className="shrink-0 text-blue-600" aria-hidden="true" />
            <select
              id={`${idPrefix}-game`}
              value={selectedGame}
              onChange={(event) => handleGameChange(normalizeGame(event.target.value))}
              className="w-full bg-transparent py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              {GAME_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
          {selectedGame === "all" && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Pilihan di bawah hanya menampilkan filter yang berlaku untuk semua game.
            </p>
          )}
        </div>

        {/* Filter: Rentang Harga */}
        <div className="border-t border-slate-100 pt-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Budget / Harga
          </label>
          <Slider
            value={priceRange}
            min={50000}
            max={3000000}
            step={50000}
            onValueChange={setPriceRange}
          />
          <div className="mt-2 flex justify-between text-xs font-semibold text-slate-600">
            <span>{formatRupiah(priceRange[0])}</span>
            <span>{formatRupiah(priceRange[1])}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {[
              { label: "< 200rb", range: [50000, 200000] },
              { label: "200k - 500k", range: [200000, 500000] },
              { label: "500k - 1.5M", range: [500000, 1500000] },
              { label: "> 1.5 Juta", range: [1500000, 3000000] },
            ].map((pricePreset) => (
              <button
                key={pricePreset.label}
                type="button"
                onClick={() => setPriceRange(pricePreset.range)}
                className={`min-h-11 rounded-lg border px-2 py-1.5 text-center text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  priceRange[0] === pricePreset.range[0] && priceRange[1] === pricePreset.range[1]
                    ? "border-blue-600 bg-blue-600 font-bold text-white shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {pricePreset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter: Keamanan Akun */}
        <div className="border-t border-slate-100 pt-5">
          <span className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Keamanan Akun
          </span>
          <div className="space-y-1">
            <label className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
              <Checkbox
                checked={isNominusOnly}
                onCheckedChange={(value) => setIsNominusOnly(value === true)}
              />
              <span>Hanya Nominus (Email Siap Ganti)</span>
            </label>

            <label className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
              <Checkbox
                checked={hasWarrantyOnly}
                onCheckedChange={(value) => setHasWarrantyOnly(value === true)}
              />
              <span>Garansi Anti-Hackback</span>
            </label>
          </div>
        </div>

        {/* Game-specific filters */}
        {selectedGame !== "all" && (
          <>
            <div className="border-t border-slate-100 pt-5">
              <label
                htmlFor={`${idPrefix}-login`}
                className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Metode Login {selectedGame}
              </label>
              <select
                id={`${idPrefix}-login`}
                value={selectedLoginMethod}
                onChange={(event) => setSelectedLoginMethod(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              >
                <option value="all">Semua Metode Login</option>
                {gameConfig.loginOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {gameConfig.metric?.kind === "overall" && (
              <div className="border-t border-slate-100 pt-5">
                <span className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {gameConfig.metric.label}
                </span>
                <RadioGroup value={minOvr} onValueChange={setMinOvr} className="space-y-1">
                  <label className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                    <RadioItem value="all" />
                    <span>Semua OVR</span>
                  </label>
                  {gameConfig.metric.options.map((option) => (
                    <label key={option.value} className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                      <RadioItem value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {gameConfig.metric?.kind === "league" && (
              <div className="border-t border-slate-100 pt-5">
                <span className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {gameConfig.metric.label}
                </span>
                <RadioGroup value={selectedLeague} onValueChange={setSelectedLeague} className="space-y-1">
                  <label className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                    <RadioItem value="all" />
                    <span>Semua Rank</span>
                  </label>
                  {gameConfig.metric.options.map((option) => (
                    <label key={option.value} className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                      <RadioItem value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}
          </>
        )}

        {/* Common filter: Seller Rating */}
        <div className="border-t border-slate-100 pt-5">
          <span className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Rating Penjual
          </span>
          <RadioGroup value={minRating} onValueChange={setMinRating} className="space-y-1">
            {[
              { value: "all", label: "Semua Rating" },
              { value: "4.5", label: "4.5 ke atas" },
              { value: "4", label: "4.0 ke atas" },
            ].map((option) => (
              <label key={option.value} className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                <RadioItem value={option.value} />
                <span>{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Common filter: Status */}
        <div className="border-t border-slate-100 pt-5">
          <span className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Status Listing
          </span>
          <RadioGroup value={statusFilter} onValueChange={setStatusFilter} className="space-y-1">
            {[
              { value: "AVAILABLE", label: "Tersedia Saja (Ready)" },
              { value: "ALL", label: "Semua (Termasuk Terjual)" },
            ].map((option) => (
              <label key={option.value} className="flex min-h-11 items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                <RadioItem value={option.value} />
                <span>{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>
    );
  };

  return (
    <div id="listings-section" className="relative pb-16 lg:pb-0">
      {/* 1. Main Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="mb-5 flex flex-col items-stretch gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:p-4"
      >
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition-all focus-within:border-blue-500 focus-within:bg-white">
          <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={GAME_FILTER_CONFIG[selectedGame].searchPlaceholder}
            aria-label="Cari akun"
            className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="min-h-8 min-w-8 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Hapus kata kunci"
              aria-label="Hapus kata kunci"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Search size={16} aria-hidden="true" />
          Cari
        </button>
      </form>

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

          {renderFilterFields("desktop-filter")}
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

              {appliedSearch && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium text-[11px]">
                  &quot;{appliedSearch}&quot;
                  <button type="button" onClick={clearSearch} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedGame !== "all" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium text-[11px]">
                  {selectedGame}
                  <button type="button" onClick={() => handleGameChange("all")} className="hover:text-blue-900">
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

              {GAME_FILTER_CONFIG[selectedGame].metric?.kind === "overall" && minOvr !== "all" && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 font-medium text-[11px]">
                  OVR {minOvr}+
                  <button type="button" onClick={() => setMinOvr("all")} className="hover:text-amber-950">
                    <X size={12} />
                  </button>
                </span>
              )}

              {GAME_FILTER_CONFIG[selectedGame].metric?.kind === "league" && selectedLeague !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                  Rank {selectedLeague}+
                  <button type="button" onClick={() => setSelectedLeague("all")} className="hover:text-violet-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedGame !== "all" && selectedLoginMethod !== "all" && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-medium text-[11px]">
                  {selectedLoginMethod}
                  <button type="button" onClick={() => setSelectedLoginMethod("all")} className="hover:text-slate-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {(priceRange[0] !== 50000 || priceRange[1] !== 3000000) && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-medium text-[11px]">
                  {formatRupiah(priceRange[0])} - {formatRupiah(priceRange[1])}
                  <button type="button" onClick={() => setPriceRange([50000, 3000000])} className="hover:text-slate-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {minRating !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  Rating {minRating}+
                  <button type="button" onClick={() => setMinRating("all")} className="hover:text-slate-900">
                    <X size={12} />
                  </button>
                </span>
              )}

              {statusFilter !== "AVAILABLE" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  Semua status
                  <button type="button" onClick={() => setStatusFilter("AVAILABLE")} className="hover:text-slate-900">
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
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 cursor-pointer"
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
          type="button"
          onClick={() => setIsMobileSortOpen(true)}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/20 active:scale-95 cursor-pointer"
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
                  type="button"
                  onClick={resetFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="min-h-11 min-w-11 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Tutup filter"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {renderFilterFields("mobile-filter")}
            </div>

            {/* Modal Footer (Sticky Button) */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-md transition-all hover:bg-blue-700 active:scale-98 cursor-pointer"
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
                type="button"
                onClick={() => setIsMobileSortOpen(false)}
                className="min-h-11 min-w-11 rounded-full p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup pengurutan"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setIsMobileSortOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
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
