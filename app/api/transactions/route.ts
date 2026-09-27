import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { TransactionApiDetailResponse, TransactionApiListResponse } from "@/types/transaction-api";
import { checkoutNegotiation, NegotiationError } from "@/lib/negotiations";
import {
  assertBuyerCanStartTransaction,
  getAuthenticatedUser,
  toTransactionApiDto,
  TransactionApiError,
  transactionInclude,
} from "@/lib/transactions";

const createTransactionSchema = z.object({ negotiationId: z.string().trim().min(1) });

function errorResponse(error: unknown) {
  if (error instanceof TransactionApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  if (error instanceof NegotiationError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  console.error("Transaction API error", error);
  return NextResponse.json(
    { error: "Terjadi kesalahan saat memproses transaksi." },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  try {
    assertBuyerCanStartTransaction(user);
  } catch (error) {
    return errorResponse(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "negotiationId wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const transactionId = await checkoutNegotiation(parsed.data.negotiationId, user!);
    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId }, include: transactionInclude,
    });

    const response: TransactionApiDetailResponse = {
      transaction: toTransactionApiDto(transaction),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }, { adminId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      include: transactionInclude,
    });

    const response: TransactionApiListResponse = {
      transactions: transactions.map(toTransactionApiDto),
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
