import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateListingForm } from "@/components/marketplace/CreateListingForm";

export default function NewListingPublicPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-2"
          >
            <ArrowLeft size={14} /> Kembali ke Katalog
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Post Akun Game
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Isi spesifikasi akunmu dan unggah screenshot untuk mulai menjual dengan aman via Rekberin.
          </p>
        </div>

        <CreateListingForm />
      </div>
    </div>
  );
}
