import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/transactions";
import { changeOffer, getNegotiation, NegotiationError, toNegotiationDto } from "@/lib/negotiations";

const offerSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("OFFER"), price: z.number().int(), notes: z.string().max(500).optional() }),
  z.object({ action: z.enum(["ACCEPT", "REJECT"]), version: z.number().int().nonnegative() }),
]);

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  try {
    return NextResponse.json({ negotiation: toNegotiationDto(await getNegotiation(params.id, user.id)) });
  } catch (error) {
    if (error instanceof NegotiationError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("GET /api/negotiations/[id] failed", error);
    return NextResponse.json({ error: "Negosiasi tidak dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const parsed = offerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Tawaran tidak valid." }, { status: 400 });
  try {
    const action = parsed.data.action;
    const input = action === "OFFER"
      ? { price: parsed.data.price, notes: parsed.data.notes }
      : { version: parsed.data.version };
    return NextResponse.json({ negotiation: await changeOffer(params.id, user, action, input) });
  } catch (error) {
    if (error instanceof NegotiationError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("PATCH /api/negotiations/[id] failed", error);
    return NextResponse.json({ error: "Tawaran tidak dapat diproses." }, { status: 500 });
  }
}
