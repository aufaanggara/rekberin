"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CreateListingForm } from "@/components/marketplace/CreateListingForm";
import { useEffect, useState } from "react";
import type { ListingApiResponse } from "@/types/listing-api";
import {
  parseListingDetailResponse,
} from "@/lib/listing-api-client";
import {
  getApiErrorMessage,
  readJsonResponse,
} from "@/lib/transaction-api-client";

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [listing, setListing] = useState<ListingApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchListing() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload, "Listing tidak dapat dimuat.")
          );
        }

        const result = parseListingDetailResponse(payload);
        setListing(result.listing);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Listing tidak dapat dimuat."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchListing();
  }, [id]);

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm font-medium">Memuat data listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Listing Tidak Ditemukan
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {error || "Listing yang ingin Anda edit tidak ditemukan."}
            </p>
            <Link
              href="/user?tab=seller"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={14} /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6">
          <Link
            href={`/listings/${listing.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-2"
          >
            <ArrowLeft size={14} /> Kembali ke Listing
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Iklan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Perbarui informasi dan spesifikasi listing akunmu.
          </p>
        </div>

        <CreateListingForm
          editData={{
            id: listing.id,
            title: listing.title,
            game: listing.game,
            price: listing.price,
            description: listing.description,
            details: listing.details,
            images: listing.images,
          }}
        />
      </div>
    </div>
  );
}
