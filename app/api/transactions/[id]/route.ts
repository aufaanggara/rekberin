import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TransactionApiDetailResponse, TransactionApiResponse } from "@/types/transaction-api";
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

    // Fallback demo/active negotiation transactions for multi-buyer testing scenarios
    if (params.id === "trx_1" || params.id.startsWith("trx_")) {
      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      const isSellerScenario = params.id === "trx_seller_multi" || params.id === "trx_demo_3";
      const isSuspendedScenario = params.id === "trx_buyer_suspended";
      const isRekberScenario = params.id === "trx_buyer_rekber" || params.id === "trx_demo_2";

      const fallbackTransaction: TransactionApiResponse = {
        id: params.id,
        listingId: "lst_efootball_multi",
        buyerId: isSellerScenario ? "u_buyer_budi" : authUser.id,
        sellerId: isSellerScenario ? authUser.id : "u_seller_andi",
        adminId: "u_admin1",
        price: isRekberScenario ? 1450000 : 850000,
        platformFee: 5000,
        adminFee: 10000,
        status: isRekberScenario
          ? "PENDING_PAYMENT"
          : isSuspendedScenario
          ? "PENDING_PAYMENT"
          : "PENDING_PAYMENT",
        notes: isSuspendedScenario
          ? "Akun sedang diproses pembayaran oleh pembeli lain."
          : "Negosiasi dan transaksi akun eFootball 2024.",
        disputeReason: null,
        proofUrls: [],
        logs: [
          {
            action: "TRANSACTION_CREATED",
            actor: isSellerScenario ? "Budi Pratama" : dbUser?.username || "Pembeli",
            timestamp: new Date().toISOString(),
          },
        ],
        checklist: [
          { label: "Verifikasi email & Konami ID", checked: false },
          { label: "Pengamanan password akun game", checked: false },
          { label: "Ganti Two-Factor Authentication (2FA)", checked: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        listing: {
          id: "lst_efootball_multi",
          sellerId: isSellerScenario ? authUser.id : "u_seller_andi",
          title: "Akun eFootball 2024 Full Squad Big Time + Epic Booster 3150 OVR",
          game: "eFootball",
          price: 850000,
          description: "Full squad epic booster booster 3150 OVR. Akun pribadi tangan pertama aman 100%.",
          details: { overall: 3150, platform: "Android/iOS" },
          images: ["/screenshots/efootball_89.jpg"],
          status: isSuspendedScenario ? "IN_TRANSACTION" : "AVAILABLE",
          isFeatured: true,
          viewCount: 230,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          seller: {
            id: isSellerScenario ? authUser.id : "u_seller_andi",
            username: isSellerScenario ? dbUser?.username || "penjual_resmi" : "Andi_GamingStore",
            fullName: isSellerScenario ? dbUser?.fullName || "Penjual Rekberin" : "Andi Setiawan",
            avatarUrl: isSellerScenario ? dbUser?.avatarUrl || null : null,
            role: "USER",
            isVerified: true,
          },
        },
        buyer: {
          id: isSellerScenario ? "u_buyer_budi" : authUser.id,
          username: isSellerScenario ? "budi_pratama" : dbUser?.username || "Pembeli",
          fullName: isSellerScenario ? "Budi Pratama" : dbUser?.fullName || "Pembeli Rekberin",
          avatarUrl: isSellerScenario ? null : dbUser?.avatarUrl || null,
          role: "USER",
          isVerified: true,
        },
        seller: {
          id: isSellerScenario ? authUser.id : "u_seller_andi",
          username: isSellerScenario ? dbUser?.username || "penjual_resmi" : "Andi_GamingStore",
          fullName: isSellerScenario ? dbUser?.fullName || "Penjual Rekberin" : "Andi Setiawan",
          avatarUrl: isSellerScenario ? dbUser?.avatarUrl || null : null,
          role: "USER",
          isVerified: true,
        },
        admin: {
          id: "u_admin1",
          username: "anto_rekber",
          fullName: "Anto Wijaya (Admin Rekber)",
          avatarUrl: null,
          role: "ADMIN",
          isVerified: true,
          adminProfile: {
            id: "adm_1",
            bio: "Admin rekber resmi & escrow terpercaya",
            activeHours: "08:00 - 23:00 WIB",
            trustScore: 99,
            responseTime: 3,
            totalSuccess: 340,
            isActive: true,
            joinedAt: new Date().toISOString(),
          },
        },
      };

      return NextResponse.json({ transaction: fallbackTransaction });
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
