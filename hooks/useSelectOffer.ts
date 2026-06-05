"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { CreditApiError, Offer } from "@/types/credit-offers";

export interface UseSelectOfferOptions {
  applicationId: string;
  tenantId: string;
  /** Offers source for resolving offerId → Offer. Inject from parent useOffers result. */
  offers: Offer[];
  onSuccess?: (selectedOffer: Offer) => void;
  onError?: (error: Error) => void;
}

export interface UseSelectOfferResult {
  selectOffer: (offerId: string) => Promise<Offer>;
  selectedOfferId: string | null;
  isSubmitting: boolean;
  error: Error | null;
}

/**
 * CORS fix (Audit #4.1): Always use relative URLs in the browser so requests
 * route through the Next.js BFF same-origin proxy instead of hitting the
 * Render backend directly (which rejects the OPTIONS preflight).
 */

const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "nadakki_sic_token";

function readBearerAccessToken(): string | null {
  const fromAuthV2 = tokenStorage.getAccessToken();
  if (fromAuthV2) return fromAuthV2;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
  }
  return null;
}

function isOffer(value: unknown): value is Offer {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.lender_code === "string";
}

function parseAcceptedOffer(body: unknown, offerId: string, offers: Offer[]): Offer {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (isOffer(record.offer)) return record.offer;
    if (isOffer(record)) return record;
  }

  const match = offers.find((o) => o.id === offerId);
  if (match) return match;

  throw new Error(`Offer ${offerId} not found in accept response or offers list`);
}

/**
 * useSelectOffer — accept an offer for an application.
 *
 * POST /api/v2/credit/applications/{id}/offers/{offer_id}/accept
 * Headers: X-Tenant-ID + Authorization Bearer + Content-Type
 */
export function useSelectOffer(
  options: UseSelectOfferOptions,
): UseSelectOfferResult {
  const { applicationId, tenantId, offers, onSuccess, onError } = options;
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const buildUrl = useCallback(
    (offerId: string): string =>
      `/api/v2/credit/applications/${applicationId}/offers/${offerId}/accept`,
    [applicationId],
  );

  const selectOffer = useCallback(
    async (offerId: string): Promise<Offer> => {
      setIsSubmitting(true);
      setError(null);

      if (!applicationId || !tenantId) {
        const err = new Error("applicationId and tenantId are required");
        setError(err);
        setIsSubmitting(false);
        onError?.(err);
        throw err;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const headers: Record<string, string> = {
        "X-Tenant-ID": tenantId,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      const token = readBearerAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        const response = await fetch(buildUrl(offerId), {
          method: "POST",
          headers,
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

        const body = (await response.json()) as unknown;
        const acceptedOffer = parseAcceptedOffer(body, offerId, offers);

        if (
          acceptedOffer.application_id !== applicationId ||
          acceptedOffer.tenant_id !== tenantId
        ) {
          throw new Error(
            "Offer application_id or tenant_id mismatch with options",
          );
        }

        setSelectedOfferId(offerId);
        onSuccess?.(acceptedOffer);
        return acceptedOffer;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          throw err;
        }
        const apiError = err as Error;
        setError(apiError);
        onError?.(apiError);
        throw apiError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [applicationId, tenantId, offers, buildUrl, onSuccess, onError],
  );

  return {
    selectOffer,
    selectedOfferId,
    isSubmitting,
    error,
  };
}
