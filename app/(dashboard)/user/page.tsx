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

import { useState, useEffect, useMemo, Suspense } from "react";
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
  Receipt,
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
  Search,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Pencil,
  Loader2,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { InvoiceModal } from "@/components/dashboard/InvoiceModal";
import { dummyListings } from "@/data/dummy";
import { formatRupiah } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTransactions } from "@/hooks/useTransactions";
import { useListings, useMyListings, updateListingStatus } from "@/hooks/useListings";
import { mapTransactionApiToViewModel } from "@/lib/transaction-view-model";
import { toast } from "sonner";
import type { Listing } from "@/types";
import type { TransactionViewModel } from "@/types/transaction-view-model";

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
  game?: string;
  price?: number;
  buyerName: string;
  buyerAvatar?: string;
  question: string;
  time: string;
  replied?: boolean;
  replyText?: string;
  replyTime?: string;
}

const initialWithdrawals: WithdrawalRecord[] = [
  { id: "WD-9941", date: "12 Sep 2026, 14:20 WIB", amount: 1500000, bank: "BCA", accountNumber: "8920192819", status: "SUCCESS" },
  { id: "WD-9812", date: "28 Agu 2026, 19:45 WIB", amount: 950000, bank: "GoPay", accountNumber: "081234567890", status: "SUCCESS" },
];

const initialInquiries: Inquiry[] = [
  {
    id: "inq_1",
    listingId: "lst_1",
    transactionId: "trx_1",
    listingTitle: "Akun Diamond League 89 OVR Full Squad Legend",
    game: "eFootball 2026",
    price: 850000,
    buyerName: "Dimas Anggara",
    question: "Halo gan, Konami ID nya apakah bisa langsung diganti ke email baru saya saat transaksi rekber?",
    time: "15 mnt lalu",
    replied: false,
  },
  {
    id: "inq_2",
    listingId: "lst_2",
    transactionId: "trx_2",
    listingTitle: "Akun eFootball Divisi 1 Booster Epics",
    game: "eFootball 2026",
    price: 350000,
    buyerName: "Rizky_Gamer",
    question: "Ada Big Time Haaland atau Messi 2022 gan di akun ini?",
    time: "1 jam lalu",
    replied: true,
    replyText: "Halo gan, ada Big Time Messi 2022 booster + BT Haaland max level. Silakan cek detail di postingan ya!",
    replyTime: "45 mnt lalu",
  },
  {
    id: "inq_3",
    listingId: "lst_3",
    transactionId: "trx_1",
    listingTitle: "Akun MLBB Sultan 140+ Skin Collector & Legend",
    game: "Mobile Legends",
    price: 1250000,
    buyerName: "Kevin_MLBB",
    question: "Skin Collector Granger sama Legend Gusion ada gak gan? All unbind kan?",
    time: "2 jam lalu",
    replied: false,
  },
  {
    id: "inq_4",
    listingId: "lst_4",
    transactionId: "trx_1",
    listingTitle: "Akun Genshin Impact AR 58 C6 Furina + Sig",
    game: "Genshin Impact",
    price: 1750000,
    buyerName: "Aditya_Store",
    question: "Bisa nego tipis gak bang untuk akun Genshin AR 58 ini? Langsung gas checkout rekber malam ini.",
    time: "3 jam lalu",
    replied: false,
  },
  {
    id: "inq_5",
    listingId: "lst_2",
    transactionId: "trx_2",
    listingTitle: "Akun eFootball Divisi 1 Booster Epics",
    game: "eFootball 2026",
    price: 350000,
    buyerName: "Fajar_Gans",
    question: "Apakah akun ini pernah kena suspend atau warning dari developer sebelumnya?",
    time: "5 jam lalu",
    replied: true,
    replyText: "Akun 100% aman dan bersih dari riwayat warning/suspend gan, bergaransi penuh dari Rekberin.",
    replyTime: "4 jam lalu",
  },
  {
    id: "inq_6",
    listingId: "lst_1",
    transactionId: "trx_1",
    listingTitle: "Akun Free Fire Old Season 1 Elite Pass Sakura",
    game: "Free Fire",
    price: 920000,
    buyerName: "Brandon99",
    question: "Akun FF Old Season 1 ini bundle Sakura sama Hip Hop asli unbind FB atau VK?",
    time: "1 hari lalu",
    replied: true,
    replyText: "Halo, login single bind Google Play, data bisa dipindah total ke email pribadi Anda ya.",
    replyTime: "1 hari lalu",
  },
];

const quickReplies = [
  "Halo gan, akun masih ready & siap langsung diproses via Rekberin!",
  "Data login bisa langsung dipindah ke email baru saat proses serah terima.",
  "Akun 100% aman, all unbind, dan bergaransi resmi anti-hackback.",
  "Bisa langsung gas checkout rekber resmi agar akun segera diamankan admin!",
];

function UserDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>("buyer");
  const [buyerView, setBuyerView] = useState<"overview" | "warranty">("overview");
  const [sellerView, setSellerView] = useState<"overview" | "chat" | "orders" | "withdraw">("overview");

  // Sync tab & view dari URL query param (?tab=seller&view=chat atau ?tab=seller&view=withdraw atau ?view=warranty)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const viewParam = searchParams.get("view");
    if (tabParam === "seller" || tabParam === "buyer") {
      setActiveTab(tabParam);
    }
    if (viewParam === "warranty") {
      setActiveTab("buyer");
      setBuyerView("warranty");
    } else {
      setBuyerView("overview");
    }
    if (viewParam === "withdraw") {
      setActiveTab("seller");
      setSellerView("withdraw");
    } else if (viewParam === "chat" || viewParam === "orders" || viewParam === "overview") {
      setSellerView(viewParam);
    } else if (!viewParam) {
      setSellerView("overview");
    }
  }, [searchParams]);

  // ── Buyer state ──────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [buyerSearchQuery, setBuyerSearchQuery] = useState("");
  const [selectedDetailTx, setSelectedDetailTx] = useState<TransactionViewModel | null>(null);
  const [selectedInvoiceTx, setSelectedInvoiceTx] = useState<TransactionViewModel | null>(null);
  const [claimModalTx, setClaimModalTx] = useState<TransactionViewModel | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(["lst_1", "lst_2"]);
  const [isWarrantyGuideOpen, setIsWarrantyGuideOpen] = useState(false);

  // ── Seller state ─────────────────────────────────────────────────────────────
  const [listingFilter, setListingFilter] = useState<"ALL" | "AVAILABLE" | "INACTIVE" | "SOLD">("ALL");
  const [sellerListingSearch, setSellerListingSearch] = useState("");
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
  const [inquirySearch, setInquirySearch] = useState("");
  const [inquiryFilter, setInquiryFilter] = useState<"ALL" | "UNREPLIED" | "REPLIED">("ALL");
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>("inq_1");
  const [mobileInquiryView, setMobileInquiryView] = useState<"list" | "chat">("list");

  // Fetch real user & listings & transactions from API
  const { data: currentUser } = useCurrentUser();
  const { data: rawTransactions, isLoading: isTxLoading, error: txError, refetch: refetchTransactions } = useTransactions();
  const { data: allMarketListings } = useListings();
  const { data: apiMyListings, isLoading: isMyListingsLoading, error: myListingsError, refetch: refetchMyListings } = useMyListings();
  const myListings = apiMyListings;

  const transactions = useMemo(
    () => rawTransactions.map(mapTransactionApiToViewModel),
    [rawTransactions]
  );

  // ── Derived data ─────────────────────────────────────────────────────────────
  const buyerTransactions = useMemo(() => {
    if (!currentUser?.id) return transactions;
    return transactions.filter((t) => t.buyer.id === currentUser.id);
  }, [transactions, currentUser?.id]);

  const activeTx = buyerTransactions.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const completedTx = buyerTransactions.filter((t) => t.status === "COMPLETED");
  const inProgressTx = buyerTransactions.filter(
    (t) => !["COMPLETED", "CANCELLED", "PENDING_PAYMENT"].includes(t.status)
  );
  const actionRequiredCount = buyerTransactions.filter(
    (t) => t.status === "PENDING_PAYMENT" || t.status === "PENDING_BUYER_CONFIRM"
  ).length;

  const listingsSource = allMarketListings.length > 0 ? allMarketListings : dummyListings;
  const wishlistListings = useMemo(() => {
    const base = listingsSource.filter((l) => wishlistIds.includes(l.id));
    if (!buyerSearchQuery.trim()) return base;
    const q = buyerSearchQuery.toLowerCase();
    return base.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.game.toLowerCase().includes(q) ||
        l.seller.username.toLowerCase().includes(q)
    );
  }, [listingsSource, wishlistIds, buyerSearchQuery]);

  const activeListings = myListings.filter((l) => l.status === "AVAILABLE");
  const inactiveListings = myListings.filter((l) => l.status === "INACTIVE");
  const soldListings = myListings.filter((l) => l.status === "SOLD");

  const activeOrders = useMemo(() => {
    if (!currentUser?.id) {
      return transactions.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
    }
    return transactions.filter(
      (t) => t.listing.seller.id === currentUser.id && !["COMPLETED", "CANCELLED"].includes(t.status)
    );
  }, [transactions, currentUser?.id]);

  const filteredSellerListings = myListings.filter((l) => {
    if (listingFilter !== "ALL" && l.status !== listingFilter) return false;
    if (sellerListingSearch.trim()) {
      const q = sellerListingSearch.toLowerCase();
      return (
        l.id.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.game.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredTransactions = buyerTransactions.filter((t) => {
    if (filter === "ACTION_NEEDED" && !(t.status === "PENDING_PAYMENT" || t.status === "PENDING_BUYER_CONFIRM")) {
      return false;
    }
    if (filter === "IN_PROGRESS" && ["COMPLETED", "CANCELLED", "PENDING_PAYMENT"].includes(t.status)) {
      return false;
    }
    if (filter === "COMPLETED" && t.status !== "COMPLETED") {
      return false;
    }

    if (buyerSearchQuery.trim()) {
      const q = buyerSearchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.listing.title.toLowerCase().includes(q) ||
        t.listing.game.toLowerCase().includes(q) ||
        t.listing.seller.username.toLowerCase().includes(q)
      );
    }
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const handleTogglePause = async (id: string, currentStatus: string) => {
    setTogglingId(id);
    try {
      const newStatus = currentStatus === "AVAILABLE" ? "INACTIVE" : "AVAILABLE";
      await updateListingStatus(id, newStatus as "INACTIVE" | "AVAILABLE");
      toast.success(newStatus === "INACTIVE" ? "Listing dinonaktifkan." : "Listing diaktifkan kembali.");
      refetchMyListings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status listing.");
    } finally {
      setTogglingId(null);
    }
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
  const handleSendReply = (inqId: string, customText?: string) => {
    const text = (customText || replyInput[inqId] || "").trim();
    if (!text) return;
    const targetInq = inquiries.find((i) => i.id === inqId);
    if (targetInq?.transactionId) {
      addChatMessage(
        targetInq.transactionId,
        "SELLER",
        currentUser?.fullName || currentUser?.username || "Penjual",
        `[Dari Diskusi Listing]: ${text}`,
        undefined,
        undefined,
        true
      );
    }
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inqId
          ? {
            ...inq,
            replied: true,
            replyText: text,
            replyTime: "Baru saja",
          }
          : inq
      )
    );
    setReplyInput((prev) => ({ ...prev, [inqId]: "" }));
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryFilter === "UNREPLIED" && inq.replied) return false;
    if (inquiryFilter === "REPLIED" && !inq.replied) return false;
    if (inquirySearch.trim()) {
      const q = inquirySearch.toLowerCase();
      const matchName = inq.buyerName.toLowerCase().includes(q);
      const matchTitle = inq.listingTitle.toLowerCase().includes(q);
      const matchQuestion = inq.question.toLowerCase().includes(q);
      const matchGame = inq.game?.toLowerCase().includes(q);
      return matchName || matchTitle || matchQuestion || matchGame;
    }
    return true;
  });

  const selectedInquiry = inquiries.find((i) => i.id === selectedInquiryId) || inquiries[0];
  const unrepliedInquiriesCount = inquiries.filter((i) => !i.replied).length;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
      <DashboardSidebar
        role="user"
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          const url = new URL(window.location.href);
          if (tab === "seller") {
            url.searchParams.set("tab", "seller");
          } else {
            url.searchParams.delete("tab");
          }
          window.history.pushState({}, "", url.toString());
        }}
        actionRequiredCount={actionRequiredCount}
        unrepliedCount={inquiries.filter((i) => !i.replied).length}
      />

      <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: SEBAGAI PEMBELI
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "buyer" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {buyerView === "warranty" ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => setBuyerView("overview")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Transaksi</span>
                  </button>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium hidden sm:block">Panduan Resmi Proteksi Escrow Rekberin</span>
                </div>

                {/* Main Warranty Card */}
                <div className="overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-inner">
                        <ShieldCheck size={32} className="stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100">
                            Proteksi Escrow Rekberin
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                            Garansi 48 Jam
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Panduan Garansi Anti-Hackback</h2>
                        <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl leading-relaxed">
                          Perlindungan 100% uang kembali dari risiko hackback atau sengketa akun game. Ketahui hak, syarat klaim, dan alur perlindungan dana Anda.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsWarrantyGuideOpen(true)}
                      className="bg-white hover:bg-blue-50 text-blue-800 font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer shrink-0"
                    >
                      <ShieldCheck size={16} />
                      <span>Buka Modal Lengkap</span>
                    </Button>
                  </div>
                </div>

                {/* Highlight Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                      <Clock size={18} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Masa Garansi 48 Jam</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Garansi otomatis aktif tepat saat serah terima akun selesai dan dikonfirmasi oleh pembeli.
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                      <CheckCircle2 size={18} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">100% Uang Kembali (Refund)</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Pengembalian dana penuh langsung ke saldo rekber Anda jika akun ditarik kembali oleh penjual.
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
                      <AlertCircle size={18} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Respon Cepat Admin &lt; 2 Jam</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Admin rekber berlisensi resmi langsung membekukan saldo penjual dan menangani sengketa Anda.
                    </p>
                  </div>
                </div>

                {/* Detailed Steps & Terms */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">1</span>
                      Cakupan yang Dijamin Garansi
                    </h3>
                    <ul className="text-xs text-slate-600 space-y-2 pl-8 list-disc">
                      <li>
                        <strong className="text-slate-800">Hackback / Pemulihan Akun:</strong> Akun di-recover atau password diubah paksa oleh penjual/pemilik pertama dalam masa 48 jam.
                      </li>
                      <li>
                        <strong className="text-slate-800">Spesifikasi Tidak Sesuai:</strong> Item, squad, atau level game berbeda fatal dengan apa yang ditulis di deskripsi post akun.
                      </li>
                      <li>
                        <strong className="text-slate-800">Sanksi Banned Sebelumnya:</strong> Akun terkena suspend akibat pelanggaran yang dilakukan penjual sebelum transaksi berlangsung.
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">2</span>
                      Alur Cara Klaim Garansi
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-black text-blue-600 bg-white border border-blue-200 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">A</span>
                        <p className="text-xs text-slate-700">
                          Buka riwayat transaksi di <strong>Dashboard User</strong> dan klik tombol <strong>Klaim Garansi</strong> pada kartu pesanan yang telah tuntas.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-black text-blue-600 bg-white border border-blue-200 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">B</span>
                        <p className="text-xs text-slate-700">
                          Unggah bukti otentik seperti screenshot gagal login, notifikasi pergantian email pemulihan dari developer, atau log mencurigakan.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-black text-blue-600 bg-white border border-blue-200 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">C</span>
                        <p className="text-xs text-slate-700">
                          Admin Rekber resmi akan melakukan investigasi. Jika terbukti benar hackback, dana escrow langsung di-refund ke Saldo Rekber Anda.
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
                      Pembeli wajib segera mengganti password, email pemulihan, dan mengaktifkan verifikasi 2 langkah (2FA) saat serah terima. Garansi tidak berlaku jika pembeli menggunakan cheat/aplikasi ilegal pihak ketiga atau membagikan kredensial ke pihak lain di luar platform Rekberin.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Transactions List with Premium Design */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  {/* Top Header Banner */}
                  <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-blue-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Title & Icon Area */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                          {filter === "WISHLIST" ? (
                            <Heart size={22} className="fill-current text-rose-200" />
                          ) : (
                            <ShoppingCart size={22} className="stroke-[2.2]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              {filter === "WISHLIST"
                                ? "Koleksi Akun Impian (Wishlist)"
                                : "Daftar Transaksi Pembelian"}
                            </h2>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 tracking-wider">
                              Escrow Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {filter === "WISHLIST"
                              ? "Daftar akun game favorit yang Anda simpan untuk dipantau atau dibeli nanti."
                              : "Pantau alur escrow rekber, konfirmasi serah terima akun, dan klaim garansi perlindungan dana."}
                          </p>
                        </div>
                      </div>

                      {/* Right Actions: Quick Search */}
                      <div className="w-full sm:w-72">
                        <div className="relative w-full">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={buyerSearchQuery}
                            onChange={(e) => setBuyerSearchQuery(e.target.value)}
                            placeholder={filter === "WISHLIST" ? "Cari wishlist game..." : "Cari ID transaksi, game, seller..."}
                            className="w-full text-xs pl-9 pr-7 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                          />
                          {buyerSearchQuery && (
                            <button
                              onClick={() => setBuyerSearchQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
                              title="Hapus pencarian"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Filter Tabs Navigation (Segmented Controls) */}
                    <div className="mt-4 pt-4 border-t border-slate-100/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                      <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0">
                        {/* Tab: SEMUA */}
                        <button
                          onClick={() => setFilter("ALL")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            filter === "ALL"
                              ? "bg-white text-blue-700 shadow-xs border border-blue-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <Receipt size={14} className={filter === "ALL" ? "text-blue-600" : "text-slate-400"} />
                          <span>Semua</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                              filter === "ALL" ? "bg-blue-100 text-blue-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {buyerTransactions.length}
                          </span>
                        </button>

                        {/* Tab: PERLU TINDAKAN */}
                        <button
                          onClick={() => setFilter("ACTION_NEEDED")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            filter === "ACTION_NEEDED"
                              ? "bg-white text-amber-700 shadow-xs border border-amber-300 ring-2 ring-amber-400/20"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <AlertCircle
                            size={14}
                            className={actionRequiredCount > 0 ? "text-amber-500 animate-pulse" : "text-slate-400"}
                          />
                          <span>Perlu Tindakan</span>
                          {actionRequiredCount > 0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-amber-500 text-white animate-pulse">
                              {actionRequiredCount}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-500">
                              0
                            </span>
                          )}
                        </button>

                        {/* Tab: DIPROSES */}
                        <button
                          onClick={() => setFilter("IN_PROGRESS")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            filter === "IN_PROGRESS"
                              ? "bg-white text-indigo-700 shadow-xs border border-indigo-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <Clock size={14} className={filter === "IN_PROGRESS" ? "text-indigo-600" : "text-slate-400"} />
                          <span>Diproses</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              filter === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {inProgressTx.length}
                          </span>
                        </button>

                        {/* Tab: SELESAI */}
                        <button
                          onClick={() => setFilter("COMPLETED")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            filter === "COMPLETED"
                              ? "bg-white text-emerald-700 shadow-xs border border-emerald-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <CheckCircle2 size={14} className={filter === "COMPLETED" ? "text-emerald-600" : "text-slate-400"} />
                          <span>Selesai</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              filter === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {completedTx.length}
                          </span>
                        </button>

                        {/* Tab: WISHLIST */}
                        <button
                          onClick={() => setFilter("WISHLIST")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            filter === "WISHLIST"
                              ? "bg-white text-rose-700 shadow-xs border border-rose-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <Heart
                            size={14}
                            className={filter === "WISHLIST" ? "text-rose-600 fill-current" : "text-slate-400"}
                          />
                          <span>Wishlist</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              filter === "WISHLIST" ? "bg-rose-100 text-rose-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {wishlistIds.length}
                          </span>
                        </button>
                      </div>
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
                  {isTxLoading ? (
                    <div className="text-center py-12 flex flex-col items-center gap-3">
                      <Loader2 size={28} className="animate-spin text-blue-600" />
                      <p className="text-sm text-slate-500">Memuat transaksi...</p>
                    </div>
                  ) : txError ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-red-500 mb-3">{txError}</p>
                      <Button variant="outline" size="sm" onClick={() => refetchTransactions()}>Coba Lagi</Button>
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">Tidak ada transaksi pada filter ini.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
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
                            className={`group rounded-2xl border p-3.5 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${isActionRequired
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
                                    className={`h-full transition-all duration-300 ${isCompleted ? "bg-emerald-500" : isActionRequired ? "bg-amber-500" : "bg-blue-600"
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
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: SEBAGAI PENJUAL
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "seller" && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* VIEW 1: OVERVIEW & LISTINGS */}
            {sellerView === "overview" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Listings Management with Premium Design */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  {/* Top Header Banner */}
                  <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-emerald-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Title & Icon Area */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                          <Package size={22} className="stroke-[2.2]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              Kelola Katalog Post Akun Saya
                            </h2>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 tracking-wider">
                              Seller Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Pantau keaktifan akun game yang Anda pasang, ubah harga, atau jeda sementara iklan.
                          </p>
                        </div>
                      </div>

                      {/* Right Actions: Live Search */}
                      <div className="w-full sm:w-72">
                        <div className="relative w-full">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={sellerListingSearch}
                            onChange={(e) => setSellerListingSearch(e.target.value)}
                            placeholder="Cari judul iklan, game, ID..."
                            className="w-full text-xs pl-9 pr-7 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400"
                          />
                          {sellerListingSearch && (
                            <button
                              onClick={() => setSellerListingSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
                              title="Hapus pencarian"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Filter Tabs Navigation (Segmented Controls) */}
                    <div className="mt-4 pt-4 border-t border-slate-100/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                      <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0">
                        {/* Tab: SEMUA */}
                        <button
                          onClick={() => setListingFilter("ALL")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            listingFilter === "ALL"
                              ? "bg-white text-emerald-800 shadow-xs border border-emerald-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <Package size={14} className={listingFilter === "ALL" ? "text-emerald-600" : "text-slate-400"} />
                          <span>Semua</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                              listingFilter === "ALL" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {myListings.length}
                          </span>
                        </button>

                        {/* Tab: DIJUAL / AKTIF */}
                        <button
                          onClick={() => setListingFilter("AVAILABLE")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            listingFilter === "AVAILABLE"
                              ? "bg-white text-emerald-700 shadow-xs border border-emerald-300 ring-2 ring-emerald-400/20"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <PlayCircle size={14} className={listingFilter === "AVAILABLE" ? "text-emerald-600" : "text-slate-400"} />
                          <span>Aktif Dijual</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              listingFilter === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {activeListings.length}
                          </span>
                        </button>

                        {/* Tab: DIJEDA */}
                        <button
                          onClick={() => setListingFilter("INACTIVE")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            listingFilter === "INACTIVE"
                              ? "bg-white text-amber-700 shadow-xs border border-amber-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <PauseCircle size={14} className={listingFilter === "INACTIVE" ? "text-amber-500" : "text-slate-400"} />
                          <span>Dijeda</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              listingFilter === "INACTIVE" ? "bg-amber-100 text-amber-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {inactiveListings.length}
                          </span>
                        </button>

                        {/* Tab: TERJUAL */}
                        <button
                          onClick={() => setListingFilter("SOLD")}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            listingFilter === "SOLD"
                              ? "bg-white text-slate-800 shadow-xs border border-slate-300"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          }`}
                        >
                          <CheckCircle2 size={14} className={listingFilter === "SOLD" ? "text-slate-700" : "text-slate-400"} />
                          <span>Terjual</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              listingFilter === "SOLD" ? "bg-slate-200 text-slate-700" : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {soldListings.length}
                          </span>
                        </button>
                      </div>

                      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span>Total Nilai Aset: <strong className="text-slate-800">{formatRupiah(myListings.reduce((sum, l) => sum + (l.status === 'AVAILABLE' ? l.price : 0), 0))}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    {isMyListingsLoading ? (
                      <div className="text-center py-12 flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-emerald-600" />
                        <p className="text-sm text-slate-500">Memuat katalog iklan...</p>
                      </div>
                    ) : myListingsError ? (
                      <div className="text-center py-12">
                        <p className="text-sm text-red-500 mb-3">{myListingsError}</p>
                        <Button variant="outline" size="sm" onClick={() => refetchMyListings()}>Coba Lagi</Button>
                      </div>
                    ) : filteredSellerListings.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        {myListings.length === 0
                          ? "Belum ada iklan. Buat iklan pertamamu!"
                          : "Tidak ada iklan pada kategori ini."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                        {filteredSellerListings.map((l) => {
                          const imgSrc = l.images && l.images.length > 0 ? l.images[0] : "/screenshots/efootball_89.jpg";
                          return (
                            <div
                              key={l.id}
                              className={`group rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-200 ${l.status === "INACTIVE"
                                  ? "border-dashed border-slate-300 opacity-70 bg-slate-50"
                                  : "border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg"
                                }`}
                            >
                              {/* Photo */}
                              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                                {/* Ambient blurred backdrop to fill empty space seamlessly */}
                                <img
                                  src={imgSrc}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                                />
                                {/* Main Image (Crisp & Uncropped) */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgSrc}
                                  alt={l.title}
                                  className="relative z-1 w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.02]"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-2" />

                                {/* Top Badges */}
                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md uppercase tracking-wider">
                                    {l.game}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-md ${l.status === "INACTIVE"
                                      ? "bg-amber-500/90 text-white"
                                      : l.status === "AVAILABLE"
                                        ? "bg-emerald-500/90 text-white"
                                        : "bg-slate-600/90 text-white"
                                    }`}>
                                    {l.status === "INACTIVE" ? "⏸ Dijeda" : l.status === "AVAILABLE" ? "● Aktif" : "✓ Terjual"}
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
                                <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3">
                                  {(l.status === "AVAILABLE" || l.status === "INACTIVE") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTogglePause(l.id, l.status)}
                                      disabled={togglingId === l.id}
                                      className="text-xs w-full"
                                    >
                                      {togglingId === l.id ? (
                                        <><Loader2 size={13} className="mr-1 animate-spin" /> Proses...</>
                                      ) : l.status === "INACTIVE" ? (
                                        <><PlayCircle size={13} className="mr-1 text-emerald-600" /> Aktifkan</>
                                      ) : (
                                        <><PauseCircle size={13} className="mr-1 text-amber-600" /> Jeda</>
                                      )}
                                    </Button>
                                  )}
                                  {(l.status === "AVAILABLE" || l.status === "INACTIVE") && (
                                    <Link href={`/listings/${l.id}/edit`} className="w-full">
                                      <Button variant="outline" size="sm" className="text-xs w-full text-blue-600 hover:text-blue-700">
                                        <Pencil size={13} className="mr-1" /> Edit
                                      </Button>
                                    </Link>
                                  )}
                                  <Button variant="outline" size="sm" onClick={() => handleCopyLink(l.id)} className="text-xs w-full text-slate-600 hover:text-blue-600">
                                    {copiedId === l.id
                                      ? <><Check size={13} className="mr-1 text-emerald-600" /> Tersalin</>
                                      : <><Share2 size={13} className="mr-1" /> Bagikan</>}
                                  </Button>
                                  <Link href={`/listings/${l.id}`} className={`w-full ${(l.status === "AVAILABLE" || l.status === "INACTIVE") ? "" : "col-span-2"}`}>
                                    <Button variant="secondary" size="sm" className="text-xs w-full">Lihat Post Akun</Button>
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
              </div>
            )}

            {/* VIEW 2: FULL CHAT CONSOLE */}
            {sellerView === "chat" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => setSellerView("overview")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Ringkasan</span>
                  </button>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium hidden sm:block">Mode Pusat Diskusi & Chat Calon Pembeli</span>
                </div>

                {/* Inquiries — Modern Split Inbox Console */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="shrink-0 p-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-50/50 via-white to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pusat Diskusi & Chat Calon Pembeli</h3>
                          {unrepliedInquiriesCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 animate-pulse">
                              {unrepliedInquiriesCount} Butuh Balasan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Semua Terjawab
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">Tanggapi cepat pertanyaan calon pembeli untuk menaikkan reputasi dan mempercepat penjualan akun.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Total:</span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{inquiries.length} Percakapan</span>
                    </div>
                  </div>

                  {/* Master-Detail 2-Panel Area: Fixed height h-[560px] with min-h-0 for proper inner scroll */}
                  <div className="flex flex-col md:flex-row h-[480px] sm:h-[520px] md:h-[560px] max-h-[560px] overflow-hidden w-full min-w-0">
                    {/* Left Panel: Search & Inquiries List */}
                    <div className={`w-full md:w-[300px] lg:w-[320px] shrink-0 min-w-0 flex flex-col h-full min-h-0 border-r border-slate-100 bg-slate-50/40 ${mobileInquiryView === "chat" ? "hidden md:flex" : "flex"}`}>
                      {/* Search Bar */}
                      <div className="shrink-0 p-3 border-b border-slate-100 bg-white">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari pembeli, akun, atau pesan..."
                            value={inquirySearch}
                            onChange={(e) => setInquirySearch(e.target.value)}
                            className="w-full pl-8 pr-7 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                          />
                          {inquirySearch && (
                            <button
                              onClick={() => setInquirySearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5">
                          <button
                            onClick={() => setInquiryFilter("ALL")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${inquiryFilter === "ALL"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                          >
                            Semua ({inquiries.length})
                          </button>
                          <button
                            onClick={() => setInquiryFilter("UNREPLIED")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${inquiryFilter === "UNREPLIED"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                              }`}
                          >
                            <span>Belum Dibalas</span>
                            {unrepliedInquiriesCount > 0 && (
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${inquiryFilter === "UNREPLIED" ? "bg-white text-purple-700 font-black" : "bg-purple-600 text-white font-bold"
                                }`}>
                                {unrepliedInquiriesCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setInquiryFilter("REPLIED")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${inquiryFilter === "REPLIED"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                          >
                            Selesai ({inquiries.filter((i) => i.replied).length})
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Inquiries Threads List */}
                      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100/80">
                        {filteredInquiries.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <MessageSquare size={28} className="mx-auto mb-2 text-slate-300 stroke-1" />
                            <p className="text-xs font-semibold text-slate-600">Tidak ada pesan ditemukan</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter status.</p>
                          </div>
                        ) : (
                          filteredInquiries.map((inq) => {
                            const isSelected = selectedInquiry?.id === inq.id;
                            return (
                              <div
                                key={inq.id}
                                onClick={() => {
                                  setSelectedInquiryId(inq.id);
                                  setMobileInquiryView("chat");
                                }}
                                className={`p-3.5 transition-all cursor-pointer relative text-left select-none ${isSelected
                                    ? "bg-purple-50/70 border-l-4 border-l-purple-600"
                                    : "hover:bg-slate-100/70 bg-white"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${!inq.replied ? "bg-purple-600 text-white ring-2 ring-purple-100" : "bg-slate-200 text-slate-700"
                                      }`}>
                                      {inq.buyerName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900 text-xs truncate">{inq.buyerName}</span>
                                        {!inq.replied && (
                                          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400">{inq.time}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0 max-w-[100px] truncate">
                                    {inq.game || "Game"}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 line-clamp-1 font-medium pl-10 mb-1.5 break-words">
                                  {inq.question}
                                </p>

                                <div className="flex items-center justify-between pl-10 text-[10px] gap-2">
                                  <span className="text-slate-400 truncate min-w-0">
                                    {inq.listingTitle}
                                  </span>
                                  {inq.replied ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                                      <CheckCircle2 size={10} /> Terjawab
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                                      Perlu Balasan
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Conversation View & Quick Reply Console */}
                    <div className={`flex-1 min-w-0 flex flex-col h-full min-h-0 bg-white ${mobileInquiryView === "list" ? "hidden md:flex" : "flex"}`}>
                      {selectedInquiry ? (
                        <>
                          {/* Active Chat Header */}
                          <div className="shrink-0 p-3.5 sm:px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-white min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Mobile Back Button */}
                              <button
                                onClick={() => setMobileInquiryView("list")}
                                className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                              >
                                <ArrowLeft size={16} />
                              </button>
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {selectedInquiry.buyerName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{selectedInquiry.buyerName}</h4>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0">Calon Pembeli</span>
                                </div>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                  <span className="shrink-0">Menanyakan:</span>
                                  <span className="font-semibold text-slate-700 truncate">{selectedInquiry.listingTitle}</span>
                                </p>
                              </div>
                            </div>

                            {/* Direct Listing / Escrow Links */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Link
                                href={`/listings/${selectedInquiry.listingId}`}
                                className="text-[11px] text-slate-600 hover:text-blue-600 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                              >
                                <Eye size={12} /> <span className="hidden sm:inline">Lihat Postingan</span>
                              </Link>
                              <Link
                                href={`/user/transactions/${selectedInquiry.transactionId || "trx_1"}`}
                                className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors shrink-0"
                              >
                                <MessageSquare size={12} /> <span className="hidden sm:inline">Room Rekber</span> →
                              </Link>
                            </div>
                          </div>

                          {/* Listing Context Ribbon */}
                          <div className="shrink-0 px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs min-w-0 gap-2">
                            <div className="flex items-center gap-2 truncate min-w-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                {selectedInquiry.game || "Game"}
                              </span>
                              <span className="font-bold text-slate-800 truncate">{selectedInquiry.listingTitle}</span>
                            </div>
                            {selectedInquiry.price && (
                              <span className="font-black text-emerald-700 shrink-0">
                                {formatRupiah(selectedInquiry.price)}
                              </span>
                            )}
                          </div>

                          {/* Chat Messages Feed with min-h-0 and auto scroll */}
                          <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-3.5 bg-slate-50/30">
                            <div className="text-center my-1">
                              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full">
                                Pertanyaan calon pembeli diterima • {selectedInquiry.time}
                              </span>
                            </div>

                            {/* Buyer's Question Bubble */}
                            <div className="flex items-start gap-2.5 max-w-[85%]">
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {selectedInquiry.buyerName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-xs font-bold text-slate-900">{selectedInquiry.buyerName}</span>
                                  <span className="text-[10px] text-slate-400">{selectedInquiry.time}</span>
                                </div>
                                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-xs text-slate-800 leading-relaxed font-medium break-words">
                                  {selectedInquiry.question}
                                </div>
                              </div>
                            </div>

                            {/* Seller's Previous Reply (if exists) */}
                            {selectedInquiry.replied && (
                              <div className="flex items-start justify-end gap-2.5 max-w-[85%] ml-auto">
                                <div className="text-right min-w-0">
                                  <div className="flex items-center justify-end gap-1.5 mb-1">
                                    <span className="text-[10px] text-slate-400">{selectedInquiry.replyTime || "Telah dijawab"}</span>
                                    <span className="text-xs font-bold text-emerald-700">Anda (Penjual)</span>
                                  </div>
                                  <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-xs p-3.5 shadow-xs text-xs leading-relaxed font-medium text-left break-words">
                                    {selectedInquiry.replyText || "Pertanyaan telah dijawab kepada calon pembeli."}
                                  </div>
                                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                                    <CheckCircle2 size={11} /> Terkirim ke pembeli & riwayat chat rekber
                                  </div>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                  ME
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick Template Replies Chips */}
                          <div className="shrink-0 px-4 py-2 border-t border-slate-100 bg-white">
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                              <span className="text-slate-400 font-semibold shrink-0 text-[10px] flex items-center gap-1">
                                <Sparkles size={11} className="text-amber-500" /> Balas Cepat:
                              </span>
                              {quickReplies.map((qr, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setReplyInput((prev) => ({ ...prev, [selectedInquiry.id]: qr }));
                                  }}
                                  className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200/80 transition-colors text-[11px] truncate max-w-[200px] cursor-pointer"
                                  title={qr}
                                >
                                  {qr}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reply Input Bar */}
                          <div className="shrink-0 p-3.5 sm:px-4 border-t border-slate-100 bg-white">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={selectedInquiry.replied ? "Kirim balasan tambahan..." : `Tulis balasan untuk ${selectedInquiry.buyerName}...`}
                                value={replyInput[selectedInquiry.id] || ""}
                                onChange={(e) => setReplyInput({ ...replyInput, [selectedInquiry.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendReply(selectedInquiry.id);
                                  }
                                }}
                                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-600 text-slate-900 transition-all placeholder:text-slate-400"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSendReply(selectedInquiry.id)}
                                disabled={!replyInput[selectedInquiry.id]?.trim()}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs px-4 py-2.5 h-auto font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              >
                                <Send size={13} />
                                <span>Kirim</span>
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                          <MessageCircle size={36} className="text-slate-300 stroke-1 mb-2" />
                          <p className="text-sm font-semibold text-slate-600">Pilih salah satu percakapan</p>
                          <p className="text-xs text-slate-400 mt-1">Pilih pertanyaan dari daftar di sebelah kiri untuk melihat pesan dan membalas calon pembeli.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: ACTIVE ORDERS */}
            {sellerView === "orders" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => setSellerView("overview")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Ringkasan</span>
                  </button>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium hidden sm:block">Mode Pesanan & Serah Terima Rekber</span>
                </div>

                {/* Active Escrow Orders */}
                <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pesanan & Serah Terima yang Sedang Berjalan</h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activeOrders.length} Aktif
                      </span>
                    </div>
                    <Link href="/user/transactions">
                      <span className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
                        Lihat Semua Riwayat <ChevronRight size={14} />
                      </span>
                    </Link>
                  </div>
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">Tidak ada transaksi yang sedang berjalan.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeOrders.map((order) => (
                        <div key={order.id} className="flex flex-col justify-between gap-3 p-4 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 transition-all">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{order.listing.game}</span>
                              <span className="font-mono text-xs font-bold text-slate-700">{order.id}</span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm line-clamp-1">{order.listing.title}</p>
                            <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                              <p>Pembeli: <span className="font-bold text-slate-800">{order.buyer.username}</span></p>
                              <p>Admin Rekber: <span className="font-bold text-slate-800">{order.admin.user.username}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1 gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">{formatRupiah(order.price)}</span>
                            <Link href={`/user/transactions/${order.id}`}>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 h-auto font-bold rounded-lg cursor-pointer whitespace-nowrap">
                                Buka Room Serah Terima →
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 4: SALDO & RIWAYAT PENARIKAN (WITHDRAW) */}
            {sellerView === "withdraw" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => setSellerView("overview")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Ringkasan</span>
                  </button>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium hidden sm:block">Manajemen Saldo & Riwayat Penarikan Dana</span>
                </div>

                {/* Seller Balance Card — Compact & Sleek */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Wallet size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Saldo Hasil Penjualan
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Siap Ditarik
                        </span>
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 mt-0.5">Rp 2.450.000</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-2 sm:truncate">Hasil penjualan akun game yang telah tuntas dan siap dicairkan ke rekening bank atau e-wallet.</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setWithdrawContext("seller");
                      setWithdrawAmountInput("2.450.000");
                      setIsWithdrawModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <ArrowUpRight size={15} />
                    <span>Tarik Saldo</span>
                  </Button>
                </div>

                {/* Withdrawal History Log */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-emerald-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Riwayat & Log Penarikan Saldo</h3>
                    </div>
                    <span className="text-xs text-slate-400">{withdrawals.length} Penarikan</span>
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
              </div>
            )}
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
                      <div className={`absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${step.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
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
            <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
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
                  className={`w-full sm:w-auto text-xs font-bold ${selectedDetailTx.status === "PENDING_PAYMENT"
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
                    <option>Spesifikasi pemain tidak sesuai deskripsi post akun</option>
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
                      <strong className="text-slate-800">Spesifikasi Tidak Sesuai:</strong> Item, squad, atau level game berbeda fatal dengan apa yang ditulis di post akun.
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
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
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
