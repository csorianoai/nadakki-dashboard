"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowRight, Car, Check, FileText, Inbox, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { chRelTimeDealer } from "@/lib/credit-hub/dealer/dealerFormat";
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";
import { DisplayStatusPill } from "@/components/credit-hub/honesty/DisplayStatusPill";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

const STATUS: Record<string, { label: string; c: string; bg: string; Icon: typeof FileText }> = {
  draft: { label: "Borrador", c: "var(--ch-text-3)", bg: "var(--ch-surface-3)", Icon: FileText },
  submitted: { label: "Enviada", c: "var(--ch-info-text)", bg: "var(--ch-info-soft)", Icon: Inbox },
  processing: { label: "En proceso", c: "var(--ch-persona-text)", bg: "var(--ch-persona-soft)", Icon: RefreshCw },
  processed: { label: "Procesada", c: "var(--ch-persona-text)", bg: "var(--ch-persona-soft)", Icon: RefreshCw },
  approved: { label: "Aprobada", c: "var(--ch-success-text)", bg: "var(--ch-success-soft)", Icon: Check },
  approved_with_stipulations: { label: "Aprobada", c: "var(--ch-success-text)", bg: "var(--ch-success-soft)", Icon: Check },
  rejected: { label: "Rechazada", c: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)", Icon: X },
  declined: { label: "Rechazada", c: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)", Icon: X },
  offered: { label: "Contraoferta", c: "var(--ch-warning-text)", bg: "var(--ch-warning-soft)", Icon: RefreshCw },
  counter_offer: { label: "Contraoferta", c: "var(--ch-warning-text)", bg: "var(--ch-warning-soft)", Icon: RefreshCw },
};

export function DealerStatusBadge({ status, size = "md" }: { status: string; size?: "md" | "lg" }) {
  const s = STATUS[status] ?? STATUS.draft!;
  const Icon = s.Icon;
  const h = size === "lg" ? 28 : 22;
  const fs = size === "lg" ? 13 : 11;
  return (
    <span className="ch-pill" style={{ color: s.c, background: s.bg, height: h, fontSize: fs, gap: 5 }}>
      <Icon className="h-3 w-3" aria-hidden />
      {s.label}
    </span>
  );
}

export function DealerSectionHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
      <div>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {sub ? <div style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginTop: 2 }}>{sub}</div> : null}
      </div>
      {action}
    </div>
  );
}

import { MessageCircle } from "lucide-react";
import { useMessageUnreadCount } from "@/components/credit-hub/dealer/ApplicationMessageThread";

export function DealerAppCard({
  app,
  currency,
  href,
}: {
  app: CreditApplication;
  currency: string;
  href: string;
}) {
  const h = humanizeApplicant(app, currency);
  const unreadCount = useMessageUnreadCount(app.application_id, "dealer");

  return (
    <Link
      href={href}
      className="ch-card block w-full text-left no-underline"
      style={{
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "var(--ch-surface)",
        border: "1px solid var(--ch-line)",
        minHeight: 44,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {h.primaryLabel}
            </div>
            {unreadCount != null && unreadCount > 0 ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 999,
                  background: "var(--ch-accent)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                }}
                title={`${unreadCount} mensaje${unreadCount > 1 ? "s" : ""} sin leer`}
              >
                {unreadCount}
              </span>
            ) : null}
          </div>
          <div className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-3)", marginTop: 2 }}>
            {h.secondaryLabel}
          </div>
        </div>
        <DisplayStatusPill status={app.status} displayStatus={app.display_status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ch-text-2)" }}>
        <Car className="h-4 w-4 shrink-0" style={{ color: "var(--ch-text-3)" }} aria-hidden />
        <span className="truncate">{h.vehicleLabel}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--ch-line)",
          paddingTop: 10,
        }}
      >
        <span className="ch-mono" style={{ fontSize: 16, fontWeight: 600 }}>
          {h.amountLabel}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {app.score != null ? (
            <span className="ch-mono" style={{ fontSize: 12, color: "var(--ch-text-3)" }}>
              Score {app.score}
            </span>
          ) : null}
          <span className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-4)" }}>
            {chRelTimeDealer(app.created_at)}
          </span>
        </span>
      </div>
    </Link>
  );
}

export function DealerKpiCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number | null;
  trendLabel?: string;
  accent?: boolean;
}) {
  const pos = (trend ?? 0) >= 0;
  return (
    <div className="ch-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span className="ch-eyebrow">{label}</span>
        {trend != null ? (
          <span
            className="ch-mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: pos ? "var(--ch-success)" : "var(--ch-danger)",
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {pos ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span
          className="ch-mono"
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: accent ? "var(--ch-persona)" : "var(--ch-text)",
          }}
        >
          {value}
        </span>
        {unit ? (
          <span className="ch-mono" style={{ fontSize: 13, color: "var(--ch-text-3)", fontWeight: 500 }}>
            {unit}
          </span>
        ) : null}
      </div>
      {trendLabel ? <div style={{ fontSize: 11, color: "var(--ch-text-3)" }}>{trendLabel}</div> : null}
    </div>
  );
}

export function DealerQuickAction({
  title,
  sub,
  href,
  accent = "persona",
}: {
  title: string;
  sub: string;
  href: string;
  accent?: "persona" | "amber";
}) {
  const bg = accent === "persona" ? "var(--ch-persona-soft)" : "var(--ch-accent-soft)";
  const color = accent === "persona" ? "var(--ch-persona-text)" : "var(--ch-accent-text)";
  return (
    <Link
      href={href}
      className="ch-card block no-underline"
      style={{
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 44,
        border: accent === "amber" ? "1px solid var(--ch-accent-line)" : "1px solid var(--ch-line)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 9,
          background: bg,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ArrowRight className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ch-text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 2 }}>{sub}</div>
      </div>
    </Link>
  );
}
