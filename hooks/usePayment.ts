"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaymentApiResponse } from "@/types/payment-api";
import { getPaymentApiError, parsePaymentDetailResponse, readPaymentResponse } from "@/lib/payment-api-client";

export function usePayment(transactionId: string, enabled = true) {
  const [payment, setPayment] = useState<PaymentApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const polling = useRef(false);

  const request = useCallback(async (method: "GET" | "POST", path = "") => {
    const response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}/payment${path}`, { method, cache: "no-store" });
    const payload = await readPaymentResponse(response);
    if (!response.ok) {
      // A first GET is intentionally allowed to miss: the buyer has not
      // clicked Create yet, so that is an empty state rather than an error.
      if (response.status === 404 && method === "GET") { setPayment(null); return null; }
      throw new Error(getPaymentApiError(payload, "Payment tidak dapat dimuat."));
    }
    const parsed = parsePaymentDetailResponse(payload);
    setPayment(parsed.payment);
    return parsed.payment;
  }, [transactionId]);

  const load = useCallback(async (method: "GET" | "POST" = "GET", path = "") => {
    setIsLoading(true); setError(null);
    try { return await request(method, path); }
    catch (e) { const message = e instanceof Error ? e.message : "Payment tidak dapat dimuat."; setError(message); return null; }
    finally { setIsLoading(false); }
  }, [request]);

  useEffect(() => { if (enabled) void load(); }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !payment || payment.status !== "PENDING" || polling.current) return;
    polling.current = true;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load("POST", "/sync");
    }, 10_000);
    return () => { polling.current = false; window.clearInterval(timer); };
  }, [enabled, payment?.status, load]);

  return { payment, isLoading, error, create: () => load("POST"), sync: () => load("POST", "/sync"), refetch: () => load() };
}
