import type { CreditOffer } from "@/lib/credit-hub/types/offers";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when dealer explicitly rejected this offer (NOT_SELECTED + rejection metadata). */
export function isDealerRejectedOffer(offer: CreditOffer, locallyRejectedIds?: ReadonlySet<string>): boolean {
  if (locallyRejectedIds?.has(offer.id)) return true;
  const raw = offer.raw;
  if (!isRecord(raw)) return false;
  const meta = raw.response_metadata ?? raw.responseMetadata;
  if (!isRecord(meta)) return false;
  return Boolean(meta.rejected_by ?? meta.rejected_at);
}

export function isCounterOffer(offer: CreditOffer): boolean {
  return offer.status === "counter_offer";
}
