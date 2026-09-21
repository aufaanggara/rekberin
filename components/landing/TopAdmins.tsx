import { dummyAdmins } from "@/data/dummy";
import { AdminCard } from "@/components/marketplace/AdminCard";
import { Trophy } from "lucide-react";

export function TopAdmins() {
  const top = [...dummyAdmins].sort((a, b) => b.trustScore - a.trustScore).slice(0, 3);

  return (
    <section className="bg-slate-50 border-y border-slate-200 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">
              <Trophy size={14} className="text-amber-500" /> Admin Terverifikasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Admin Rekber Paling Terpercaya
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Admin escrow dengan skor kepercayaan tertinggi, fast respon, dan ribuan transaksi sukses.
            </p>
          </div>

          <span className="self-start text-xs font-semibold text-slate-500 sm:self-auto">
            {dummyAdmins.length} admin tersedia saat checkout
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {top.map((a, i) => (
            <AdminCard key={a.id} admin={a} rank={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
