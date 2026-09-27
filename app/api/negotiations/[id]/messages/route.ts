import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/transactions";
import { getNegotiation, NegotiationError } from "@/lib/negotiations";

const messageSchema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  try {
    await getNegotiation(params.id, user.id);
    const messages = await prisma.negotiationMessage.findMany({
      where: { negotiationId: params.id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, username: true, fullName: true, role: true } } },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof NegotiationError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("GET /api/negotiations/[id]/messages failed", error);
    return NextResponse.json({ error: "Pesan tidak dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pesan harus berisi 1 sampai 2000 karakter." }, { status: 400 });
  try {
    const message = await prisma.$transaction(async (db) => {
      await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${params.id}))`;
      const negotiation = await db.negotiation.findUnique({
        where: { id: params.id },
        include: { transaction: { select: { id: true } } },
      });
      if (!negotiation) throw new NegotiationError(404, "Negosiasi tidak ditemukan.");
      if (negotiation.buyerId !== user.id && negotiation.sellerId !== user.id) {
        throw new NegotiationError(403, "Anda bukan pihak dalam negosiasi ini.");
      }
      if (negotiation.transaction) throw new NegotiationError(409, "Chat sudah dipindah ke transaksi.");
      return db.negotiationMessage.create({
        data: { negotiationId: params.id, senderId: user.id, message: parsed.data.message },
        include: { sender: { select: { id: true, username: true, fullName: true, role: true } } },
      });
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof NegotiationError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("POST /api/negotiations/[id]/messages failed", error);
    return NextResponse.json({ error: "Pesan tidak dapat dikirim." }, { status: 500 });
  }
}
