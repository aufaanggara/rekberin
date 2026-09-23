"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Users,
  Check,
  Scale,
  Sparkles,
  Building2,
  Eye,
  RefreshCw,
  Landmark,
  Radio,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { mapTransactionApiToViewModel } from "@/lib/transaction-view-model";
import { formatRupiah } from "@/lib/utils";

const escrowGrowthData = [
  { day: "Sen", volume: 2400000, transaksi: 8 },
  { day: "Sel", volume: 3800000, transaksi: 12 },
  { day: "Rab", volume: 2900000, transaksi: 10 },
  { day: "Kam", volume: 4500000, transaksi: 16 },
  { day: "Jum", volume: 5200000, transaksi: 19 },
  { day: "Sab", volume: 6800000, transaksi: 24 },
  { day: "Min", volume: 4200000, transaksi: 15 },
];

interface DisputeCase {
  id: string;
  txId: string;
  title: string;
  buyer: string;
  seller: string;
  amount: number;
  reason: string;
  buyerProof: string;
  sellerProof: string;
  status: "OPEN" | "REFUNDED" | "RELEASED";
}

const initialDisputes: DisputeCase[] = [
  {
    id: "DSP-104",
    txId: "tx_1",
    title: "Akun Diamond League 89 OVR - Laporan Password Tidak Cocok",
    buyer: "Dimas Anggara (@buyer_dimas)",
    seller: "Rian Pratama (@efootball_seller1)",
    amount: 850000,
    reason: "Buyer mengklaim password Konami ID tidak bisa login saat dicek di game.",
    buyerProof: "Screenshot error: 'Incorrect login ID or password. Please verify.'",
    sellerProof: "Screenshot login sukses 1 jam sebelum data diserahkan ke rekber.",
    status: "OPEN",
  },
];

interface BankFeed {
  id: string;
  time: string;
  bank: "BCA" | "MANDIRI" | "QRIS";
  nominal: number;
  sender: string;
  txRef: string;
  matched: boolean;
}

const initialBankFeeds: BankFeed[] = [
  {
    id: "MUT-9912",
    time: "14:25 WIB",
    bank: "BCA",
    nominal: 851250,
    sender: "TRF MBANK AN DIMAS ANGGARA",
    txRef: "#tx_1",
    matched: true,
  },
  {
    id: "MUT-9908",
    time: "13:50 WIB",
    bank: "MANDIRI",
    nominal: 450750,
    sender: "TRF LIVIN AN RIZKY P",
    txRef: "#tx_2",
    matched: true,
  },
  {
    id: "MUT-9889",
    time: "12:15 WIB",
    bank: "QRIS",
    nominal: 350000,
    sender: "QRIS DANA AN ANDI W",
    txRef: "#tx_3",
    matched: true,
  },
];

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<"ALL" | "PENDING_PAYMENT" | "PENDING_CONFIRM" | "COMPLETED" | "DISPUTES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin duty status state
  const [adminStatus, setAdminStatus] = useState<"ONLINE" | "AWAY" | "BUSY">("ONLINE");

  // Dispute cases state
  const [disputes, setDisputes] = useState<DisputeCase[]>(initialDisputes);

  // Bank feeds state
  const [showBankFeeds, setShowBankFeeds] = useState(false);
  const [bankFeeds, setBankFeeds] = useState<BankFeed[]>(initialBankFeeds);

  // Real data from API
  const { data: currentUser } = useCurrentUser();
  const { data: rawTransactions, isLoading, error, refetch } = useAdminTransactions();
  const transactions = useMemo(
    () => rawTransactions.map(mapTransactionApiToViewModel),
    [rawTransactions]
  );

  const active = transactions.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const pendingPayment = transactions.filter((t) => t.status === "PENDING_PAYMENT");
  const pendingConfirm = transactions.filter((t) => t.status === "PENDING_BUYER_CONFIRM");
  const completed = transactions.filter((t) => t.status === "COMPLETED");
  const totalFee = transactions.reduce((sum, t) => sum + t.adminFee, 0);
  const totalEscrowHeld = active.reduce((sum, t) => sum + t.price, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResolveDispute = (dspId: string, verdict: "REFUND" | "RELEASE") => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === dspId
          ? { ...d, status: verdict === "REFUND" ? "REFUNDED" : "RELEASED" }
          : d
      )
    );

    if (verdict === "REFUND") {
      showToast("Vonis Sengketa: Dana 100% berhasil di-refund ke rekening Buyer.");
    } else {
      showToast("Vonis Sengketa: Klaim ditolak, dana escrow diteruskan ke Seller.");
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "PENDING_PAYMENT" && t.status !== "PENDING_PAYMENT") return false;
    if (filter === "PENDING_CONFIRM" && t.status !== "PENDING_BUYER_CONFIRM") return false;
    if (filter === "COMPLETED" && t.status !== "COMPLETED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.listing.title.toLowerCase().includes(q) ||
        t.buyer.username.toLowerCase().includes(q) ||
        t.listing.seller.username.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar role="admin" />

      <div className="flex-1 space-y-6">
        {/* Admin Command Center Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-100 text-xs font-semibold backdrop-blur-md mb-3">
                <ShieldCheck size={13} className="text-amber-200" />
                <span>Admin Escrow Officer Berlisensi • Rating 4.9★</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Command Center: {currentUser?.fullName || currentUser?.username || "Admin Officer"}
              </h1>
              <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
                Pantau dana tertampung di rekening escrow, verifikasi transfer buyer, dan fasilitasi serah terima akun aman.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => showToast("Laporan transaksi mingguan berhasil diexport (CSV).")}
                className="bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs shadow-md border-0"
              >
                <Download size={14} className="mr-1.5" />
                Export Rekap CSV
              </Button>

              {/* Real-time Status Switcher */}
              <div className="bg-amber-950/60 p-1 rounded-xl border border-amber-400/30 flex items-center text-xs">
                <button
                  onClick={() => {
                    setAdminStatus("ONLINE");
                    showToast("Status diubah ke: Online & Siap Melayani Transaksi.");
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    adminStatus === "ONLINE"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-amber-200 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Online
                </button>
                <button
                  onClick={() => {
                    setAdminStatus("AWAY");
                    showToast("Status diubah ke: Istirahat Sementara.");
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    adminStatus === "AWAY"
                      ? "bg-amber-500 text-slate-900 shadow-xs"
                      : "text-amber-200 hover:text-white"
                  }`}
                >
                  Istirahat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Escrow Tertampung</p>
              <p className="text-lg sm:text-xl font-black text-amber-600 mt-0.5">{formatRupiah(totalEscrowHeld)}</p>
              <button
                onClick={() => setShowBankFeeds(!showBankFeeds)}
                className="text-[11px] text-amber-700 font-bold mt-1 inline-flex items-center gap-1 hover:underline"
              >
                <Landmark size={12} /> {showBankFeeds ? "Tutup Mutasi" : "Cek Mutasi Bank"}
              </button>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verifikasi Transfer</p>
              <p className="text-2xl font-black text-blue-600 mt-0.5">{pendingPayment.length}</p>
              <span className="text-[11px] text-blue-600 font-medium mt-1 inline-block">Cek Bukti Masuk</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sengketa / Keluhan</p>
              <p className="text-2xl font-black text-rose-600 mt-0.5">
                {disputes.filter((d) => d.status === "OPEN").length}
              </p>
              <button
                onClick={() => setFilter("DISPUTES")}
                className="text-[11px] text-rose-600 font-bold mt-1 inline-flex items-center gap-1 hover:underline"
              >
                <Scale size={12} /> Buka Ruang Vonis
              </button>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Scale size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendapatan Platform</p>
              <p className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5">{formatRupiah(totalFee)}</p>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Operasional &amp; Gaji Staf</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        {/* Bank Mutation Feeds Log (Simulasi Mutasi Rekening Escrow) */}
        {showBankFeeds && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Log Mutasi Rekening Bank Escrow (Otomatis)
                </h3>
              </div>
              <button
                onClick={() => setShowBankFeeds(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Tutup
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-left bg-slate-50">
                    <th className="py-2.5 px-3">Bank</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Keterangan Mutasi</th>
                    <th className="py-2.5 px-3">Nominal Masuk</th>
                    <th className="py-2.5 px-3 text-right">Matching Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankFeeds.map((bf) => (
                    <tr key={bf.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-800">{bf.bank}</td>
                      <td className="py-3 px-3 text-slate-500">{bf.time}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700">{bf.sender}</td>
                      <td className="py-3 px-3 font-black text-emerald-600">+{formatRupiah(bf.nominal)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={11} /> Cocok Otomatis ({bf.txRef})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Escrow Growth & Volume Analytics Chart (Modern Light Theme) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Aktivitas Volume Escrow 7 Hari Terakhir</h3>
              <p className="text-xs text-slate-400">Tren perputaran dana jual beli akun game yang melalui admin rekber.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full self-start sm:self-auto border border-emerald-200">
              +24% vs Minggu Lalu
            </span>
          </div>

          <div style={{ width: "100%", height: 230 }}>
            <ResponsiveContainer>
              <AreaChart data={escrowGrowthData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000000}jt`}
                />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), "Volume Escrow"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#ffffff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Queue & Escrow Mediation Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {filter === "DISPUTES" ? "Pusat Investigasi & Vonis Sengketa" : "Antrean Transaksi Rekber Aktif"}
              </h2>
              <p className="text-xs text-slate-400">
                {filter === "DISPUTES"
                  ? "Tinjau bukti laporan pembeli dan penjual sebelum mengambil keputusan vonis."
                  : "Pilih transaksi untuk memverifikasi dana atau memediasi chat serah-terima."}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === "ALL" ? "bg-white text-amber-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua ({transactions.length})
              </button>
              <button
                onClick={() => setFilter("PENDING_PAYMENT")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === "PENDING_PAYMENT" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Verifikasi Bayar ({pendingPayment.length})
              </button>
              <button
                onClick={() => setFilter("PENDING_CONFIRM")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === "PENDING_CONFIRM" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Serah Terima ({pendingConfirm.length})
              </button>
              <button
                onClick={() => setFilter("COMPLETED")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === "COMPLETED" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Selesai ({completed.length})
              </button>
              <button
                onClick={() => setFilter("DISPUTES")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  filter === "DISPUTES" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Scale size={13} /> Sengketa ({disputes.filter((d) => d.status === "OPEN").length})
              </button>
            </div>
          </div>

          {/* Dispute Center View Mode */}
          {filter === "DISPUTES" ? (
            <div className="p-4 sm:p-6 space-y-4">
              {disputes.map((dsp) => (
                <div
                  key={dsp.id}
                  className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs text-rose-700">#{dsp.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            dsp.status === "OPEN"
                              ? "bg-rose-100 text-rose-800"
                              : dsp.status === "REFUNDED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {dsp.status === "OPEN"
                            ? "Butuh Vonis Admin"
                            : dsp.status === "REFUNDED"
                            ? "Vonis: Dana Di-Refund ke Buyer"
                            : "Vonis: Dana Dilepas ke Seller"}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{dsp.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pihak: <strong>{dsp.buyer}</strong> vs <strong>{dsp.seller}</strong>
                      </p>
                    </div>

                    <div className="text-base sm:text-lg font-black text-slate-900">
                      {formatRupiah(dsp.amount)}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <span className="font-bold text-rose-700 block">Laporan & Bukti Pembeli:</span>
                      <p className="text-slate-600">{dsp.reason}</p>
                      <span className="inline-block text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 w-full">
                        {dsp.buyerProof}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-blue-700 block">Klarifikasi & Bukti Penjual:</span>
                      <p className="text-slate-600">Penjual mengklaim data akun sudah benar saat dikirim.</p>
                      <span className="inline-block text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 w-full">
                        {dsp.sellerProof}
                      </span>
                    </div>
                  </div>

                  {dsp.status === "OPEN" ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-rose-100">
                      <Link href={`/admin/transactions/${dsp.txId}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          <MessageSquare size={13} className="mr-1.5" /> Buka Chat Mediasi 3 Pihak
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleResolveDispute(dsp.id, "REFUND")}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      >
                        Vonis Refund 100% ke Buyer
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveDispute(dsp.id, "RELEASE")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Vonis Lepas Dana ke Seller
                      </Button>
                    </div>
                  ) : (
                    <div className="text-right text-xs font-bold text-slate-600">
                      Sengketa telah diselesaikan oleh Admin {currentUser?.username || "Petugas"}.
                    </div>
                  )}
                </div>
              ))}

              {disputes.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Tidak ada kasus sengketa aktif.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick Search */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari ID transaksi, nama buyer, seller, atau judul game..."
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-left">
                      <th className="py-3 px-4">ID Transaksi</th>
                      <th className="py-3 px-4">Akun Game</th>
                      <th className="py-3 px-4">Pihak Transaksi</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Fee Platform</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={24} className="animate-spin text-amber-600" />
                            <span className="text-slate-500">Memuat transaksi admin...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10">
                          <p className="text-red-500 mb-2">{error}</p>
                          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
                            Coba Lagi
                          </Button>
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400">
                          Tidak ada transaksi yang cocok dengan filter atau pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                            #{t.id.slice(-6)}
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px]">
                            <div className="font-bold text-slate-800 truncate">{t.listing.title}</div>
                            <span className="text-[10px] font-bold text-blue-600">{t.listing.game}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-700">
                              B: <span className="font-bold">{t.buyer.username}</span>
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              S: <span>{t.listing.seller.username}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {formatRupiah(t.price)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">
                            {formatRupiah(t.adminFee)}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/admin/transactions/${t.id}`}>
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1 px-3"
                              >
                                <MessageSquare size={12} className="mr-1" />
                                Buka Mediasi
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Escrow SOP & Mediation Guidelines */}
        <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2 font-bold text-sm">
            <Scale size={18} className="text-amber-400" />
            <span>Protokol Keamanan Admin Rekber Rekberin</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Sebagai Admin Rekber berlisensi, pastikan mutasi rekening bank selalu dicek secara mandiri sebelum menekan tombol verifikasi. Simpan bukti percakapan serah-terima akun di dalam room chat resmi untuk keperluan audit dan perlindungan garansi bagi pembeli maupun penjual.
          </p>
        </div>
      </div>
    </div>
  );
}
