export const WHATSAPP_COUNTRIES = [
  { code: "62", name: "Indonesia", flag: "🇮🇩" },
  { code: "60", name: "Malaysia", flag: "🇲🇾" },
  { code: "65", name: "Singapura", flag: "🇸🇬" },
  { code: "63", name: "Filipina", flag: "🇵🇭" },
  { code: "66", name: "Thailand", flag: "🇹🇭" },
  { code: "84", name: "Vietnam", flag: "🇻🇳" },
  { code: "1", name: "Amerika Serikat/Kanada", flag: "🇺🇸" },
] as const;

export type WhatsappCountryCode = (typeof WHATSAPP_COUNTRIES)[number]["code"];

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

export function normalizeUsername(input: string) {
  const username = input.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new Error("Username harus terdiri dari 3–30 huruf, angka, atau garis bawah.");
  }
  return username;
}

export function detectAvatarMimeType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg" as const;
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((byte, index) => bytes[index] === byte)) return "image/png" as const;

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp" as const;
  }

  return null;
}

export function validateAvatarImage(bytes: Uint8Array) {
  if (bytes.length === 0) throw new Error("Pilih gambar avatar terlebih dahulu.");
  if (bytes.length > MAX_AVATAR_SIZE_BYTES) throw new Error("Ukuran avatar maksimal 2 MB.");
  const mimeType = detectAvatarMimeType(bytes);
  if (!mimeType) throw new Error("Avatar harus berupa gambar JPEG, PNG, atau WebP yang valid.");
  return mimeType;
}

export function getOwnedAvatarStoragePath(avatarUrl: string | null, userId: string) {
  if (!avatarUrl || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const url = new URL(avatarUrl);
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const prefix = `/storage/v1/object/public/avatars/${userId}/`;
    if (url.origin !== supabaseUrl.origin || !url.pathname.startsWith(prefix)) return null;
    return decodeURIComponent(url.pathname.slice("/storage/v1/object/public/avatars/".length));
  } catch {
    return null;
  }
}

export function normalizeWhatsappNumber(countryCode: WhatsappCountryCode, input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^[+\d\s().-]+$/.test(trimmed)) throw new Error("Nomor WhatsApp hanya boleh berisi angka dan pemisah umum.");

  let local = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    if (!local.startsWith(countryCode)) throw new Error("Kode negara nomor WhatsApp tidak cocok dengan pilihan.");
    local = local.slice(countryCode.length);
  } else if (countryCode === "62" && local.startsWith("62")) {
    local = local.slice(2);
  }
  local = local.replace(/^0+/, "");

  if (countryCode === "62" ? !/^8\d{7,12}$/.test(local) : !/^\d{7,14}$/.test(local)) {
    throw new Error("Nomor WhatsApp tidak valid untuk kode negara yang dipilih.");
  }
  return `${countryCode}${local}`;
}

export function splitWhatsappNumber(value: string | null) {
  const country = WHATSAPP_COUNTRIES.find((item) => value?.startsWith(item.code));
  return {
    countryCode: country?.code ?? "62",
    localNumber: value ? value.slice(country?.code.length ?? 0) : "",
  };
}
