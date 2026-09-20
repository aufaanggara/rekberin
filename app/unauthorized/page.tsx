import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <ShieldAlert size={42} className="mx-auto mb-4 text-amber-500" aria-hidden="true" />
      <h1 className="font-display text-2xl font-bold text-slate-900">Akses tidak diizinkan</h1>
      <p className="mt-2 text-sm text-slate-500">
        Akun Anda tidak memiliki role yang diperlukan untuk halaman ini.
      </p>
      <Link href="/" className="mt-6 inline-block">
        <Button>Kembali ke beranda</Button>
      </Link>
    </div>
  );
}