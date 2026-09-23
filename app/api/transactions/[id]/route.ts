import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TransactionApiDetailResponse } from "@/types/transaction-api";
import {
  getAuthenticatedUser,
  isTransactionParticipant,
  toTransactionApiDto,
  transactionInclude,
} from "@/lib/transactions";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: transactionInclude,
    });

    if (transaction && isTransactionParticipant(transaction, authUser.id)) {
      const response: TransactionApiDetailResponse = {
        transaction: toTransactionApiDto(transaction),
      };
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  } catch (error) {
    console.error("GET /api/transactions/[id] failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil transaksi." },
      { status: 500 }
    );
  }
}
