"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  OffersResponse,
  CreditApiError,
  ListOffersParams,
} from "@/types/credit-offers";

export interface UseOffersOptions extends ListOffersParams {
  applicationId: string;
  tenantId: string;
  /** If true, do NOT auto-fetch on mount. Default: false. */
  enabled?: boolean;
  /** Refetch interval in ms. Default: undefined (no polling). */
  refetchInterval?: number;
}

export interface UseOffersResult {
  data: OffersResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: CreditApiError | Error | null;
  refetch: () => Promise<void>;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_NADAKKI_API_URL ??
  "https://nadakki-ai-suite.onrender.com";

/**
 * useOffers — fetch offers list for an application.
 *
 * Phase 2 impl: zero-deps fetch wrapper with useState + AbortController.
 * V1: refactor to SWR/React Query when stack policy lands per ADR.
 */
export function useOffers(options: UseOffersOptions): UseOffersResult {
  const {
    applicationId,
    tenantId,
    limit,
    offset,
    enabled = true,
    refetchInterval,
  } = options;

  const [data, setData] = useState<OffersResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<CreditApiError | Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback((): string => {
    const url = new URL(
      `/credit/applications/${applicationId}/offers`,
      BACKEND_URL,
    );
    if (typeof limit === "number") url.searchParams.set("limit", String(limit));
    if (typeof offset === "number")
      url.searchParams.set("offset", String(offset));
    return url.toString();
  }, [applicationId, limit, offset]);

  const doFetch = useCallback(async (): Promise<void> => {
    if (!enabled) return;
    if (!applicationId || !tenantId) {
      setError(new Error("applicationId and tenantId are required"));
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch(buildUrl(), {
        method: "GET",
        headers: {
          "X-Tenant-ID": tenantId,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CreditApiError;
        throw Object.assign(
          new Error(
            typeof body.detail === "string"
              ? body.detail
              : `HTTP ${response.status}`,
          ),
          { detail: body.detail, status: response.status },
        );
      }

      const json = (await response.json()) as OffersResponse;
      setData(json);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err as CreditApiError | Error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [applicationId, tenantId, enabled, buildUrl]);

  useEffect(() => {
    void doFetch();
    return () => abortRef.current?.abort();
  }, [doFetch]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const id = setInterval(() => {
      void doFetch();
    }, refetchInterval);
    return () => clearInterval(id);
  }, [refetchInterval, enabled, doFetch]);

  return {
    data,
    isLoading,
    isFetching,
    isError: error !== null,
    error,
    refetch: doFetch,
  };
}
