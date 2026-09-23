"use client";

import { useCallback, useEffect, useState } from "react";
import type { TransactionApiResponse } from "@/types/transaction-api";
import {
  getApiErrorMessage,
  parseTransactionListResponse,
  readJsonResponse,
} from "@/lib/transaction-api-client";

export function useAdminTransactions() {
  const [data, setData] = useState<TransactionApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/transactions", { cache: "no-store" });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Transaksi admin tidak dapat dimuat."));
      }

      const result = parseTransactionListResponse(payload);
      setData(result.transactions);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Transaksi admin tidak dapat dimuat."
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
