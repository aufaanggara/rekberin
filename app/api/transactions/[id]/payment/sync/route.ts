import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/transactions";
import { syncPayment, PaymentServiceError } from "@/lib/payments/payment-service";

function privateResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return privateResponse({ error: "Login diperlukan." }, 401);
  try { return privateResponse({ payment: await syncPayment(params.id, user.id) }); }
  catch (error) {
    if (error instanceof PaymentServiceError) return privateResponse({ error: error.message, code: error.code }, error.statusCode);
    return privateResponse({ error: "Status payment belum dapat disinkronkan.", code: "MIDTRANS_UNAVAILABLE" }, 503);
  }
}
