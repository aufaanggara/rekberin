"use client";

import { useCallback, useEffect, useState } from "react";
import type { Listing } from "@/types";
import type {
  UpdateListingRequest,
  ListingApiResponse,
} from "@/types/listing-api";
import {
  mapListingApiToListing,
  parseListingDetailResponse,
  parseListingListResponse,
} from "@/lib/listing-api-client";
import { getApiErrorMessage, readJsonResponse } from "@/lib/transaction-api-client";

import { dummyListings } from "@/data/dummy";

export function useListings() {
  const [data, setData] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/listings", { cache: "no-store" });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Listing tidak dapat dimuat."));
      }
      const result = parseListingListResponse(payload);
      setData(result.listings.map(mapListingApiToListing));
    } catch (requestError) {
      // Fallback to dummy listings
      setData(dummyListings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useMyListings() {
  const [data, setData] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/listings?mine=true", { cache: "no-store" });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Listing tidak dapat dimuat."));
      }
      const result = parseListingListResponse(payload);
      setData(result.listings.map(mapListingApiToListing));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Listing tidak dapat dimuat."
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

export function useListing(id: string) {
  const [data, setData] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Detail listing tidak dapat dimuat."));
      }
      const result = parseListingDetailResponse(payload);
      setData(mapListingApiToListing(result.listing));
    } catch (requestError) {
      // Fallback to dummyListings
      const normalizedId = id.trim();
      const fallback = dummyListings.find(
        (l) =>
          l.id === normalizedId ||
          l.id === `lst_${normalizedId}` ||
          l.id.replace("lst_", "") === normalizedId
      );
      if (fallback) {
        setData(fallback);
        setError(null);
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Detail listing tidak dapat dimuat."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

// ── Mutation helpers ───────────────────────────────────────────────────

export async function updateListing(
  id: string,
  data: UpdateListingRequest
): Promise<ListingApiResponse> {
  const response = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Listing tidak dapat diupdate."));
  }

  const result = parseListingDetailResponse(payload);
  return result.listing;
}

export async function updateListingStatus(
  id: string,
  status: "INACTIVE" | "AVAILABLE"
): Promise<ListingApiResponse> {
  const response = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, "Status listing tidak dapat diubah.")
    );
  }

  const result = parseListingDetailResponse(payload);
  return result.listing;
}
