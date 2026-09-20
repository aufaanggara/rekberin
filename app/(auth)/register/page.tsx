"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget as unknown as HTMLFormElement);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Registrasi tidak dapat diproses.");
      setLoading(false);
      return;
    }

    toast.success("Registrasi berhasil. Silakan masuk dengan akun Anda.");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <h1 className="font-display text-2xl font-bold mb-1">Daftar Rekberin</h1>
        <p className="text-txt-secondary text-sm mb-6">Buat akun untuk membeli atau menjual akun game.</p>

        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="text-xs text-txt-muted uppercase tracking-wider">Nama Lengkap</label>
            <input id="fullName" name="fullName" autoComplete="name" required className="w-full mt-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent-primary" />
          </div>
          <div>
            <label htmlFor="username" className="text-xs text-txt-muted uppercase tracking-wider">Username</label>
            <input id="username" name="username" autoComplete="username" required className="w-full mt-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent-primary" />
          </div>
          <div>
            <label htmlFor="email" className="text-xs text-txt-muted uppercase tracking-wider">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="w-full mt-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent-primary" />
          </div>
          <div>
            <label htmlFor="password" className="text-xs text-txt-muted uppercase tracking-wider">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="w-full mt-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent-primary" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Memproses..." : "Daftar"}</Button>
        </form>

        <p className="text-sm text-txt-secondary text-center mt-6">
          Sudah punya akun? <Link href="/login" className="text-accent-primary font-medium">Masuk</Link>
        </p>
      </Card>
    </div>
  );
}
