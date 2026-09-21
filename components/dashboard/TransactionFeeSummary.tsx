import { ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

export interface TransactionFeeSummaryProps {
  price: number;
  platformFee: number;
  adminFee: number;
}

export function getTransactionBuyerTotal({
  price,
  platformFee,
  adminFee,
}: TransactionFeeSummaryProps) {
  return price + platformFee + adminFee;
}

export function TransactionFeeSummary({
  price,
  platformFee,
  adminFee,
}: TransactionFeeSummaryProps) {
  const buyerTotal = getTransactionBuyerTotal({ price, platformFee, adminFee });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Rincian Biaya Transaksi
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
          <ShieldCheck size={12} aria-hidden="true" /> Data transaksi
        </span>
      </div>

      <dl className="space-y-2.5 pt-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Harga akun</dt>
          <dd className="font-semibold text-slate-900">{formatRupiah(price)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Fee platform</dt>
          <dd className="font-semibold text-slate-900">{formatRupiah(platformFee)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Fee admin</dt>
          <dd className="font-semibold text-slate-900">{formatRupiah(adminFee)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-3 text-sm font-bold text-blue-700">
          <dt>Total buyer membayar</dt>
          <dd>{formatRupiah(buyerTotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-emerald-700">
          <dt>Seller menerima</dt>
          <dd>{formatRupiah(price)}</dd>
        </div>
      </dl>
    </div>
  );
}
