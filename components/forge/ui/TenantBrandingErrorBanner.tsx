"use client";

import { AlertTriangle } from "lucide-react";
import {
  TenantBrandingForbiddenError,
  TenantBrandingNetworkError,
  TenantBrandingNotFoundError,
} from "@/lib/credit-hub/api/tenant-branding-client";

export interface TenantBrandingErrorBannerProps {
  /** Stable id (ERR-...) shown to the user for support escalation. */
  referenceId: string;
  /** Optional typed error so the banner can pick a specific message. */
  error?: unknown;
  /** Re-runs the underlying tenant-branding query. */
  onRetry: () => void;
}

/**
 * Persistent banner shown across the Forge Credit Hub chrome whenever
 * `useTenantBranding` enters an error state. Sits between the topbar and
 * the main content per the approved P10-05 mockup, with a subtle
 * danger-tinted background, a leading `AlertTriangle` icon (icon + text
 * per design rule "status SIEMPRE icono+texto"), the operator-facing
 * `Reference: ERR-...` id, and a Retry button that re-runs the fetch.
 *
 * Accessibility:
 * - `role="alert"` so assistive tech announces the failure on render.
 * - The icon is `aria-hidden` because the surrounding text already
 *   communicates the error state.
 * - Retry button is a real `<button>` and inherits Forge focus styling
 *   (visible 2px brand outline at 2px offset) — never remove the ring.
 */
export function TenantBrandingErrorBanner({
  referenceId,
  error,
  onRetry,
}: TenantBrandingErrorBannerProps) {
  let message: string;
  if (error instanceof TenantBrandingNotFoundError) {
    message = "Institution configuration not found. Contact admin.";
  } else if (error instanceof TenantBrandingForbiddenError) {
    message = "Access denied to this institution. Verify your session.";
  } else if (error instanceof TenantBrandingNetworkError) {
    message = "Could not load institution branding. Using default theme.";
  } else {
    message = "Unknown error loading institution branding.";
  }

  return (
    <div
      role="alert"
      className="flex flex-shrink-0 items-center gap-4 border-b border-l-[3px] border-b-forgeDanger-500/20 border-l-forgeDanger-500 bg-forgeDanger-50 px-6 py-3"
    >
      <AlertTriangle
        aria-hidden="true"
        className="h-5 w-5 flex-shrink-0 text-forgeDanger-500"
      />
      <div className="flex-1 text-forge-sm leading-snug text-forgeDanger-700">
        <p>
          <span className="font-semibold">{message}</span>
        </p>
        <p className="mt-1 font-forgeMono text-forge-xs text-forgeGray-500">
          Reference: {referenceId}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-forge-sm border border-forgeDanger-500 bg-forgeSurface-card px-3 py-1.5 text-forge-sm font-semibold text-forgeDanger-700 transition-colors duration-[var(--forge-duration-fast)] hover:bg-forgeDanger-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
      >
        Retry
      </button>
    </div>
  );
}
