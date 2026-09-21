"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function safeCallbackUrl(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        setError("Email atau password tidak valid, atau akun belum terhubung ke Rekberin.");
        return;
      }

      const callbackUrl = safeCallbackUrl(searchParams?.callbackUrl);

      router.replace(callbackUrl ?? "/");
      router.refresh();
    } catch {
      setError("Login tidak dapat diproses. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <div className="mb-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <LogIn size={21} aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold">Masuk ke Rekberin</h1>
          <p className="mt-1 text-sm text-txt-secondary">
            Gunakan akun yang terdaftar di Rekberin untuk melanjutkan transaksi.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
          <div>
            <label htmlFor="email" className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm outline-none focus:border-accent-primary focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                className="min-h-11 w-full rounded-lg border border-border bg-bg-elevated px-3 pr-12 text-sm outline-none focus:border-accent-primary focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-r-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full min-h-11" disabled={loading}>
            {loading ? (
              <><Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" /> Memproses...</>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-txt-secondary">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-accent-primary hover:underline">
            Daftar
          </Link>
        </p>
      </Card>
    </div>
  );
}
