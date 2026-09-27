import { NextResponse } from "next/server";
import { checkoutNegotiation, NegotiationError } from "@/lib/negotiations";
import { getAuthenticatedUser } from "@/lib/transactions";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  try {
    return NextResponse.json({ transactionId: await checkoutNegotiation(params.id, user) });
  } catch (error) {
    if (error instanceof NegotiationError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("POST /api/negotiations/[id]/checkout failed", error);
    return NextResponse.json({ error: "Pembayaran belum dapat dibuka." }, { status: 500 });
  }
}
