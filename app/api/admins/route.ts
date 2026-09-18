import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  TransactionAdminListResponse,
  TransactionAdminOption,
} from "@/types/transaction-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
        adminProfile: { is: { isActive: true } },
      },
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        adminProfile: {
          select: {
            activeHours: true,
            trustScore: true,
            responseTime: true,
            totalSuccess: true,
            isActive: true,
          },
        },
      },
    });

    const response: TransactionAdminListResponse = {
      admins: admins.flatMap((admin): TransactionAdminOption[] => {
        if (!admin.adminProfile) return [];

        return [
          {
            id: admin.id,
            username: admin.username,
            fullName: admin.fullName,
            avatarUrl: admin.avatarUrl,
            role: admin.role,
            isVerified: admin.isVerified,
            adminProfile: admin.adminProfile,
          },
        ];
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/admins failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil daftar admin." },
      { status: 500 }
    );
  }
}
