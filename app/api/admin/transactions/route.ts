import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  toTransactionApiDto,
  transactionInclude,
} from "@/lib/transactions";
import type { TransactionApiListResponse } from "@/types/transaction-api";

export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("Login diperlukan.", 401);
  }

  if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
    return errorResponse("Akses ditolak. Hanya Admin yang dapat mengakses endpoint ini.", 403);
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { adminId: user.id },
      orderBy: { createdAt: "desc" },
      include: transactionInclude,
    });

    const response: TransactionApiListResponse = {
      transactions: transactions.map(toTransactionApiDto),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/admin/transactions failed", error);
    return errorResponse("Terjadi kesalahan saat mengambil data transaksi admin.", 500);
  }
}
