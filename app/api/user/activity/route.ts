import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/transactions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const privateNoStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Login diperlukan." },
        { status: 401, headers: privateNoStoreHeaders }
      );
    }

    const [negotiations, transactions] = await Promise.all([
      prisma.negotiation.findMany({
        where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          buyerId: true,
          sellerId: true,
          offeredPrice: true,
          offerStatus: true,
          listing: {
            select: { id: true, title: true, price: true, status: true },
          },
          buyer: { select: { username: true } },
          seller: { select: { username: true } },
          transaction: { select: { id: true } },
        },
      }),
      prisma.transaction.findMany({
        where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          buyerId: true,
          sellerId: true,
          status: true,
          price: true,
          listing: { select: { id: true, title: true } },
          buyer: { select: { username: true } },
          seller: { select: { username: true } },
        },
      }),
    ]);

    return NextResponse.json(
      { negotiations, transactions },
      { headers: privateNoStoreHeaders }
    );
  } catch (error) {
    console.error("GET /api/user/activity failed", error);
    return NextResponse.json(
      { error: "Aktivitas transaksi tidak dapat dimuat." },
      { status: 500, headers: privateNoStoreHeaders }
    );
  }
}
