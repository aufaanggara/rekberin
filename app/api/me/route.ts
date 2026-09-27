import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/transactions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { WHATSAPP_COUNTRIES, normalizeUsername, normalizeWhatsappNumber } from "@/lib/user-settings";
import type { WhatsappCountryCode } from "@/lib/user-settings";

export const dynamic = "force-dynamic";

const userSelect = {
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

const settingsSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  whatsappCountryCode: z.enum(WHATSAPP_COUNTRIES.map((country) => country.code) as ["62", ...string[]]),
  whatsappLocalNumber: z.string().max(32),
});

export async function GET() {
  const authUser = await getAuthenticatedUser();

  if (!authUser) {
    return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: userSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/me failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil profil." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nama atau nomor WhatsApp tidak valid." }, { status: 400 });

  let whatsappNumber: string | null;
  let username: string;
  try {
    username = normalizeUsername(parsed.data.username);
    whatsappNumber = normalizeWhatsappNumber(parsed.data.whatsappCountryCode as WhatsappCountryCode, parsed.data.whatsappLocalNumber);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nomor WhatsApp tidak valid." }, { status: 400 });
  }

  try {
    const existingUsername = await prisma.user.findFirst({
      where: { id: { not: authUser.id }, username: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingUsername) return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: { fullName: parsed.data.fullName, username, whatsappNumber },
      select: userSelect,
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    }
    console.error("PATCH /api/me failed", error);
    return NextResponse.json({ error: "Pengaturan akun belum dapat disimpan." }, { status: 500 });
  }
}
