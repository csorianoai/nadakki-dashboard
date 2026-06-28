"use client";

import {
  DISPLAY_STATUS_LABELS,
  resolveDisplayStatus,
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

export function DisplayStatusPill({
  status,
  backendState,
}: {
  status: CreditApplicationStatus;
  backendState?: string | null;
}) {
  const key = resolveDisplayStatus(status, backendState);
  const s = PILL[key];
  return (
    <span
      className="ch-pill"
      style={{ color: s.c, background: s.bg, height: 22, fontSize: 11 }}
      data-display-status={key}
    >
      {DISPLAY_STATUS_LABELS[key]}
    </span>
  );
}
