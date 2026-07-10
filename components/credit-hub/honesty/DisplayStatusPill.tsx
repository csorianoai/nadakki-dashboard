"use client";

import {
  resolveDisplayStatusLabel,
  type DisplayStatus,
} from "@/lib/credit-hub/honesty/display-status";
import type { CreditApplicationStatus } from "@/lib/credit-hub/types/creditCore";

const PILL: Record<DisplayStatus, { c: string; bg: string }> = {
  DRAFT: { c: "var(--ch-text-3)", bg: "var(--ch-surface-3)" },
  ACTIVE: { c: "var(--ch-persona-text)", bg: "var(--ch-persona-soft)" },
  APPROVED: { c: "var(--ch-success-text)", bg: "var(--ch-success-soft)" },
  REJECTED: { c: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)" },
  FUNDED: { c: "var(--ch-text-2)", bg: "var(--ch-surface-2)" },
  OFFERED: { c: "var(--ch-warning-text)", bg: "var(--ch-warning-soft)" },
  LEGACY: { c: "var(--ch-text-3)", bg: "var(--ch-surface-3)" },
};

const SERVER_PILL_DEFAULT = { c: "var(--ch-info-text)", bg: "var(--ch-info-soft)" };

const SERVER_PILL_COLORS: Record<string, { c: string; bg: string }> = {
  EXPIRED: { c: "var(--ch-text-3)", bg: "var(--ch-surface-2)" },
  CANCELLED: { c: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)" },
  DISBURSED: { c: "var(--ch-success-text)", bg: "var(--ch-success-soft)" },
  READY_FOR_DISBURSEMENT: { c: "var(--ch-success-text)", bg: "var(--ch-success-soft)" },
};

export function DisplayStatusPill({
  status,
  backendState,
  displayStatus,
}: {
  status: CreditApplicationStatus;
  backendState?: string | null;
  /** Server-authoritative display_status when present on application payload. */
  displayStatus?: string | null;
}) {
  const resolved = resolveDisplayStatusLabel({ displayStatus, status, backendState });
  const bucket = resolved.source === "legacy" ? (resolved.key as DisplayStatus) : null;
  const serverStyle = resolved.source === "server" ? SERVER_PILL_COLORS[resolved.key] : null;
  const s = serverStyle ?? (bucket && PILL[bucket] ? PILL[bucket] : SERVER_PILL_DEFAULT);

  return (
    <span
      className="ch-pill"
      style={{ color: s.c, background: s.bg, height: 22, fontSize: 11 }}
      data-display-status={resolved.key}
      data-display-source={resolved.source}
    >
      {resolved.label}
    </span>
  );
}
