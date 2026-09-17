"use client";

/**
 * Unified User Dashboard — Section 17.1
 *
 * "Buyer" dan "Seller" bukan role terpisah.
 * Keduanya adalah konteks aktivitas dari satu akun USER yang sama.
 * Dashboard ini menampilkan dua tab dalam satu halaman:
 *   - "Sebagai Pembeli" → transaksi beli, wishlist, vault akun
 *   - "Sebagai Penjual" → listing, pesanan masuk, tarik saldo
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Store,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  Clock,
  AlertCircle,
  Gamepad2,
  MessageSquare,
  KeyRound,
  Sparkles,
  Heart,
  Printer,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Package,
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  PauseCircle,
  PlayCircle,
  MessageCircle,
  Share2,
  Send,
  History,
  Flame,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { InvoiceModal } from "@/components/dashboard/InvoiceModal";
import { dummyTransactions, dummyListings } from "@/data/dummy";
import { formatRupiah } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import type { Transaction } from "@/types";

type ActiveTab = "buyer" | "seller";
type FilterTab = "ALL" | "ACTION_NEEDED" | "IN_PROGRESS" | "COMPLETED" | "WISHLIST";

// ─── Seller types ──────────────────────────────────────────────────────────────
interface WithdrawalRecord {
  id: string;
  date: string;
  amount: number;
  bank: string;
  accountNumber: string;
  status: "SUCCESS" | "PROCESSING";
}

interface Inquiry {
  id: string;
  listingId: string;
  transactionId?: string;
  listingTitle: string;
  buyerName: string;
  question: string;
  time: string;
  replied?: boolean;
}

const initialWithdrawals: WithdrawalRecord[] = [
  { id: "WD-9941", date: "12 Sep 2026, 14:20 WIB", amount: 1500000, bank: "BCA", accountNumber: "8920192819", status: "SUCCESS" },
  { id: "WD-9812", date: "28 Agu 2026, 19:45 WIB", amount: 950000, bank: "GoPay", accountNumber: "081234567890", status: "SUCCESS" },
];

const initialInquiries: Inquiry[] = [
  { id: "inq_1", listingId: "1", transactionId: "trx_1", listingTitle: "Akun Diamond League 89 OVR Full Squad Legend", buyerName: "Dimas Anggara", question: "Halo gan, Konami ID nya apakah bisa langsung diganti ke email baru saya saat transaksi rekber?", time: "15 mnt lalu", replied: false },
  { id: "inq_2", listingId: "2", transactionId: "trx_2", listingTitle: "Akun eFootball Divisi 1", buyerName: "Rizky_Gamer", question: "Ada Big Time Haaland atau Messi 2022 gan di akun ini?", time: "1 jam lalu", replied: true },
];

function UserDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>("buyer");

  // Sync tab dari URL query param (?tab=seller)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "seller" || tabParam === "buyer") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // ── Buyer state ──────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);
  const [selectedInvoiceTx, setSelectedInvoiceTx] = useState<Transaction | null>(null);
  const [claimModalTx, setClaimModalTx] = useState<Transaction | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(["lst_1", "lst_2"]);
  const [isWarrantyGuideOpen, setIsWarrantyGuideOpen] = useState(false);

  // ── Seller state ─────────────────────────────────────────────────────────────
  const [listingFilter, setListingFilter] = useState<"ALL" | "AVAILABLE" | "SOLD">("ALL");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawContext, setWithdrawContext] = useState<"buyer" | "seller">("buyer");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [selectedBank, setSelectedBank] = useState("BCA");
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("350.000");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(initialWithdrawals);
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [replyInput, setReplyInput] = useState<{ [id: string]: string }>({});

  const initialMine = dummyListings.filter((l) => l.seller.username === "efootball_seller1");
  const [myListings, setMyListings] = useState(initialMine.map((l) => ({ ...l, isPaused: false })));

  // ── Derived data ─────────────────────────────────────────────────────────────
  const activeTx = dummyTransactions.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const completedTx = dummyTransactions.filter((t) => t.status === "COMPLETED");
  const actionRequiredCount = dummyTransactions.filter(
    (t) => t.status === "PENDING_PAYMENT" || t.status === "PENDING_BUYER_CONFIRM"
  ).length;
  const wishlistListings = dummyListings.filter((l) => wishlistIds.includes(l.id));
  const activeListings = myListings.filter((l) => l.status === "AVAILABLE" && !l.isPaused);
  const soldListings = myListings.filter((l) => l.status === "SOLD");
  const activeOrders = dummyTransactions.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const filteredSellerListings = myListings.filter((l) => {
    if (listingFilter === "ALL") return true;
    return l.status === listingFilter;
  });
  const filteredTransactions = dummyTransactions.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "ACTION_NEEDED") return t.status === "PENDING_PAYMENT" || t.status === "PENDING_BUYER_CONFIRM";
    if (filter === "IN_PROGRESS") return !["COMPLETED", "CANCELLED", "PENDING_PAYMENT"].includes(t.status);
    if (filter === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSuccess(true);
    setTimeout(() => { setClaimSuccess(false); setClaimModalTx(null); }, 2000);
  };
  const handleCopyLink = (id: string) => {
    navigator.clipboard?.writeText(window.location.origin + `/listings/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const handleTogglePause = (id: string) => {
    setMyListings((prev) => prev.map((item) => (item.id === id ? { ...item, isPaused: !item.isPaused } : item)));
  };
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = withdrawContext === "buyer" ? 350000 : 2450000;
    const newRecord: WithdrawalRecord = {
      id: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB",
      amount: amountVal,
      bank: selectedBank,
      accountNumber: "8920192819",
      status: "PROCESSING",
    };
    setWithdrawals([newRecord, ...withdrawals]);
    setWithdrawSuccess(true);
    setTimeout(() => { setWithdrawSuccess(false); setIsWithdrawModalOpen(false); }, 2000);
  };
  const { addChatMessage } = useStore();
  const handleSendReply = (inqId: string) => {
    const text = replyInput[inqId]?.trim();
    if (!text) return;
    const targetInq = inquiries.find((i) => i.id === inqId);
    if (targetInq?.transactionId) {
      addChatMessage(targetInq.transactionId, "SELLER", "Rian Pratama", `[Dari Diskusi Listing]: ${text}`, undefined, undefined, true);
    }
    setInquiries((prev) => prev.map((inq) => (inq.id === inqId ? { ...inq, replied: true } : inq)));
    setReplyInput((prev) => ({ ...prev, [inqId]: "" }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="user" />

      <div className="flex-1 space-y-6">

        {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1">
          <button
            onClick={() => setActiveTab("buyer")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === "buyer"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <ShoppingCart size={16} />
            <span>Sebagai Pembeli</span>
            {actionRequiredCount > 0 && activeTab !== "buyer" && (
              <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                {actionRequiredCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("seller")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === "seller"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Store size={16} />
            <span>Sebagai Penjual</span>
            {inquiries.filter(i => !i.replied).length > 0 && activeTab !== "seller" && (
              <span className="w-5 h-5 bg-purple-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                {inquiries.filter(i => !i.replied).length}
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: SEBAGAI PEMBELI
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "buyer" && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Kotakan Panduan Garansi */}
            <div className="group relative overflow-hidden bg-white hover:bg-blue-50/20 rounded-2xl border border-slate-200 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <ShieldCheck size={22} className="stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Proteksi Escrow Rekberin
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Garansi 48 Jam
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">Panduan Garansi & Klaim</h3>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Perlindungan 100% uang kembali dari risiko hackback. Ketahui syarat klaim, alur pengaduan admin, dan tips aman.
                </p>
              </div>
              <Button
                onClick={() => setIsWarrantyGuideOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <ShieldCheck size={15} />
                <span>Klik untuk Panduan Garansi</span>
              </Button>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {filter === "WISHLIST" ? "Daftar Akun Game Disimpan (Wishlist)" : "Daftar Transaksi Pembelian"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {filter === "WISHLIST"
                      ? "Bandingkan akun game incaran dan lakukan checkout langsung lewat rekber resmi."
                      : "Kelola status pesanan, klaim garansi, dan cetak struk pembayaran resmi."}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start sm:self-auto overflow-x-auto">
                  {(["ALL", "ACTION_NEEDED", "IN_PROGRESS", "COMPLETED", "WISHLIST"] as FilterTab[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                        filter === f ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {f === "ALL" && `Semua (${dummyTransactions.length})`}
                      {f === "ACTION_NEEDED" && `Perlu Tindakan (${actionRequiredCount})`}
                      {f === "IN_PROGRESS" && "Diproses"}
                      {f === "COMPLETED" && `Selesai (${completedTx.length})`}
                      {f === "WISHLIST" && `♥ Wishlist (${wishlistIds.length})`}
                    </button>
                  ))}
                </div>
              </div>

              {filter === "WISHLIST" ? (
                <div className="p-4 sm:p-6">
                  {wishlistListings.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">Belum ada akun game yang disimpan di wishlist.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {wishlistListings.map((l) => {
                        const imgSrc = l.images && l.images.length > 0 ? l.images[0] : "/screenshots/efootball_89.jpg";
                        return (
                          <div
                            key={l.id}
                            className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden p-3"
                          >
                            <div>
                              {/* Thumbnail Image */}
                              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgSrc}
                                  alt={l.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                                {/* Game Tag & Heart Button */}
                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                                  <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-black/60 text-white backdrop-blur-md uppercase tracking-wider">
                                    {l.game}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setWishlistIds(wishlistIds.filter((id) => id !== l.id));
                                    }}
                                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-rose-600/90 backdrop-blur-md text-rose-400 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
                                    title="Hapus dari Wishlist"
                                  >
                                    <Heart size={15} className="fill-current" />
                                  </button>
                                </div>

                                {/* Badges on Image Bottom */}
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                                  {l.details.overall ? (
                                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                                      OVR {l.details.overall}
                                    </span>
                                  ) : <span />}
                                  {l.details.isNominus && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                                      <ShieldCheck size={11} /> Nominus
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Title */}
                              <Link href={`/listings/${l.id}`} className="block group-hover:text-blue-600 transition-colors">
                                <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug mb-2">
                                  {l.title}
                                </h4>
                              </Link>

                              {/* Price & Seller */}
                              <div className="flex items-end justify-between gap-2 mt-1 mb-2">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">Harga Akun</span>
                                  <p className="font-black text-slate-900 text-base">{formatRupiah(l.price)}</p>
                                </div>
                                <p className="text-xs text-slate-400 text-right">
                                  Penjual: <span className="text-slate-700 font-semibold">{l.seller.username}</span> • 4.8★
                                </p>
                              </div>
                            </div>

                            <div className="pt-3 mt-1 border-t border-slate-100">
                              <Link href={`/listings/${l.id}`} className="block">
                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9">
                                  Beli Lewat Rekber
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 sm:p-6">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">Tidak ada transaksi pada filter ini.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredTransactions.map((t) => {
                        const doneSteps = t.timeline.filter((s) => s.done).length;
                        const progressPct = Math.round((doneSteps / t.timeline.length) * 100);
                        const isActionRequired = t.status === "PENDING_PAYMENT" || t.status === "PENDING_BUYER_CONFIRM";
                        const isCompleted = t.status === "COMPLETED";
                        const imgSrc = t.listing.images && t.listing.images.length > 0 ? t.listing.images[0] : "/screenshots/efootball_89.jpg";

                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedDetailTx(t)}
                            className={`group rounded-2xl border p-3.5 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                              isActionRequired
                                ? "border-amber-300 bg-amber-50/15 shadow-sm ring-2 ring-amber-400/20"
                                : "border-slate-200 bg-white hover:border-blue-400"
                            }`}
                          >
                            <div>
                              {/* Photo Area */}
                              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgSrc}
                                  alt={t.listing.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                                {/* Top Badges */}
                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md uppercase tracking-wider">
                                    {t.listing.game}
                                  </span>
                                  <span className="text-[11px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md font-semibold">
                                    #{t.id}
                                  </span>
                                </div>

                                {/* Bottom Badges on Image */}
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 gap-2">
                                  <StatusBadge status={t.status} />
                                  {isActionRequired && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm animate-pulse">
                                      <AlertCircle size={11} /> Butuh Tindakan
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                                      <ShieldCheck size={11} /> Garansi 48 Jam
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Title */}
                              <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                                {t.listing.title}
                              </h3>

                              {/* Price & Parties */}
                              <div className="flex items-end justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">Harga Transaksi</span>
                                  <span className="text-base font-black text-slate-900">{formatRupiah(t.price)}</span>
                                </div>
                                <div className="text-right text-[11px] text-slate-500">
                                  <div>Penjual: <strong className="text-slate-700">{t.listing.seller.username}</strong></div>
                                  <div className="text-[10px] text-blue-600 font-semibold">Admin: {t.admin.user.username}</div>
                                </div>
                              </div>
                            </div>

                            <div>
                              {/* Escrow Progress Bar */}
                              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 mb-3">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                                  <span>Alur Escrow: Step {doneSteps}/{t.timeline.length}</span>
                                  <span className="text-blue-600 font-bold">{progressPct}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      isCompleted ? "bg-emerald-500" : isActionRequired ? "bg-amber-500" : "bg-blue-600"
                                    }`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>

                              {/* Click Prompt */}
                              <div className="flex items-center justify-between text-xs font-bold text-blue-600 pt-1 border-t border-slate-100">
                                <span>Lihat Detail Transaksi</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: SEBAGAI PENJUAL
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "seller" && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Kotakan Tarik Saldo */}
            <div className="group relative overflow-hidden bg-white hover:bg-emerald-50/20 rounded-2xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Wallet size={22} className="stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Saldo Hasil Penjualan
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Siap Ditarik
                        </span>
                      </div>
                      <p className="text-2xl font-black text-emerald-600 mt-0.5">Rp 2.450.000</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Hasil penjualan akun game yang telah selesai masa rekber dan siap dicairkan langsung ke rekening bank atau e-wallet Anda.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setWithdrawContext("seller");
                    setWithdrawAmountInput("2.450.000");
                    setIsWithdrawModalOpen(true);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ArrowUpRight size={15} />
                  <span>Klik untuk Tarik Saldo</span>
                </Button>
                <button
                  onClick={() => setShowWithdrawHistory(!showWithdrawHistory)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <History size={14} />
                  <span>{showWithdrawHistory ? "Tutup Log" : "Riwayat"}</span>
                </button>
              </div>
            </div>

            {/* Seller Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dana di Escrow</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">Rp 850.000</p>
                  <span className="text-[11px] text-amber-600 font-medium mt-1 inline-block">Menunggu Konfirmasi</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={22} /></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Listing Aktif</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{activeListings.length}</p>
                  <span className="text-[11px] text-blue-600 font-medium mt-1 inline-block">Tayang di Marketplace</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Package size={22} /></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pertanyaan Masuk</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{inquiries.filter(i => !i.replied).length}</p>
                  <span className="text-[11px] text-purple-600 font-medium mt-1 inline-block">Butuh Dibalas</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><MessageCircle size={22} /></div>
              </div>
            </div>

            {/* Withdrawal History */}
            {showWithdrawHistory && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Riwayat Penarikan Saldo</h3>
                  </div>
                  <button onClick={() => setShowWithdrawHistory(false)} className="text-xs text-slate-400 hover:text-slate-600">Tutup</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-left bg-slate-50">
                        <th className="py-2.5 px-3">ID Penarikan</th>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Tujuan Transfer</th>
                        <th className="py-2.5 px-3">Nominal</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{w.id}</td>
                          <td className="py-3 px-3 text-slate-500">{w.date}</td>
                          <td className="py-3 px-3"><span className="font-bold text-slate-800">{w.bank}</span> <span className="text-slate-400">({w.accountNumber})</span></td>
                          <td className="py-3 px-3 font-black text-slate-900">{formatRupiah(w.amount)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${w.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                              {w.status === "SUCCESS" ? "Berhasil" : "Sedang Diproses"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inquiries */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pertanyaan Calon Pembeli</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Tanggapi cepat untuk menaikkan reputasi</span>
              </div>
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{inq.buyerName}</span>
                        <span className="text-slate-400">• {inq.time}</span>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">{inq.listingTitle}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{inq.question}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/listings/${inq.listingId}`} className="text-[11px] text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 font-semibold">
                          <Eye size={12} /> Lihat Postingan
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link href={`/user/transactions/${inq.transactionId || "trx_1"}`} className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                          <MessageSquare size={12} /> Lanjut di Room Chat Rekber →
                        </Link>
                      </div>
                    </div>
                    {inq.replied ? (
                      <div className="text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 size={13} /> Telah dijawab ke pembeli
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Ketik balasan cepat..."
                          value={replyInput[inq.id] || ""}
                          onChange={(e) => setReplyInput({ ...replyInput, [inq.id]: e.target.value })}
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
                        />
                        <Button size="sm" onClick={() => handleSendReply(inq.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 h-auto font-bold">
                          <Send size={12} className="mr-1" /> Balas
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Escrow Orders */}
            {activeOrders.length > 0 && (
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pesanan & Serah Terima yang Sedang Berjalan</h3>
                  </div>
                  <Link href="/user/transactions">
                    <span className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">Lihat Semua Pesanan →</span>
                  </Link>
                </div>
                <div className="space-y-3">
                  {activeOrders.slice(0, 2).map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{order.listing.game}</span>
                          <p className="font-bold text-slate-800 text-sm">{order.listing.title}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Pembeli: <strong>{order.buyer.username}</strong> • Admin: <strong>{order.admin.user.username}</strong> • {formatRupiah(order.price)}
                        </p>
                      </div>
                      <Link href={`/user/transactions/${order.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Buka Room Serah Terima</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listings Management */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Kelola Katalog Iklan Saya</h2>
                  <p className="text-xs text-slate-400">Gunakan tombol Jeda/Aktifkan untuk menyembunyikan iklan sementara.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                    {(["ALL", "AVAILABLE", "SOLD"] as const).map((f) => (
                      <button key={f} onClick={() => setListingFilter(f)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${listingFilter === f ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}>
                        {f === "ALL" && `Semua (${myListings.length})`}
                        {f === "AVAILABLE" && `Dijual (${activeListings.length})`}
                        {f === "SOLD" && `Terjual (${soldListings.length})`}
                      </button>
                    ))}
                  </div>
                  <Link href="/listings/new">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                      <PlusCircle size={13} className="mr-1" /> Iklan Baru
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {filteredSellerListings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">Tidak ada iklan pada kategori ini.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSellerListings.map((l) => {
                      const imgSrc = l.images && l.images.length > 0 ? l.images[0] : "/screenshots/efootball_89.jpg";
                      return (
                        <div
                          key={l.id}
                          className={`group rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                            l.isPaused
                              ? "border-dashed border-slate-300 opacity-70 bg-slate-50"
                              : "border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg"
                          }`}
                        >
                          {/* Photo */}
                          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgSrc}
                              alt={l.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md uppercase tracking-wider">
                                {l.game}
                              </span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-md ${
                                l.isPaused
                                  ? "bg-amber-500/90 text-white"
                                  : l.status === "AVAILABLE"
                                  ? "bg-emerald-500/90 text-white"
                                  : "bg-slate-600/90 text-white"
                              }`}>
                                {l.isPaused ? "⏸ Dijeda" : l.status === "AVAILABLE" ? "● Aktif" : "✓ Terjual"}
                              </span>
                            </div>

                            {/* OVR bottom */}
                            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                              {l.details.overall ? (
                                <span className="text-[11px] font-black px-2.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                                  OVR {l.details.overall}
                                </span>
                              ) : <span />}
                              <span className="text-[11px] font-bold text-white/90 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                <Eye size={12} /> {l.viewCount}
                              </span>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-3.5 flex flex-col flex-1 justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug mb-2 group-hover:text-emerald-700 transition-colors">
                                {l.title}
                              </h4>
                              <p className="font-black text-slate-900 text-base mb-3">{formatRupiah(l.price)}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-3">
                              {l.status === "AVAILABLE" && (
                                <Button variant="outline" size="sm" onClick={() => handleTogglePause(l.id)} className="text-xs flex-1">
                                  {l.isPaused
                                    ? <><PlayCircle size={13} className="mr-1 text-emerald-600" /> Aktifkan</>
                                    : <><PauseCircle size={13} className="mr-1 text-amber-600" /> Jeda</>}
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleCopyLink(l.id)} className="text-xs flex-1 text-slate-600 hover:text-blue-600">
                                {copiedId === l.id
                                  ? <><Check size={13} className="mr-1 text-emerald-600" /> Tersalin</>
                                  : <><Share2 size={13} className="mr-1" /> Bagikan</>}
                              </Button>
                              <Link href={`/listings/${l.id}`} className="flex-1">
                                <Button variant="secondary" size="sm" className="text-xs w-full">Lihat Iklan</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tarik Saldo Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setWithdrawContext("seller");
                  setWithdrawAmountInput("2.450.000");
                  setIsWithdrawModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
              >
                <ArrowUpRight size={16} className="mr-1.5" /> Tarik Saldo Penjualan
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {selectedDetailTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <Gamepad2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {selectedDetailTx.listing.game}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      #{selectedDetailTx.id}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg leading-snug">
                    {selectedDetailTx.listing.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailTx(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Summary Badges & Price */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">Nilai Transaksi</span>
                  <span className="text-xl font-black text-slate-900">{formatRupiah(selectedDetailTx.price)}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Status Pesanan</span>
                  <StatusBadge status={selectedDetailTx.status} />
                </div>
              </div>

              {/* Roles & Parties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penjual</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">{selectedDetailTx.listing.seller.username}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">★ 4.9 • Terverifikasi</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Escrow Rekber</span>
                  <span className="font-bold text-blue-700 text-xs sm:text-sm mt-0.5 block">{selectedDetailTx.admin.user.username}</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Penengah Resmi Rekberin</span>
                </div>
              </div>

              {/* Garansi Alert if completed */}
              {selectedDetailTx.status === "COMPLETED" && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <strong className="font-bold block">Proteksi Garansi Anti-Hackback 48 Jam Aktif</strong>
                    <span className="text-emerald-700 text-[11px]">Jika ada kendala login atau email ditarik penjual, admin akan bantu klaim refund 100%.</span>
                  </div>
                </div>
              )}

              {/* Timeline Escrow Details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Alur & Tracking Escrow Rekber</h4>
                  <span className="text-[11px] font-bold text-blue-600">
                    {selectedDetailTx.timeline.filter(s => s.done).length} dari {selectedDetailTx.timeline.length} Tahap
                  </span>
                </div>
                <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 ml-2">
                  {selectedDetailTx.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                        step.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                      }`} />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-xs font-bold ${step.done ? "text-slate-900" : "text-slate-400"}`}>
                            {step.label}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {step.done ? "Selesai diverifikasi oleh sistem / admin rekber" : "Menunggu proses alur berikutnya"}
                          </p>
                        </div>
                        {step.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{step.timestamp}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tx = selectedDetailTx;
                    setSelectedDetailTx(null);
                    setSelectedInvoiceTx(tx);
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-blue-600"
                >
                  <Printer size={13} className="mr-1.5" /> Struk Resmi
                </Button>
                {selectedDetailTx.status === "COMPLETED" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const tx = selectedDetailTx;
                      setSelectedDetailTx(null);
                      setClaimModalTx(tx);
                    }}
                    className="text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                  >
                    <AlertCircle size={13} className="mr-1.5 text-amber-600" /> Klaim Garansi
                  </Button>
                )}
              </div>
              <Link href={`/user/transactions/${selectedDetailTx.id}`} className="flex-1 sm:flex-initial">
                <Button
                  size="sm"
                  className={`w-full sm:w-auto text-xs font-bold ${
                    selectedDetailTx.status === "PENDING_PAYMENT"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <MessageSquare size={13} className="mr-1.5" />
                  {selectedDetailTx.status === "PENDING_PAYMENT"
                    ? "Bayar & Buka Chat"
                    : selectedDetailTx.status === "PENDING_BUYER_CONFIRM"
                    ? "Cek Akun & Konfirmasi"
                    : "Buka Room Transaksi"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {selectedInvoiceTx && (
        <InvoiceModal transaction={selectedInvoiceTx} onClose={() => setSelectedInvoiceTx(null)} />
      )}

      {claimModalTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setClaimModalTx(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center"><ShieldCheck size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Klaim Garansi Anti-Hackback</h3>
                <p className="text-xs text-slate-400">Transaksi #{claimModalTx.id.slice(-6)}</p>
              </div>
            </div>
            {claimSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><Check size={24} /></div>
                <h4 className="font-bold text-slate-900 text-sm">Klaim Garansi Diajukan!</h4>
                <p className="text-xs text-slate-500">Admin Rekber {claimModalTx.admin.user.username} akan segera menghubungi Anda di room transaksi.</p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Kendala Akun</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option>Akun di-hackback / password berubah tiba-tiba</option>
                    <option>Email pertama tidak bisa diganti</option>
                    <option>Spesifikasi pemain tidak sesuai deskripsi iklan</option>
                    <option>Akun terkena sanksi suspend / banned</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deskripsi Detail Masalah</label>
                  <textarea rows={3} placeholder="Jelaskan kronologi kendala yang kamu alami..." className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600" required />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2">Kirim Laporan Garansi ke Admin</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsWithdrawModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X size={18} /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Wallet size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {withdrawContext === "buyer" ? "Tarik Saldo Rekber & Refund" : "Tarik Saldo Penjualan"}
                </h3>
                <p className="text-xs text-slate-400">
                  Saldo tersedia: {withdrawContext === "buyer" ? "Rp 350.000" : "Rp 2.450.000"}
                </p>
              </div>
            </div>
            {withdrawSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><Check size={28} /></div>
                <h4 className="font-bold text-slate-900 text-lg">Permintaan Penarikan Berhasil!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Dana {withdrawContext === "buyer" ? "Rp 350.000" : "Rp 2.450.000"} sedang diproses ke rekening {selectedBank} milikmu (5-15 menit).
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Pilih Rekening Tujuan:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["BCA", "Mandiri", "GoPay", "DANA"].map((bank) => (
                      <button type="button" key={bank} onClick={() => setSelectedBank(bank)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${selectedBank === bank ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        <span>{bank}</span>
                        {selectedBank === bank && <Check size={14} className="text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor Rekening / E-Wallet:</label>
                  <input type="text" defaultValue="8920192819" className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Jumlah Penarikan (Rp):</label>
                  <input type="text" value={withdrawAmountInput} onChange={(e) => setWithdrawAmountInput(e.target.value)} className="w-full text-xs font-black px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600" required />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5">Konfirmasi Penarikan Saldo</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Panduan Garansi Modal ──────────────────────────────────────────────── */}
      {isWarrantyGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner">
                  <ShieldCheck size={26} className="stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100">
                      Garansi Resmi Rekberin
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                      100% Proteksi
                    </span>
                  </div>
                  <h3 className="font-black text-xl text-white">Panduan Garansi Anti-Hackback 48 Jam</h3>
                  <p className="text-xs text-blue-100/90 mt-0.5">
                    Perlindungan penuh untuk transaksi beli akun game dengan jaminan uang kembali.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWarrantyGuideOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                    <Clock size={16} />
                    <span>Masa 48 Jam</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Garansi otomatis aktif tepat saat serah terima akun selesai dan dikonfirmasi pembeli.
                  </p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                    <CheckCircle2 size={16} />
                    <span>100% Refund</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Pengembalian saldo penuh jika akun ditarik kembali atau di-hackback penjual.
                  </p>
                </div>
                <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
                    <AlertCircle size={16} />
                    <span>Respon &lt; 2 Jam</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Admin rekber berlisensi resmi langsung menangani sengketa dan membekukan dana seller.
                  </p>
                </div>
              </div>

              {/* Detail Sections */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">1</span>
                    Cakupan yang Dijamin Garansi
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 pl-8 list-disc">
                    <li>
                      <strong className="text-slate-800">Hackback / Pemulihan Akun:</strong> Akun di-recover atau password diubah paksa oleh penjual/pemilik pertama dalam masa 48 jam.
                    </li>
                    <li>
                      <strong className="text-slate-800">Spesifikasi Tidak Sesuai:</strong> Item, squad, atau level game berbeda fatal dengan apa yang diiklankan di listing.
                    </li>
                    <li>
                      <strong className="text-slate-800">Sanksi Banned Sebelumnya:</strong> Akun terkena suspend akibat pelanggaran yang dilakukan penjual sebelum transaksi.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">2</span>
                    Alur Cara Klaim Garansi
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-black text-blue-600 bg-white border border-blue-200 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">A</span>
                      <p className="text-xs text-slate-700">
                        Buka transaksi di <strong>Dashboard User (Sebagai Pembeli)</strong> dan klik tombol <strong>Klaim Garansi</strong> pada kartu pesanan yang telah selesai.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-black text-blue-600 bg-white border border-blue-200 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">B</span>
                      <p className="text-xs text-slate-700">
                        Unggah bukti otentik seperti screenshot gagal login, email notifikasi pengubahan email pemulihan, atau riwayat login yang mencurigakan.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-black text-blue-600 bg-white border border-blue-200 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">C</span>
                      <p className="text-xs text-slate-700">
                        Admin Rekber resmi akan memverifikasi. Jika terbukti valid, dana langsung ditransfer kembali ke Saldo Rekber Anda dan siap ditarik kapan saja.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1.5 mb-1.5">
                    <AlertCircle size={14} className="text-amber-600" />
                    Ketentuan Penting Menjaga Keabsahan Garansi
                  </h5>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Pembeli wajib segera mengganti password, email pemulihan, dan mengaktifkan verifikasi 2 langkah (2FA) saat serah terima. Garansi tidak berlaku jika pembeli menggunakan cheat/aplikasi ilegal pihak ketiga atau membagikan kredensial ke pihak lain di luar Rekberin.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <Link href="/tentang-kami">
                <Button variant="secondary" size="sm" className="text-xs font-semibold text-slate-600">
                  Pelajari Selengkapnya di FAQ →
                </Button>
              </Link>
              <Button
                onClick={() => setIsWarrantyGuideOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2"
              >
                Mengerti & Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Memuat Dashboard...</p>
        </div>
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  );
}
