import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/transactions";
import { listNegotiations, NegotiationError, openNegotiation } from "@/lib/negotiations";

const createSchema = z.object({ listingId: z.string().trim().min(1) });

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  try {
    return NextResponse.json({ negotiations: await listNegotiations(user.id) });
  } catch (error) {
    console.error("GET /api/negotiations failed", error);
    return NextResponse.json({ error: "Negosiasi tidak dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Listing tidak valid." }, { status: 400 });
  try {
    return NextResponse.json({ negotiation: await openNegotiation(parsed.data.listingId, user) });
  } catch (error) {
    if (error instanceof NegotiationError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("POST /api/negotiations failed", error);
    return NextResponse.json({ error: "Negosiasi tidak dapat dibuka." }, { status: 500 });
  }
}
