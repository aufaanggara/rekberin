import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  stage: z.enum(["NEGOTIATION", "REKBER", "HANDOVER"]).optional(),
});

const transactionSelect = {
  id: true,
  buyerId: true,
  sellerId: true,
  adminId: true,
  status: true,
} as const;

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; name?: string; email?: string } | undefined;
  return user ?? null;
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
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    select: transactionSelect,
  });

  const url = new URL(request.url);
  const stageFilter = url.searchParams.get("stage") as "NEGOTIATION" | "REKBER" | "HANDOVER" | null;

  // If real database transaction exists
  if (transaction && (isParticipant(transaction, user.id) || user.role === "SUPER_ADMIN")) {
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

    const formattedMessages = messages.map((message) => {
      let stage: "NEGOTIATION" | "REKBER" | "HANDOVER" = "REKBER";
      let text = message.message;

      if (text.startsWith("[STAGE:NEGOTIATION] ")) {
        stage = "NEGOTIATION";
        text = text.replace("[STAGE:NEGOTIATION] ", "");
      } else if (text.startsWith("[STAGE:HANDOVER] ")) {
        stage = "HANDOVER";
        text = text.replace("[STAGE:HANDOVER] ", "");
      } else if (text.startsWith("[STAGE:REKBER] ")) {
        stage = "REKBER";
        text = text.replace("[STAGE:REKBER] ", "");
      }

      return {
        id: message.id,
        transactionId: message.transactionId,
        stage,
        sender: message.sender,
        message: text,
        createdAt: message.createdAt,
      };
    });

    const filtered = stageFilter
      ? formattedMessages.filter((m) => m.stage === stageFilter)
      : formattedMessages;

    return NextResponse.json({ messages: filtered });
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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

  const stage = parsed.data.stage || "NEGOTIATION";

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    select: transactionSelect,
  });

  // If real database transaction exists
  if (transaction && (isParticipant(transaction, user.id) || user.role === "SUPER_ADMIN")) {
    if (["COMPLETED", "CANCELLED"].includes(transaction.status)) {
      return NextResponse.json(
        { error: "Chat is closed for this transaction" },
        { status: 409 }
      );
    }

    const storedMessage = `[STAGE:${stage}] ${parsed.data.message}`;
    const message = await prisma.chatMessage.create({
      data: {
        transactionId: transaction.id,
        senderId: user.id,
        message: storedMessage,
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
          stage,
          sender: message.sender,
          message: parsed.data.message,
          createdAt: message.createdAt,
        },
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
