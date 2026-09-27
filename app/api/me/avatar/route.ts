import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnedAvatarStoragePath, MAX_AVATAR_SIZE_BYTES, validateAvatarImage } from "@/lib/user-settings";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/transactions";

export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "avatars";
const AVATAR_LIMIT = MAX_AVATAR_SIZE_BYTES;

const avatarSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  whatsappNumber: true,
  role: true,
  isVerified: true,
  createdAt: true,
} as const;

async function ensureAvatarBucket() {
  const storage = createSupabaseServiceClient().storage;
  const existing = await storage.getBucket(AVATAR_BUCKET);
  if (existing.data) {
    const configured = await storage.updateBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: AVATAR_LIMIT,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (configured.error) throw configured.error;
    return storage;
  }

  const created = await storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: AVATAR_LIMIT,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (created.error) {
    const afterCreate = await storage.getBucket(AVATAR_BUCKET);
    if (!afterCreate.data) throw created.error;
    const configured = await storage.updateBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: AVATAR_LIMIT,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (configured.error) throw configured.error;
  }
  return storage;
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Form upload avatar tidak valid." }, { status: 400 });
  }

  const file = form.get("avatar");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Pilih gambar avatar terlebih dahulu." }, { status: 400 });
  }
  if (file.size > AVATAR_LIMIT) return NextResponse.json({ error: "Ukuran avatar maksimal 2 MB." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  let mimeType: ReturnType<typeof validateAvatarImage>;
  try {
    mimeType = validateAvatarImage(bytes);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "File avatar tidak valid." }, { status: 400 });
  }

  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
  const objectPath = `${authUser.id}/${crypto.randomUUID()}.${extension}`;
  let storageClient: ReturnType<typeof createSupabaseServiceClient>["storage"] | null = null;
  let uploadedPath: string | null = null;

  try {
    const storage = await ensureAvatarBucket();
    storageClient = storage;
    const current = await prisma.user.findUnique({ where: { id: authUser.id }, select: { avatarUrl: true } });
    if (!current) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    const uploaded = await storage.from(AVATAR_BUCKET).upload(objectPath, bytes, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploaded.error) throw uploaded.error;
    uploadedPath = objectPath;

    const avatarUrl = storage.from(AVATAR_BUCKET).getPublicUrl(objectPath).data.publicUrl;
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl },
      select: avatarSelect,
    });
    const previousPath = getOwnedAvatarStoragePath(current.avatarUrl, authUser.id);
    if (previousPath) {
      const removed = await storage.from(AVATAR_BUCKET).remove([previousPath]);
      if (removed.error) console.error("Old avatar cleanup failed", removed.error);
    }
    uploadedPath = null;
    return NextResponse.json({ user });
  } catch (error) {
    if (storageClient && uploadedPath) {
      const cleanup = await storageClient.from(AVATAR_BUCKET).remove([uploadedPath]);
      if (cleanup.error) console.error("Uploaded avatar cleanup failed", cleanup.error);
    }
    console.error("POST /api/me/avatar failed", error);
    return NextResponse.json({ error: "Avatar belum dapat diunggah." }, { status: 500 });
  }
}

export async function DELETE() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  try {
    const current = await prisma.user.findUnique({ where: { id: authUser.id }, select: { avatarUrl: true } });
    if (!current) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl: null },
      select: avatarSelect,
    });

    const storagePath = getOwnedAvatarStoragePath(current.avatarUrl, authUser.id);
    if (storagePath) {
      const storage = createSupabaseServiceClient().storage;
      const removed = await storage.from(AVATAR_BUCKET).remove([storagePath]);
      if (removed.error) console.error("Avatar removal cleanup failed", removed.error);
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("DELETE /api/me/avatar failed", error);
    return NextResponse.json({ error: "Avatar belum dapat dihapus." }, { status: 500 });
  }
}
