"use client";

import { useCallback, useEffect, useState } from "react";
import type { TransactionApiResponse } from "@/types/transaction-api";
import {
  getApiErrorMessage,
  parseTransactionDetailResponse,
  parseTransactionListResponse,
  readJsonResponse,
} from "@/lib/transaction-api-client";

export function useTransactions() {
  const [data, setData] = useState<TransactionApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions", { cache: "no-store" });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Transaksi tidak dapat dimuat."));
      }

      const result = parseTransactionListResponse(payload);
      setData(result.transactions);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Transaksi tidak dapat dimuat."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useTransaction(id: string) {
  const [data, setData] = useState<TransactionApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload, "Detail transaksi tidak dapat dimuat.")
        );
      }

      const result = parseTransactionDetailResponse(payload);
      setData(result.transaction);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Detail transaksi tidak dapat dimuat."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
