import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processExpiredHandovers } from "@/lib/handover-flow";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.HANDOVER_CRON_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret) return NextResponse.json({ error: "Cron belum dikonfigurasi." }, { status: 503 });
  const expected = Buffer.from(secret);
  const actual = Buffer.from(token);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }
  try {
    return NextResponse.json({ released: await processExpiredHandovers() });
  } catch (error) {
    console.error("POST /api/jobs/handover-expiry failed", error);
    return NextResponse.json({ error: "Pencairan dummy gagal diproses." }, { status: 500 });
  }
}
