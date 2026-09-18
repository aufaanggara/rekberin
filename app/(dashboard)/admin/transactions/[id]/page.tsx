"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { AdminTransactionView } from "@/components/dashboard/AdminTransactionView";
import { Button } from "@/components/ui/Button";
import { useTransaction } from "@/hooks/useTransactions";
import { mapTransactionApiToViewModel } from "@/lib/transaction-view-model";

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

export default function AdminTransactionDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, error, refetch } = useTransaction(params.id);
  const [viewer, setViewer] = useState<{ id: string; role: string } | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (!active) return;
        const user = session?.user as { id?: unknown; role?: unknown } | undefined;
        setViewer(
          typeof user?.id === "string" && typeof user.role === "string"
            ? { id: user.id, role: user.role }
            : null
        );
      })
      .catch(() => {
        if (active) setViewer(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading || viewer === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20" aria-busy="true" aria-live="polite">
        <div className="h-8 w-56 rounded bg-slate-200 animate-pulse" />
        <div className="mt-6 h-64 rounded-2xl border border-slate-200 bg-white animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <StateCard
        title="Transaksi tidak dapat dimuat"
        message={error ?? "Transaksi tidak ditemukan."}
        action={
          viewer === null ? (
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/admin/transactions/${params.id}`)}`}>
              <Button>Masuk sebagai admin</Button>
            </Link>
          ) : (
            <Button onClick={() => void refetch()}>Coba lagi</Button>
          )
        }
      />
    );
  }

  if (!viewer || viewer.id !== data.adminId || !["ADMIN", "SUPER_ADMIN"].includes(viewer.role)) {
    return (
      <StateCard
        title="Halaman tidak tersedia"
        message="Detail admin hanya tersedia untuk admin yang ditugaskan pada transaksi ini."
        action={<Link href="/admin/transactions"><Button variant="secondary">Kembali</Button></Link>}
      />
    );
  }

  return <AdminTransactionView initialTransaction={mapTransactionApiToViewModel(data)} />;
}
