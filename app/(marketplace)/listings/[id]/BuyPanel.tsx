"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import type { ListingStatus } from "@/types";
import type { TransactionAdminOption } from "@/types/transaction-api";
import {
  getApiErrorMessage,
  parseTransactionAdminListResponse,
  parseTransactionDetailResponse,
  readJsonResponse,
} from "@/lib/transaction-api-client";

interface BuyPanelProps {
  listingId: string;
  listingStatus: ListingStatus;
  compact?: boolean;
}

export function BuyPanel({ listingId, listingStatus, compact = false }: BuyPanelProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState<TransactionAdminOption[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [creatingAdminId, setCreatingAdminId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function openAdminPicker() {
    if (listingStatus !== "AVAILABLE" || isLoadingAdmins || creatingAdminId) return;

    setIsDialogOpen(true);
    setIsLoadingAdmins(true);
    setAdmins([]);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admins", { cache: "no-store" });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Daftar admin Rekber tidak dapat dimuat."));
      }

      let result: ReturnType<typeof parseTransactionAdminListResponse>;
      try {
        result = parseTransactionAdminListResponse(payload);
      } catch {
        throw new Error("Respons daftar admin tidak valid. Silakan coba lagi.");
      }

      setAdmins(result.admins);
      if (result.admins.length === 0) {
        setErrorMessage("Belum ada admin Rekber yang aktif. Silakan coba lagi nanti.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Daftar admin Rekber tidak dapat dimuat."
      );
    } finally {
      setIsLoadingAdmins(false);
    }
  }

  async function createTransaction(admin: TransactionAdminOption) {
    if (creatingAdminId) return;

    setCreatingAdminId(admin.id);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, adminId: admin.id }),
      });
      const payload = await readJsonResponse(response);

      if (response.status === 401) {
        setIsDialogOpen(false);
        router.push(`/login?callbackUrl=${encodeURIComponent(`/listings/${listingId}`)}`);
        return;
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Transaksi tidak dapat diajukan."));
      }

      let result: ReturnType<typeof parseTransactionDetailResponse>;
      try {
        result = parseTransactionDetailResponse(payload);
      } catch {
        throw new Error("Transaksi dibuat, tetapi responsnya tidak dapat dibaca. Periksa daftar transaksi Anda.");
      }

      toast.success("Transaksi berhasil diajukan.");
      router.push(`/user/transactions/${encodeURIComponent(result.transaction.id)}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Transaksi tidak dapat diajukan. Silakan coba lagi."
      );
    } finally {
      setCreatingAdminId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openAdminPicker()}
        disabled={listingStatus !== "AVAILABLE" || isLoadingAdmins}
        className={`w-full ${
          compact ? "py-2.5 px-4 text-sm" : "py-3.5 px-4 text-base"
        } flex items-center justify-center gap-2 rounded-xl bg-blue-600 font-extrabold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Ajukan transaksi"
      >
        {isLoadingAdmins ? (
          <>
            <Loader2 className={`${compact ? "h-4 w-4" : "h-5 w-5"} animate-spin`} aria-hidden="true" />
            Memuat Admin...
          </>
        ) : (
          <>
            <ShieldCheck className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden="true" />
            {listingStatus === "AVAILABLE" ? "Ajukan Transaksi" : "Listing Tidak Tersedia"}
          </>
        )}
      </button>

      <Dialog.Root
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!creatingAdminId) setIsDialogOpen(open);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60 p-4" />
          <Dialog.Content
            aria-describedby="admin-picker-description"
            className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-bold text-slate-900">
                  Pilih admin Rekber
                </Dialog.Title>
                <Dialog.Description
                  id="admin-picker-description"
                  className="mt-1 text-sm leading-6 text-slate-600"
                >
                  Admin pilihan Anda akan mendampingi transaksi. Setelah dipilih, listing akan dikunci untuk transaksi ini.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={Boolean(creatingAdminId)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Tutup pilihan admin"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                <p>{errorMessage}</p>
                {!isLoadingAdmins && admins.length === 0 && (
                  <button
                    type="button"
                    onClick={() => void openAdminPicker()}
                    className="mt-2 min-h-11 rounded-lg px-2 font-semibold text-rose-900 underline decoration-rose-300 underline-offset-2 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    Muat ulang daftar admin
                  </button>
                )}
              </div>
            )}

            {isLoadingAdmins ? (
              <div className="flex min-h-28 items-center justify-center gap-3 text-sm font-medium text-slate-600" role="status">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
                Memuat admin aktif...
              </div>
            ) : admins.length > 0 ? (
              <div className="mt-5 space-y-2" aria-label="Daftar admin aktif">
                {admins.map((admin) => (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => void createTransaction(admin)}
                    disabled={Boolean(creatingAdminId)}
                    className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800" aria-hidden="true">
                      {admin.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-900">{admin.fullName}</span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        Skor kepercayaan {admin.adminProfile.trustScore} · {admin.adminProfile.totalSuccess} transaksi sukses
                      </span>
                      {admin.adminProfile.activeHours && (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          Jam aktif {admin.adminProfile.activeHours}
                        </span>
                      )}
                    </span>
                    {creatingAdminId === admin.id ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
