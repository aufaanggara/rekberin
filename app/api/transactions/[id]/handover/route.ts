import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/transactions";
import { HandoverFlowError, runHandoverAction } from "@/lib/handover-flow";

const actionSchema = z.object({
  action: z.enum(["START", "CONFIRM_RECEIPT", "REPORT_ISSUE", "RESUME", "CANCEL", "SET_WHATSAPP"]),
  reason: z.string().optional(),
  whatsapp: z.string().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Aksi serah terima tidak valid." }, { status: 400 });
  }
  try {
    const { action, reason, whatsapp } = parsed.data;
    return NextResponse.json(await runHandoverAction(params.id, user, action, { reason, whatsapp }));
  } catch (error) {
    if (error instanceof HandoverFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("PATCH /api/transactions/[id]/handover failed", error);
    return NextResponse.json({ error: "Serah terima tidak dapat diproses." }, { status: 500 });
  }
}
