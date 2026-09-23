import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  type: z.enum(["BUYER_TO_SELLER", "BUYER_TO_ADMIN", "SELLER_TO_ADMIN"]).default("BUYER_TO_SELLER"),
});

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; name?: string; email?: string } | undefined;
  return user ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          include: {
            giver: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
            receiver: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (transaction) {
      return NextResponse.json({ reviews: transaction.reviews });
    }

    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  } catch (error) {
    console.error("GET /api/transactions/[id]/reviews error", error);
    return NextResponse.json({ error: "Gagal mengambil data review" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format review tidak valid. Rating harus bernilai antara 1 sampai 5." },
        { status: 400 }
      );
    }

    const { rating, comment, type } = parsed.data;

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (transaction) {
      // Determine receiver
      let receiverId = transaction.sellerId;
      if (type === "BUYER_TO_ADMIN" || type === "SELLER_TO_ADMIN") {
        receiverId = transaction.adminId;
      } else if (type === "BUYER_TO_SELLER") {
        receiverId = transaction.sellerId;
      }

      // Check if user already reviewed
      const existingReview = await prisma.review.findFirst({
        where: {
          transactionId: transaction.id,
          giverId: user.id,
          type,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "Anda sudah memberikan ulasan untuk transaksi ini." },
          { status: 409 }
        );
      }

      const review = await prisma.review.create({
        data: {
          transactionId: transaction.id,
          giverId: user.id,
          receiverId,
          rating,
          comment: comment || null,
          type,
        },
        include: {
          giver: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        },
      });

      return NextResponse.json({ review }, { status: 201 });
    }

    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  } catch (error) {
    console.error("POST /api/transactions/[id]/reviews error", error);
    return NextResponse.json({ error: "Gagal menyimpan review transaksi" }, { status: 500 });
  }
}
