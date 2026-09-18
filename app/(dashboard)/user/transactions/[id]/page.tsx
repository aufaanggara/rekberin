"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { BuyerTransactionView } from "@/components/dashboard/BuyerTransactionView";
import { SellerTransactionView } from "@/components/dashboard/SellerTransactionView";
import { Button } from "@/components/ui/Button";
import { useTransaction } from "@/hooks/useTransactions";
import { mapTransactionApiToViewModel } from "@/lib/transaction-view-model";

function getViewerId(session: Awaited<ReturnType<typeof getSession>>) {
  const user = session?.user as { id?: unknown } | undefined;
  return typeof user?.id === "string" ? user.id : null;
}

function StateCard({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500" role="alert">{message}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export default function UserTransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, isLoading, error, refetch } = useTransaction(params.id);
  const [viewerId, setViewerId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    getSession()
      .then((session) => {
        if (active) setViewerId(getViewerId(session));
      })
      .catch(() => {
        if (active) setViewerId(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (isLoading || viewerId === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20" aria-busy="true" aria-live="polite">
        <div className="h-8 w-56 rounded bg-slate-200 animate-pulse" />
        <div className="mt-6 h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <StateCard
        title="Transaksi tidak dapat dimuat"
        message={error}
        action={
          viewerId === null ? (
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/user/transactions/${params.id}`)}`}>
              <Button>Masuk untuk melanjutkan</Button>
            </Link>
          ) : (
            <Button onClick={() => void refetch()}>Coba lagi</Button>
          )
        }
      />
    );
  }

  if (!data) {
    return <StateCard title="Transaksi tidak ditemukan" message="Transaksi yang diminta tidak tersedia." />;
  }

  if (!viewerId) {
    return (
      <StateCard
        title="Login diperlukan"
        message="Silakan login untuk melihat detail transaksi."
        action={
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/user/transactions/${params.id}`)}`}>
            <Button>Masuk</Button>
          </Link>
        }
      />
    );
  }

  if (viewerId !== data.buyerId && viewerId !== data.sellerId) {
    return (
      <StateCard
        title="Halaman tidak tersedia"
        message="Halaman ini hanya menampilkan transaksi dari sudut pandang buyer atau seller terkait."
        action={
          <Link href="/user/transactions">
            <Button variant="secondary">Kembali ke transaksi</Button>
          </Link>
        }
      />
    );
  }

  const transaction = mapTransactionApiToViewModel(data);

  if (viewerId === data.sellerId) {
    return <SellerTransactionView initialTransaction={transaction} />;
  }

  return <BuyerTransactionView initialTransaction={transaction} />;
}
