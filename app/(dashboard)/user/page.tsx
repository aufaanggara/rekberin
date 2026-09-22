import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowRight,
  CircleDollarSign,
  Gamepad2,
  PlusCircle,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionInclude } from "@/lib/transactions";
import { formatRupiah } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export const dynamic = "force-dynamic";

const listingStatusLabel = {
  AVAILABLE: "Tersedia",
  IN_TRANSACTION: "Dalam transaksi",
  SOLD: "Terjual",
  INACTIVE: "Tidak aktif",
} as const;

const listingStatusClass = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_TRANSACTION: "border-amber-200 bg-amber-50 text-amber-800",
  SOLD: "border-blue-200 bg-blue-50 text-blue-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
} as const;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: unknown } | undefined;
  const userId = typeof sessionUser?.id === "string" ? sessionUser.id : null;

  if (!userId) redirect("/login?callbackUrl=%2Fuser");

  const [user, transactions, listings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: transactionInclude,
    }),
    prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  if (!user) redirect("/login?callbackUrl=%2Fuser");

  const buyerTransactions = transactions.filter((transaction) => transaction.buyerId === user.id);
  const sellerTransactions = transactions.filter((transaction) => transaction.sellerId === user.id);
  const activeTransactions = transactions.filter(
    (transaction) => !["COMPLETED", "CANCELLED"].includes(transaction.status)
  );
  const availableListings = listings.filter((listing) => listing.status === "AVAILABLE");
  const transactionValue = transactions.reduce(
    (total, transaction) => total + transaction.price + transaction.platformFee + transaction.adminFee,
    0
  );

  const metrics = [
    {
      label: "Transaksi aktif",
      value: String(activeTransactions.length),
      helper: "Pembelian dan penjualan",
      icon: Receipt,
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      label: "Sebagai pembeli",
      value: String(buyerTransactions.length),
      helper: "Transaksi terkait akun ini",
      icon: ShoppingBag,
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    {
      label: "Listing tersedia",
      value: String(availableListings.length),
      helper: `${listings.length} listing milik Anda`,
      icon: Store,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Nilai transaksi",
      value: formatRupiah(transactionValue),
      helper: "Bukan saldo yang dapat ditarik",
      icon: CircleDollarSign,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
      <DashboardSidebar role="user" />

      <main className="min-w-0 flex-1 space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-6 text-white sm:px-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={user.fullName} size={60} className="border-white/30" />
                <div>
                  <p className="text-xs font-semibold text-blue-100">Selamat datang kembali</p>
                  <h1 className="mt-1 font-display text-2xl font-bold">{user.fullName}</h1>
                  <p className="mt-1 text-sm text-blue-100">
                    @{user.username} · {user.email}
                  </p>
                </div>
              </div>
              <div className="inline-flex self-start items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-sm sm:self-auto">
                <ShieldCheck size={14} aria-hidden="true" />
                {user.isVerified ? "Akun terverifikasi" : "Akun pengguna"}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4 sm:px-7">
            <Link
              href="/listings"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <ShoppingBag size={15} aria-hidden="true" />
              Cari listing
            </Link>
            <Link
              href="/listings/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <PlusCircle size={15} aria-hidden="true" />
              Buat listing
            </Link>
            <Link
              href="/user/transactions"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Receipt size={15} aria-hidden="true" />
              Semua transaksi
            </Link>
          </div>
        </section>

        <section aria-labelledby="summary-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="summary-heading" className="font-display text-lg font-bold text-slate-900">
                Ringkasan akun
              </h2>
              <p className="text-xs text-slate-500">Dihitung dari data transaksi dan listing di database.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                    <p className="mt-1 truncate text-xl font-black text-slate-900">{metric.value}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{metric.helper}</p>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${metric.className}`}>
                    <metric.icon size={18} aria-hidden="true" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">Transaksi terbaru</h2>
                <p className="text-xs text-slate-500">Pembelian dan penjualan milik akun ini.</p>
              </div>
              <Link href="/user/transactions" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Lihat semua
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Gamepad2 size={28} aria-hidden="true" className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada transaksi</p>
                <p className="mt-1 text-xs text-slate-500">Pilih listing marketplace untuk memulai transaksi pertama.</p>
                <Link href="/listings" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                  Buka marketplace
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((transaction) => {
                  const asBuyer = transaction.buyerId === user.id;
                  return (
                    <article key={transaction.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${asBuyer ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {asBuyer ? "Pembelian" : "Penjualan"}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">#{transaction.id.slice(-6)}</span>
                        </div>
                        <h3 className="mt-1 truncate text-sm font-bold text-slate-900">{transaction.listing.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(transaction.createdAt)} · {formatRupiah(transaction.price + transaction.platformFee + transaction.adminFee)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <StatusBadge status={transaction.status} />
                        <Link
                          href={`/user/transactions/${transaction.id}`}
                          aria-label={`Buka transaksi ${transaction.listing.title}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">Listing saya</h2>
                <p className="text-xs text-slate-500">Data listing dari database.</p>
              </div>
              <Link href="/listings/new" aria-label="Buat listing baru" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                <PlusCircle size={18} aria-hidden="true" />
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Store size={28} aria-hidden="true" className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada listing</p>
                <p className="mt-1 text-xs text-slate-500">Listing yang Anda buat akan muncul di sini.</p>
                <Link href="/listings/new" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                  Buat listing
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {listings.slice(0, 5).map((listing) => (
                  <article key={listing.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">{listing.title}</h3>
                        <p className="mt-1 text-xs font-semibold text-blue-600">{formatRupiah(listing.price)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${listingStatusClass[listing.status]}`}>
                        {listingStatusLabel[listing.status]}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{formatDate(listing.createdAt)}</span>
                      <Link href={`/listings/${listing.id}`} className="font-bold text-blue-600 hover:text-blue-700">
                        Lihat listing
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </section>

        {sellerTransactions.length === 0 && listings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900" role="status">
            Listing Anda sudah tampil, tetapi belum memiliki transaksi penjualan.
          </div>
        )}
      </main>
    </div>
  );
}
