import { getApiErrorMessage, readJsonResponse } from "@/lib/transaction-api-client";
import type { HandoverAction } from "@/lib/handover-flow";

export async function submitHandoverAction(
  transactionId: string,
  action: HandoverAction,
  details: { reason?: string; whatsapp?: string | null } = {}
) {
  const response = await fetch(
    `/api/transactions/${encodeURIComponent(transactionId)}/handover`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...details }),
    }
  );
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Serah terima tidak dapat diproses."));
  }
}
