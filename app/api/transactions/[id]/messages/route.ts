import { NextResponse } from "next/server";
import { z } from "zod";
import { Role, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/transactions";

const messageSchema = z.object({ message: z.string().trim().min(1).max(2000) });
const senderSelect = { id: true, username: true, fullName: true, role: true } as const;

async function authorizedTransaction(transactionId: string, user: { id: string; role: Role }) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, buyerId: true, sellerId: true, adminId: true, adminJoinedAt: true, status: true },
  });
  if (!transaction) return { error: "Transaksi tidak ditemukan.", status: 404 } as const;
  const isParticipant = transaction.buyerId === user.id || transaction.sellerId === user.id;
  const isJoinedAdmin = transaction.adminId === user.id && transaction.adminJoinedAt !== null &&
    (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN);
  if (!isParticipant && !isJoinedAdmin) return { error: "Akses chat ditolak.", status: 403 } as const;
  return { transaction } as const;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const access = await authorizedTransaction(params.id, user);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { transactionId: params.id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { sender: { select: senderSelect } },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/transactions/[id]/messages failed", error);
    return NextResponse.json({ error: "Pesan tidak dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pesan harus berisi 1 sampai 2000 karakter." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (db) => {
      await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${params.id}))`;
      const transaction = await db.transaction.findUnique({
        where: { id: params.id },
        select: { buyerId: true, sellerId: true, adminId: true, adminJoinedAt: true, status: true },
      });
      if (!transaction) return { error: "Transaksi tidak ditemukan.", status: 404 } as const;
      const isParticipant = transaction.buyerId === user.id || transaction.sellerId === user.id;
      const isJoinedAdmin = transaction.adminId === user.id && transaction.adminJoinedAt !== null &&
        (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN);
      if (!isParticipant && !isJoinedAdmin) return { error: "Akses chat ditolak.", status: 403 } as const;
      if (transaction.status === TransactionStatus.COMPLETED || transaction.status === TransactionStatus.CANCELLED) {
        return { error: "Chat transaksi sudah ditutup.", status: 409 } as const;
      }
      const message = await db.chatMessage.create({
        data: { transactionId: params.id, senderId: user.id, message: parsed.data.message },
        include: { sender: { select: senderSelect } },
      });
      return { message } as const;
    }, { maxWait: 15_000, timeout: 30_000 });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ message: result.message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions/[id]/messages failed", error);
    return NextResponse.json({ error: "Pesan tidak dapat dikirim." }, { status: 500 });
  }
}
