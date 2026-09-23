import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/transactions";
import { createOrRecoverPayment, getPaymentForBuyer, PaymentServiceError } from "@/lib/payments/payment-service";

function responseForError(error: unknown) {
  if (error instanceof PaymentServiceError) {
    console.error("PaymentServiceError:", error);

    return NextResponse.json(
      { error: error.message, code: error.code },
      {
        status: error.statusCode,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("Payment API operational error:", error);
  } else {
    console.error("Payment API operational error");
  }

  return NextResponse.json(
    {
      error: "Payment belum dapat diproses. Coba lagi nanti.",
      code: "PAYMENT_OPERATIONAL_ERROR",
    },
    {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}

function privateResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return privateResponse({ error: "Login diperlukan." }, 401);
  const payment = await getPaymentForBuyer(params.id, user.id);
  if (!payment) return privateResponse({ error: "Payment tidak ditemukan." }, 404);
  return privateResponse({ payment });
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return privateResponse({ error: "Login diperlukan." }, 401);
  try {
    const payment = await createOrRecoverPayment(params.id, user.id);
    return privateResponse({ payment }, 201);
  } catch (error) { return responseForError(error); }
}
