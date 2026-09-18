"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UploadCloud,
  X,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Gamepad2,
  Image as ImageIcon,
  Star,
  Eye,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { CreateListingRequest } from "@/types/listing-api";
import { parseListingDetailResponse } from "@/lib/listing-api-client";
import {
  getApiErrorMessage,
  readJsonResponse,
} from "@/lib/transaction-api-client";
import { toast } from "sonner";

const gameOptions = [
  { id: "eFootball", name: "eFootball 2025" },
  { id: "Mobile Legends", name: "Mobile Legends" },
  { id: "FC Mobile", name: "FC Mobile" },
];

const playerPresetsByGame: Record<string, string[]> = {
  eFootball: ["Messi (Big Time)", "Mbappe", "Haaland", "Vinicius Jr (Booster)", "Bellingham", "C. Ronaldo", "Modric", "Neymar Santos"],
  "Mobile Legends": ["Chou KOF", "Gusion Collector", "Hayabusa Shadow", "Fanny Skylark", "Claude Mecha"],
  "FC Mobile": ["R9 Ronaldo (Icon)", "Zidane", "Gullit", "Van Dijk", "Jairzinho"],
};

const sampleScreenshots = [
  { label: "Skuad eFootball", url: "/screenshots/efootball_89.jpg" },
  { label: "Pemain Legend", url: "/screenshots/efootball_legends.jpg" },
  { label: "Koin & GP", url: "/screenshots/efootball_rich.jpg" },
];

export function CreateListingForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [game, setGame] = useState("eFootball");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Specs
  const [overall, setOverall] = useState<number | "">(85);
  const [league, setLeague] = useState("Diamond");
  const [coins, setCoins] = useState<number | "">(100000);
  const [gp, setGp] = useState<number | "">(500000);
  const [loginMethod, setLoginMethod] = useState("Konami ID");
  const [isNominus, setIsNominus] = useState(true);
  const [hasWarranty, setHasWarranty] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(["Vinicius Jr", "Mbappe"]);
  const [customPlayerInput, setCustomPlayerInput] = useState("");
  const [notes, setNotes] = useState("Email single login, siap bantu ganti email pembeli sampai tuntas.");

  const [loading, setLoading] = useState(false);

  // Handle Multi Image Upload
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newImgs: string[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages((prev) => [...prev, e.target?.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setAsCover = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    toast.success("Foto sampul utama berhasil diubah!");
  };

  const addPresetImages = () => {
    setImages(sampleScreenshots.map((s) => s.url));
    toast.success("Contoh screenshot akun berhasil dimuat!");
  };

  const togglePlayer = (p: string) => {
    if (selectedPlayers.includes(p)) {
      setSelectedPlayers(selectedPlayers.filter((item) => item !== p));
    } else {
      setSelectedPlayers([...selectedPlayers, p]);
    }
  };

  const addCustomPlayer = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customPlayerInput.trim()) {
      e.preventDefault();
      if (!selectedPlayers.includes(customPlayerInput.trim())) {
        setSelectedPlayers([...selectedPlayers, customPlayerInput.trim()]);
      }
      setCustomPlayerInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      toast.error("Judul dan harga wajib diisi!");
      return;
    }

    setLoading(true);

    const request: CreateListingRequest = {
      title,
      game,
      price: Number(price),
      description: description || `Akun ${game} spek mantap siap push rank. Data aman nominus.`,
      details: {
        overall: Number(overall) || 85,
        league: league || "Division 1",
        coins: Number(coins) || 0,
        gp: Number(gp) || 0,
        players: selectedPlayers.length > 0 ? selectedPlayers : ["Pemain Bintang"],
        loginMethod,
        isNominus,
        hasWarranty,
        cardTypes: ["Epic Booster", "Big Time"],
        region: "Indonesia",
        notes,
      },
      images: images.length > 0 ? images : ["/screenshots/efootball_89.jpg"],
    };

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Silakan login sebelum membuat listing.");
          router.push(`/login?callbackUrl=${encodeURIComponent("/listings/new")}`);
          return;
        }
        throw new Error(getApiErrorMessage(payload, "Listing tidak dapat dibuat."));
      }

      const result = parseListingDetailResponse(payload);
      toast.success("Iklan akun berhasil diterbitkan ke katalog!");
      router.push(`/listings/${result.listing.id}`);
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Listing tidak dapat dibuat."
      );
    } finally {
      setLoading(false);
    }
  };

  const coverImage = images[0] || "/screenshots/efootball_89.jpg";

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      {/* Form Kiri */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. KOTAK UPLOAD FOTO MULTI-IMAGE DENGAN PREVIEW */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-600" /> Foto Screenshot Akun
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah minimal 1 foto (foto pertama otomatis jadi foto sampul di katalog)
              </p>
            </div>
            <button
              type="button"
              onClick={addPresetImages}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 cursor-pointer"
            >
              + Pakai Contoh Screenshot
            </button>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? "border-blue-500 bg-blue-50/60"
                : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud size={24} />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              Klik untuk pilih foto atau tarik gambar ke sini
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Mendukung PNG, JPG, JPEG (Screenshot squad, profil, koin)
            </p>
          </div>

          {/* Image Previews Grid */}
          {images.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-3">
                Foto Terunggah ({images.length} foto):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-200 group bg-slate-100 shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />

                    {/* Cover badge */}
                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Sampul
                      </span>
                    )}

                    {/* Action overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsCover(index)}
                          className="bg-white/90 hover:bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                        >
                          Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded cursor-pointer"
                        title="Hapus foto"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. INFORMASI UTAMA IKLAN */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Informasi Iklan</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Game</label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
              >
                {gameOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Harga Akun (Rp)</label>
              <input
                type="number"
                required
                placeholder="contoh: 350000"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-blue-600 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Judul Iklan Akun</label>
            <input
              type="text"
              required
              placeholder="contoh: Akun Gold League 82 OVR Epic Booster Vinicius"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Akun</label>
            <textarea
              rows={3}
              placeholder="Jelaskan kondisi akun, alasan jual, riwayat akun, dll."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* 3. DETAIL SPESIFIKASI GAME */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" /> Detail Spesifikasi Akun ({game})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Overall Rating (OVR)</label>
              <input
                type="number"
                value={overall}
                onChange={(e) => setOverall(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Divisi / Rank</label>
              <input
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="misal: Div 1 / Gold"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Koin Game</label>
              <input
                type="number"
                value={coins}
                onChange={(e) => setCoins(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Total GP / BP</label>
              <input
                type="number"
                value={gp}
                onChange={(e) => setGp(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Player Tag Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Pemain Bintang & Aset Utama (Klik untuk memilih):
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {playerPresetsByGame[game]?.map((p) => {
                const active = selectedPlayers.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlayer(p)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white border-blue-600 font-bold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {active ? "✓ " : "+ "} {p}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Ketik nama pemain lain lalu tekan Enter..."
              value={customPlayerInput}
              onChange={(e) => setCustomPlayerInput(e.target.value)}
              onKeyDown={addCustomPlayer}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Keamanan & Garansi Checkboxes */}
          <div className="pt-3 border-t border-slate-100 grid sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isNominus}
                onChange={(e) => setIsNominus(e.target.checked)}
                className="accent-blue-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 block">Akun Nominus (Email Bersih)</span>
                <span className="text-[11px] text-slate-500">Email siap diganti ke email pembeli</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={hasWarranty}
                onChange={(e) => setHasWarranty(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 block">Ada Garansi Anti-Hackback</span>
                <span className="text-[11px] text-slate-500">Jaminan aman dari seller</span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            "Menerbitkan Iklan Akun..."
          ) : (
            <>
              <CheckCircle2 size={18} /> Publikasikan Iklan ke Marketplace
            </>
          )}
        </button>
      </form>

      {/* Preview Card Kanan (Desktop) */}
      <div className="hidden lg:block sticky top-24 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Eye size={14} className="text-blue-600" /> Pratinjau Tampilan Iklan:
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Image */}
          <div className="aspect-[16/10] relative bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
            <span className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              {game}
            </span>
            <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Akun Ready
            </span>
          </div>

          {/* Details */}
          <div className="p-4 space-y-3">
            <div>
              <span className="text-lg font-extrabold text-blue-600 block">
                {price ? formatRupiah(Number(price)) : "Rp 0"}
              </span>
              <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mt-0.5">
                {title || "Judul Iklan Akunmu"}
              </h4>
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">RATING OVR</span>
                <span className="font-bold text-slate-900">{overall || 85}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DIVISI</span>
                <span className="font-bold text-slate-900 truncate block">{league || "Divisi 1"}</span>
              </div>
            </div>

            {/* Player chips */}
            {selectedPlayers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedPlayers.slice(0, 3).map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    ⭐ {p}
                  </span>
                ))}
                {selectedPlayers.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{selectedPlayers.length - 3} lainnya
                  </span>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">efootball_seller1</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <ShieldCheck size={12} /> Rekber Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
