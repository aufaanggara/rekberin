import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/transactions";
import {
  getHandoverSnapshot,
  HandoverServiceError,
  transitionHandover,
} from "@/lib/handover-service";

const handoverActionSchema = z.object({
  action: z.enum(["START", "CONFIRM_RECEIPT"]),
});

function privateResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function errorResponse(error: unknown) {
  if (error instanceof HandoverServiceError) {
    return privateResponse({ error: error.message, code: error.code }, error.statusCode);
  }

  console.error("Handover API error", error);
  return privateResponse(
    { error: "Proses handover belum dapat diproses. Coba lagi nanti.", code: "HANDOVER_OPERATIONAL_ERROR" },
    503
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return privateResponse({ error: "Login diperlukan." }, 401);

  try {
    return privateResponse({ handover: await getHandoverSnapshot(params.id, user) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return privateResponse({ error: "Login diperlukan." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateResponse({ error: "Body request tidak valid." }, 400);
  }

  const parsed = handoverActionSchema.safeParse(body);
  if (!parsed.success) {
    return privateResponse({ error: "action harus berupa START atau CONFIRM_RECEIPT." }, 400);
  }

  try {
    const handover = await transitionHandover(params.id, user, parsed.data.action);
    return privateResponse({ handover });
  } catch (error) {
    return errorResponse(error);
  }
}
