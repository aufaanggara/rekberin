"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { ShieldCheck, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ListingStatus } from "@/types";
import type { TransactionAdminOption } from "@/types/transaction-api";
import {
  getApiErrorMessage,
  parseTransactionAdminListResponse,
  parseTransactionDetailResponse,
  readJsonResponse,
} from "@/lib/transaction-api-client";
import { toast } from "sonner";

interface BuyPanelProps {
  listingId: string;
  listingStatus: ListingStatus;
}

export function BuyPanel({ listingId, listingStatus }: BuyPanelProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [admins, setAdmins] = useState<TransactionAdminOption[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminLoadError, setAdminLoadError] = useState<string | null>(null);
  const [transactionSubmitError, setTransactionSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAdmins() {
    setLoadingAdmins(true);
    setAdminLoadError(null);

    try {
      const response = await fetch("/api/admins", { cache: "no-store" });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Daftar admin tidak dapat dimuat."));
      }

      const result = parseTransactionAdminListResponse(payload);
      setAdmins(result.admins);
    } catch (requestError) {
      setAdminLoadError(
        requestError instanceof Error
          ? requestError.message
          : "Daftar admin tidak dapat dimuat."
      );
    } finally {
      setLoadingAdmins(false);
    }
  }

  function openDialog() {
    if (listingStatus !== "AVAILABLE") return;

    setTransactionSubmitError(null);
    setOpen(true);
    if (admins.length === 0 && !loadingAdmins) {
      void loadAdmins();
    }
  }

  async function confirm() {
    if (!selected || submitting) return;

    setSubmitting(true);
    setTransactionSubmitError(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, adminId: selected }),
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Silakan login sebelum memulai transaksi.");
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        throw new Error(getApiErrorMessage(payload, "Transaksi tidak dapat dibuat."));
      }

      const result = parseTransactionDetailResponse(payload);
      toast.success("Transaksi berhasil dibuat.");
      setOpen(false);
      router.push(`/user/transactions/${result.transaction.id}`);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Transaksi tidak dapat dibuat.";
      setTransactionSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) setOpen(nextOpen);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow border border-transparent text-base px-6 py-2.5 rounded-lg w-full font-bold"
          onClick={openDialog}
          disabled={listingStatus !== "AVAILABLE"}
          aria-label={
            listingStatus === "AVAILABLE"
              ? "Mulai transaksi melalui Rekber"
              : "Listing tidak tersedia"
          }
        >
          {listingStatus === "AVAILABLE" ? "Beli via Rekber (Aman)" : "Listing tidak tersedia"}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          aria-busy={loadingAdmins || submitting}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeButtonRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (submitting) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (submitting) event.preventDefault();
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <Dialog.Title className="font-bold text-lg text-slate-900">
                Pilih Admin Rekber
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500">
                Pilih admin aktif untuk menangani transaksi ini.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                ref={closeButtonRef}
                type="button"
                disabled={submitting}
                className="min-w-11 min-h-11 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Tutup pilihan admin"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {loadingAdmins ? (
            <div className="my-8 flex items-center justify-center gap-2 text-sm text-slate-500" aria-live="polite">
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat admin aktif...
            </div>
          ) : adminLoadError ? (
            <div className="my-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              <p>{adminLoadError}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => void loadAdmins()}
              >
                Coba lagi
              </Button>
            </div>
          ) : admins.length === 0 ? (
            <div className="my-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500" role="status">
              Belum ada admin aktif yang tersedia.
            </div>
          ) : (
            <div className="space-y-2.5 my-5" aria-label="Daftar admin aktif">
              {admins.map((admin) => (
                <button
                  type="button"
                  key={admin.id}
                  onClick={() => {
                    setSelected(admin.id);
                    setTransactionSubmitError(null);
                  }}
                  aria-pressed={selected === admin.id}
                  className={`w-full min-h-11 text-left rounded-xl border p-3.5 flex items-center justify-between transition-all cursor-pointer ${
                    selected === admin.id
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      {admin.fullName}
                      <ShieldCheck size={14} className="text-emerald-600" aria-label="Admin terverifikasi" />
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>@{admin.username}</span>
                      <span aria-hidden="true">•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} aria-hidden="true" />
                        {admin.adminProfile.responseTime !== null
                          ? `<${admin.adminProfile.responseTime} mnt`
                          : "Respons belum tersedia"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Skor {admin.adminProfile.trustScore}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {transactionSubmitError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {transactionSubmitError}
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!selected || submitting || loadingAdmins || admins.length === 0 || Boolean(adminLoadError)}
            onClick={() => void confirm()}
            aria-label="Buat transaksi"
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" /> Membuat transaksi...
              </>
            ) : (
              "Lanjutkan ke Transaksi"
            )}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
