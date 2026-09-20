import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data registrasi belum lengkap atau tidak valid." },
      { status: 400 }
    );
  }

  const { fullName, username, email, password } = parsed.data;
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        error:
          existingUser.email === email
            ? "Email sudah terdaftar."
            : "Username sudah digunakan.",
      },
      { status: 409 }
    );
  }

  const supabase = createSupabaseServiceClient();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { fullName, username },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Akun tidak dapat dibuat." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        fullName,
        role: "USER",
        isVerified: false,
      },
      select: { id: true, email: true, username: true, fullName: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.error("POST /api/auth/register failed", error);
    return NextResponse.json(
      { error: "Profil user tidak dapat dibuat." },
      { status: 500 }
    );
  }
}