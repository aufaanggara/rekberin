"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTransactions } from "@/hooks/useTransactions";
import { mapTransactionApiToViewModel } from "@/lib/transaction-view-model";
import { formatRupiah } from "@/lib/utils";
import {
  MessageSquare,
  Shield,
  KeyRound,
  Wallet,
  Clock,
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  Filter,
  Sparkles,
  ShoppingBag,
  Store,
  AlertTriangle,
} from "lucide-react";
import type { ChatTabStage } from "@/types";

type RoomStage = ChatTabStage | "DISPUTED";

interface ActiveChatRoomItem {
  id: string;
  listingTitle: string;
  game: string;
  price: number;
  stage: RoomStage;
  role: "BUYER" | "SELLER";
  partnerName: string;
  adminName: string;
  createdAt: string;
}

export default function UserChatInboxPage() {
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "BUYER" | "SELLER">("ALL");
  const { data: session, status: sessionStatus } = useSession();
  const { data, isLoading, error, refetch } = useTransactions();
  const sessionUser = session?.user as { id?: unknown } | undefined;
  const viewerId = typeof sessionUser?.id === "string" ? sessionUser.id : null;

  const transactions = useMemo(
    () => data.map(mapTransactionApiToViewModel),
    [data]
  );

  // Hanya tampilkan room transaksi nyata yang melibatkan pengguna saat ini.
  const activeRooms: ActiveChatRoomItem[] = useMemo(() => {
    if (!viewerId) return [];

    return transactions.flatMap((tx) => {
      const isBuyer = tx.buyer.id === viewerId;
      const isSeller = tx.listing.seller.id === viewerId;
      if ((!isBuyer && !isSeller) || tx.status === "CANCELLED" || tx.status === "COMPLETED") {
        return [];
      }

      let stage: RoomStage;
      if (tx.status === "PENDING_PAYMENT") {
        stage = "REKBER";
      } else if (tx.status === "DISPUTED") {
        stage = "DISPUTED";
      } else {
        stage = "HANDOVER";
      }

      return [{
        id: tx.id,
        listingTitle: tx.listing.title,
        game: tx.listing.game,
        price: tx.price,
        stage,
        role: isBuyer ? "BUYER" : "SELLER",
        partnerName: isBuyer ? tx.listing.seller.username : tx.buyer.username,
        adminName: tx.admin.user.username,
        createdAt: tx.createdAt,
      }];
    });
  }, [transactions, viewerId]);

  const filteredRooms = useMemo(() => {
    return activeRooms.filter((room) => {
      if (stageFilter !== "ALL" && room.stage !== stageFilter) return false;
      if (roleFilter === "BUYER" && room.role !== "BUYER") return false;
      if (roleFilter === "SELLER" && room.role !== "SELLER") return false;
      return true;
    });
  }, [activeRooms, stageFilter, roleFilter]);

  const getStageBadge = (stage: RoomStage) => {
    switch (stage) {
      case "NEGOTIATION":
        return {
          icon: MessageSquare,
          badge: "Tahap 1: Negosiasi",
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "REKBER":
        return {
          icon: Shield,
          badge: "Tahap 2: Bayar Rekber",
          color: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "HANDOVER":
        return {
          icon: KeyRound,
          badge: "Tahap 3: Amankan Akun",
          color: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "DISBURSEMENT":
        return {
          icon: Wallet,
          badge: "Tahap 4: Pencairan Dana",
          color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "DISPUTED":
        return {
          icon: AlertTriangle,
          badge: "Dalam dispute",
          color: "bg-rose-50 text-rose-700 border-rose-200",
        };
    }
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="flex-1 space-y-6">
        {/* Top Back Link */}
        <div>
          <Link
            href="/user"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-1"
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </Link>
        </div>

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Pusat Transaksi & Chat Aktif
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pilih akun game yang sedang dalam proses transaksi untuk masuk ke ruang negosiasi, pembayaran, dan serah terima.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-800">
            <Sparkles size={14} className="text-blue-600" />
            <span>{activeRooms.length} Transaksi Sedang Berjalan</span>
          </div>
        </div>

        {/* Filter Bar: Tahap 1 - 4 & Peran */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold px-1 flex items-center gap-1">
              <Filter size={12} /> Tahap:
            </span>
            <button
              type="button"
              onClick={() => setStageFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                stageFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({activeRooms.length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("REKBER")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                stageFilter === "REKBER"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              2. Bayar Rekber
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("HANDOVER")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                stageFilter === "HANDOVER"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              3. Serah Terima
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("DISPUTED")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                stageFilter === "DISPUTED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Dispute
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                roleFilter === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Semua Peran
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("BUYER")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                roleFilter === "BUYER" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <ShoppingBag size={12} /> Beli
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("SELLER")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                roleFilter === "SELLER" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Store size={12} /> Jual
            </button>
          </div>
        </div>

        {/* Active Accounts & Transaction Chat List */}
        {sessionStatus === "loading" || isLoading ? (
          <div className="space-y-3" aria-label="Memuat transaksi" aria-busy="true">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center" role="alert">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 min-h-10 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
            >
              Coba lagi
            </button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Gamepad2 size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-700 text-sm">Tidak ada transaksi aktif pada filter ini.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Mulai tawar-menawar akun game impian Anda di katalog.
            </p>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Jelajahi Katalog Akun
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRooms.map((room) => {
              const stageBadge = getStageBadge(room.stage);
              const StageIcon = stageBadge.icon;

              return (
                <Link
                  key={room.id}
                  href={`/user/transactions/${room.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group block"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Game Avatar / Thumbnail */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform overflow-hidden relative">
                      <Gamepad2 className="w-6 h-6" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Current Progressive Stage Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${stageBadge.color}`}
                        >
                          <StageIcon size={12} />
                          {stageBadge.badge}
                        </span>

                        {/* Role Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            room.role === "BUYER"
                              ? "bg-blue-100/70 text-blue-800"
                              : "bg-emerald-100/70 text-emerald-800"
                          }`}
                        >
                          {room.role === "BUYER" ? "Anda: Pembeli" : "Anda: Penjual"}
                        </span>

                        <span className="text-xs text-slate-400">· {room.game}</span>
                      </div>

                      {/* Account Title */}
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
                        {room.listingTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                        <span>
                          Partner: <strong className="text-slate-700">{room.partnerName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Escrow: <strong className="text-amber-700">{room.adminName}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock size={11} /> Dibuat {new Date(room.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Price & CTA */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Nominal Transaksi
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {formatRupiah(room.price)}
                      </span>
                    </div>

                    <div className="px-4 py-2.5 bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0">
                      <span>Buka Proses Transaksi</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
