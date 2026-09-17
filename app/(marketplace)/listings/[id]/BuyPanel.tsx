"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dummyAdmins, dummyTransactions } from "@/data/dummy";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

export function BuyPanel({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  function confirm() {
    toast.success("Pesanan dibuat! Menghubungkan ke Room Chat Rekber...");
    setOpen(false);

    // Find transaction for this listing or fallback to trx_4 / trx_1
    const tx = dummyTransactions.find((t) => t.listing.id === listingId);
    const targetId = tx ? tx.id : "trx_4";

    setTimeout(() => {
      router.push(`/user/transactions/${targetId}`);
    }, 600);
  }

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        onClick={() => setOpen(true)}
      >
        Beli via Rekber (Aman)
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Pilih Admin Rekber</h3>
                  <p className="text-xs text-slate-500">Pilih pihak ketiga terpercaya untuk menahan dana</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2.5 my-5">
                {dummyAdmins.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                    className={`w-full text-left rounded-xl border p-3.5 flex items-center justify-between transition-all cursor-pointer ${
                      selected === a.id
                        ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        {a.user.fullName}
                        <ShieldCheck size={14} className="text-emerald-600" />
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Fee {formatRupiah(a.fee)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> &lt;{a.responseTime} mnt
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Skor {a.trustScore}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!selected}
                onClick={confirm}
              >
                Lanjutkan ke Transaksi
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
