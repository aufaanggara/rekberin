import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isTransactionParticipant, toTransactionApiDto, transactionInclude } from "@/lib/transactions";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: transactionInclude,
    });
    if (!transaction) return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    if (!isTransactionParticipant(transaction, user.id)) {
      return NextResponse.json({ error: "Anda bukan pihak dalam transaksi ini." }, { status: 403 });
    }
    return NextResponse.json({ transaction: toTransactionApiDto(transaction) });
  } catch (error) {
    console.error("GET /api/transactions/[id] failed", error);
    return NextResponse.json({ error: "Transaksi tidak dapat dimuat." }, { status: 500 });
  }
}
