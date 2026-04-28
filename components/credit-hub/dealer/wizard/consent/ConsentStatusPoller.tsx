"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useConsentStatusPolling } from "@/lib/credit-hub/hooks/useConsentStatusPolling";

interface ConsentStatusPollerProps {
  token: string;
  method: string;
  onComplete?: (data: { method: string; auditHash?: string }) => void;
}

export function ConsentStatusPoller({ token, method, onComplete }: ConsentStatusPollerProps) {
  const t = useTranslations();
  const { status, acceptedAt, error, haltedByErrors, refetch } = useConsentStatusPolling(token, 10_000);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (status === "ACCEPTED") {
      onCompleteRef.current?.({ method });
    }
  }, [method, status]);

  const statusLabels: Record<string, string> = {
    INITIATED: t.consent.status_initiated,
    SENT: t.consent.status_sent,
    VIEWED: t.consent.status_viewed,
    ACCEPTED: t.consent.status_accepted,
    REJECTED: t.consent.status_rejected,
    EXPIRED: t.consent.status_expired,
    FAILED: t.consent.status_failed,
    NOT_FOUND: t.consent.status_failed,
  };

  const statusColors: Record<string, string> = {
    INITIATED: "text-forge-text-muted",
    SENT: "text-forge-text",
    VIEWED: "text-forge-primary",
    ACCEPTED: "text-forge-success",
    REJECTED: "text-forge-danger",
    EXPIRED: "text-forge-warning",
    FAILED: "text-forge-danger",
    NOT_FOUND: "text-forge-danger",
  };

  const label = status ? (statusLabels[String(status)] ?? String(status)) : t.consent.polling_active;
  const colorClass = statusColors[String(status ?? "SENT")] ?? "text-forge-text";

  return (
    <div className="mt-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-4" data-testid="consent-status-poller">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
        {acceptedAt && (
          <span className="text-xs text-forge-text-muted tabular-nums">
            {new Date(acceptedAt).toLocaleString("es-DO")}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-forge-danger" role="alert">
          {error}
        </p>
      )}

      {(status === "EXPIRED" || status === "FAILED" || haltedByErrors) && (
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-xs text-forge-primary hover:underline"
        >
          {haltedByErrors ? t.consent.refresh_status : t.consent.resend}
        </button>
      )}
    </div>
  );
}
