import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHandoverState, saveCredentials, addOtpLog } from "@/lib/handover";

const credentialsSchema = z.object({
  loginMethod: z.string().min(1),
  accountEmail: z.string().email(),
  accountPassword: z.string().min(1),
  backupCodes: z.string().optional(),
  notes: z.string().optional(),
});

const otpSchema = z.object({
  action: z.enum(["REQUEST", "SUBMIT"]),
  code: z.string().max(10).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      adminId: true,
      status: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const isParticipant =
    transaction.buyerId === user.id ||
    transaction.sellerId === user.id ||
    transaction.adminId === user.id;

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (!isParticipant && !isSuperAdmin) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const state = getHandoverState(params.id);

  // PRIVACY RULE:
  // Admin Rekber CANNOT view the account password.
  // Super Admin CAN view password only if transaction is DISPUTED.
  // Buyer and Seller CAN view credentials.
  const isAdminRekber = transaction.adminId === user.id;
  const isBuyerOrSeller = transaction.buyerId === user.id || transaction.sellerId === user.id;
  const canViewPassword =
    isBuyerOrSeller || (isSuperAdmin && transaction.status === "DISPUTED");

  const sanitizedCredentials = state.credentials
    ? {
        ...state.credentials,
        accountPassword: canViewPassword
          ? state.credentials.accountPassword
          : "•••••••• (Dirahasiakan untuk Admin)",
      }
    : null;

  return NextResponse.json({
    handover: {
      ...state,
      credentials: sanitizedCredentials,
      canViewPassword,
      isAdminRekber,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const actionType = url.searchParams.get("type"); // "credentials" | "otp"

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (actionType === "credentials") {
    // Only Seller can submit credentials
    if (transaction.sellerId !== user.id) {
      return NextResponse.json(
        { error: "Only the seller can submit account credentials" },
        { status: 403 }
      );
    }

    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updatedState = saveCredentials(params.id, {
      ...parsed.data,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ handover: updatedState });
  }

  if (actionType === "otp") {
    const parsed = otpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid OTP action" }, { status: 400 });
    }

    const isBuyer = transaction.buyerId === user.id;
    const isSeller = transaction.sellerId === user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Only buyer or seller can trigger OTP actions" }, { status: 403 });
    }

    if (parsed.data.action === "REQUEST" && !isBuyer) {
      return NextResponse.json({ error: "Only buyer can request OTP" }, { status: 403 });
    }

    if (parsed.data.action === "SUBMIT" && !isSeller) {
      return NextResponse.json({ error: "Only seller can submit OTP code" }, { status: 403 });
    }

    const maskedCode = parsed.data.code
      ? parsed.data.code.length > 2
        ? parsed.data.code.slice(0, 3) + "***"
        : parsed.data.code
      : undefined;

    const log = addOtpLog(params.id, {
      transactionId: params.id,
      action: parsed.data.action,
      actorRole: isBuyer ? "BUYER" : "SELLER",
      actorName: user.name || (isBuyer ? "Pembeli" : "Penjual"),
      codeMasked: maskedCode,
    });

    return NextResponse.json({ log }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
}
