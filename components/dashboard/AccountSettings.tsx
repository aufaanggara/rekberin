"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { splitWhatsappNumber, WHATSAPP_COUNTRIES } from "@/lib/user-settings";
import type { CurrentUser } from "@/hooks/useCurrentUser";

type UserResponse = { user?: CurrentUser; error?: string };

async function readUserResponse(response: Response) {
  return (await response.json().catch(() => ({}))) as UserResponse;
}

export function AccountSettings() {
  const { data: user, isLoading, refetch } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState<(typeof WHATSAPP_COUNTRIES)[number]["code"]>("62");
  const [localNumber, setLocalNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const whatsapp = splitWhatsappNumber(user.whatsappNumber);
    setFullName(user.fullName);
    setUsername(user.username);
    setCountryCode(whatsapp.countryCode);
    setLocalNumber(whatsapp.localNumber);
    setAvatarPreview(user.avatarUrl);
  }, [user?.id, user?.fullName, user?.username, user?.whatsappNumber, user?.avatarUrl]);

  useEffect(() => () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, whatsappCountryCode: countryCode, whatsappLocalNumber: localNumber }),
      });
      const payload = await readUserResponse(response);
      if (!response.ok) throw new Error(payload.error || "Pengaturan akun belum dapat disimpan.");
      await refetch();
      toast.success("Pengaturan akun berhasil disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pengaturan akun belum dapat disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran avatar maksimal 2 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsAvatarBusy(true);
    try {
      const form = new FormData();
      form.set("avatar", file);
      const response = await fetch("/api/me/avatar", { method: "POST", body: form });
      const payload = await readUserResponse(response);
      if (!response.ok || !payload.user) throw new Error(payload.error || "Avatar belum dapat diunggah.");
      setAvatarPreview(payload.user.avatarUrl);
      await refetch();
      toast.success("Foto profil berhasil diperbarui.");
    } catch (error) {
      setAvatarPreview(user?.avatarUrl ?? null);
      toast.error(error instanceof Error ? error.message : "Avatar belum dapat diunggah.");
    } finally {
      setIsAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setIsAvatarBusy(true);
    try {
      const response = await fetch("/api/me/avatar", { method: "DELETE" });
      const payload = await readUserResponse(response);
      if (!response.ok || !payload.user) throw new Error(payload.error || "Avatar belum dapat dihapus.");
      setAvatarPreview(null);
      await refetch();
      toast.success("Foto profil dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Avatar belum dapat dihapus.");
    } finally {
      setIsAvatarBusy(false);
    }
  }

  return (
    <section aria-labelledby="account-settings-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6">
        <h2 id="account-settings-title" className="text-lg font-bold text-slate-900">Pengaturan Akun</h2>
        <p className="mt-1 text-sm text-slate-600">Perbarui profil yang digunakan buyer dan seller.</p>
      </div>

      {isLoading && !user ? <p className="text-sm text-slate-600" aria-busy="true">Memuat profil...</p> : !user ? (
        <p className="text-sm text-red-700" role="alert">Profil akun tidak dapat dimuat. Muat ulang halaman untuk mencoba lagi.</p>
      ) : (
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-700 ring-1 ring-slate-200">
              {avatarPreview ? <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8" aria-hidden="true" />}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">Foto profil</p>
              <p className="text-xs text-slate-500">JPEG, PNG, atau WebP · maksimal 2 MB</p>
              <div className="flex flex-wrap gap-2">
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Pilih foto profil" onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void uploadAvatar(file);
                }} />
                <button type="button" disabled={isAvatarBusy} onClick={() => fileInput.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  {isAvatarBusy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                  Unggah foto
                </button>
                {avatarPreview && <button type="button" disabled={isAvatarBusy} onClick={() => void removeAvatar()} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden="true" />Hapus foto</button>}
              </div>
            </div>
          </div>

          <form onSubmit={(event) => void saveSettings(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-full-name" className="mb-1.5 block text-sm font-semibold text-slate-800">Nama lengkap</label>
                <input id="settings-full-name" autoComplete="name" required minLength={2} maxLength={80} value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="settings-username" className="mb-1.5 block text-sm font-semibold text-slate-800">Username</label>
                <div className="flex min-h-11 items-center rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500"><span className="pl-3 text-sm text-slate-400">@</span><input id="settings-username" autoComplete="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} className="h-10 min-w-0 flex-1 rounded-r-xl px-2 text-sm text-slate-900 focus-visible:outline-none" /></div>
                <p className="mt-1 text-xs text-slate-500">3–30 huruf, angka, atau garis bawah.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-email" className="mb-1.5 block text-sm font-semibold text-slate-800">Email</label>
                <input id="settings-email" type="email" value={user.email} readOnly aria-readonly="true" className="min-h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500" />
                <p className="mt-1 text-xs text-slate-500">Email tidak dapat diubah dari pengaturan profil.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-whatsapp-country" className="mb-1.5 block text-sm font-semibold text-slate-800">WhatsApp</label>
                <div className="grid grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.2fr)] gap-2">
                  <select id="settings-whatsapp-country" value={countryCode} onChange={(event) => setCountryCode(event.target.value as typeof countryCode)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    {WHATSAPP_COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.name} (+{country.code})</option>)}
                  </select>
                  <label htmlFor="settings-whatsapp-number" className="sr-only">Nomor WhatsApp</label>
                  <input id="settings-whatsapp-number" type="tel" inputMode="tel" autoComplete="tel-national" value={localNumber} onChange={(event) => setLocalNumber(event.target.value)} placeholder={countryCode === "62" ? "81234567890" : "Nomor lokal"} className="min-h-11 min-w-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
                </div>
                <p className="mt-1 text-xs text-slate-500">Disimpan sebagai angka internasional, misalnya 6281234567890.</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isSaving ? "Menyimpan..." : "Simpan pengaturan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
