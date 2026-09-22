"use client";

import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { useCommercialSponsorships } from "@/lib/access/hooks";
import { visibleSponsorshipCopy } from "@/lib/access/sponsorship";

export function DealerSponsorshipBanner() {
  const context = getAccessClientContext();
  const query = useCommercialSponsorships();

  if (context == null) return null;

  if (query.isPending || query.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-sponsorship-loading">
        Cargando patrocinio…
      </p>
    );
  }

  if (query.error instanceof AccessApiError || query.error) {
    return null;
  }

  const lines = visibleSponsorshipCopy(query.data ?? []);
  if (lines.length === 0) return null;

  return (
    <ul className="max-w-full space-y-1 overflow-x-hidden" data-testid="dealer-sponsorship-ready">
      {lines.map((line) => (
        <li key={line} className="text-sm text-nk-fg-muted break-words">
          {line}
        </li>
      ))}
    </ul>
  );
}
