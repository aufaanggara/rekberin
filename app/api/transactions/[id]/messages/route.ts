import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

const transactionSelect = {
  id: true,
  buyerId: true,
  sellerId: true,
  adminId: true,
  status: true,
} as const;

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  return user?.id ?? null;
}

function isParticipant(
  transaction: { buyerId: string; sellerId: string; adminId: string },
  userId: string
) {
  return [transaction.buyerId, transaction.sellerId, transaction.adminId].includes(userId);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    select: transactionSelect,
  });

  if (!transaction || !isParticipant(transaction, userId)) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isInteger(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50;

  const messages = await prisma.chatMessage.findMany({
    where: { transactionId: transaction.id },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      sender: {
        select: { id: true, username: true, fullName: true, role: true },
      },
    },
  });

  return NextResponse.json({
    messages: messages.map((message) => ({
      id: message.id,
      transactionId: message.transactionId,
      sender: message.sender,
      message: message.message,
      createdAt: message.createdAt,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    select: transactionSelect,
  });

  if (!transaction || !isParticipant(transaction, userId)) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (["COMPLETED", "CANCELLED"].includes(transaction.status)) {
    return NextResponse.json(
      { error: "Chat is closed for this transaction" },
      { status: 409 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Message must contain 1 to 2000 characters" },
      { status: 400 }
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      transactionId: transaction.id,
      senderId: userId,
      message: parsed.data.message,
    },
    include: {
      sender: {
        select: { id: true, username: true, fullName: true, role: true },
      },
    },
  });

  return NextResponse.json(
    {
      message: {
        id: message.id,
        transactionId: message.transactionId,
        sender: message.sender,
        message: message.message,
        createdAt: message.createdAt,
      },
    },
    { status: 201 }
  );
}
