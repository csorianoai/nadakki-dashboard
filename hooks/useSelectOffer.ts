"use client";

import { useCallback, useState } from "react";
import type { Offer } from "@/types/credit-offers";

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
 * MVP MOCK implementation — backend endpoint for offer selection NOT YET implemented.
 *
 * Behavior:
 * - Local state update for selectedOfferId
 * - 500ms setTimeout simulates network roundtrip
 * - Resolves with matching Offer from injected offers array
 * - Rejects if offerId not found in offers
 *
 * V1 impl (post TP-CAP11-011 backend endpoint):
 * - POST /credit/applications/{id}/offers/{offer_id}/select
 * - Headers: X-Tenant-ID + Content-Type
 * - Invalidate useOffers cache on success
 */
export function useSelectOffer(
  options: UseSelectOfferOptions,
): UseSelectOfferResult {
  const { applicationId, tenantId, offers, onSuccess, onError } = options;
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const selectOffer = useCallback(
    (offerId: string): Promise<Offer> => {
      setIsSubmitting(true);
      setError(null);

      return new Promise<Offer>((resolve, reject) => {
        // 500ms mock latency
        const timer = setTimeout(() => {
          const match = offers.find((o) => o.id === offerId);
          if (!match) {
            const err = new Error(`Offer ${offerId} not found in offers list`);
            setError(err);
            setIsSubmitting(false);
            onError?.(err);
            reject(err);
            return;
          }

          // Validate context (defensive — caller should preserve coherence)
          if (
            match.application_id !== applicationId ||
            match.tenant_id !== tenantId
          ) {
            const err = new Error(
              "Offer application_id or tenant_id mismatch with options",
            );
            setError(err);
            setIsSubmitting(false);
            onError?.(err);
            reject(err);
            return;
          }

          setSelectedOfferId(offerId);
          setIsSubmitting(false);
          onSuccess?.(match);
          resolve(match);
        }, 500);

        // Cleanup if hook unmounts mid-flight
        return () => clearTimeout(timer);
      });
    },
    [offers, applicationId, tenantId, onSuccess, onError],
  );

  return {
    selectOffer,
    selectedOfferId,
    isSubmitting,
    error,
  };
}
