"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "B";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function BankCockpitHeader({
  institutionName,
  complianceSummary,
  period,
  onPeriodChange,
}: {
  institutionName: string;
  complianceSummary?: string;
  period: "today" | "week" | "month";
  onPeriodChange: (p: "today" | "week" | "month") => void;
}) {
  return (
    <header data-testid="bank-cockpit-header" style={{ marginBottom: 22 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "var(--ch-bank-accent-soft, var(--ch-info-soft))",
              border: "1px solid rgba(28, 25, 23, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <Building2 className="h-5 w-5" style={{ color: "var(--ch-bank-accent, var(--ch-info))" }} aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="ch-serif" style={{ margin: 0, fontSize: "clamp(22px, 4vw, 28px)", letterSpacing: "-0.02em" }}>
                Cockpit del Banco
              </h1>
              <span className="ch-chip" style={{ fontSize: 9, letterSpacing: "0.08em" }}>
                MESA DE DECISIÓN
              </span>
              <DataTruthBadge level="REAL" />
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ch-text-2)" }}>
              {institutionName} · Dealer → Banco · Revisión humana requerida
            </p>
            {complianceSummary ? (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ch-text-3)" }}>{complianceSummary}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="ch-chip success" style={{ fontSize: 10 }}>
            Aislamiento activo
          </span>
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={period === p ? "ch-btn ch-btn-persona ch-btn-sm" : "ch-btn ch-btn-secondary ch-btn-sm"}
              onClick={() => onPeriodChange(p)}
            >
              {p === "today" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
            </button>
          ))}
          <Link href="/credit-hub/bank/applications" className="ch-btn ch-btn-secondary ch-btn-sm" style={{ textDecoration: "none" }}>
            Cola completa
          </Link>
          <div
            title={institutionName}
            aria-label={institutionName}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "var(--ch-bank-accent, var(--ch-persona))",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials(institutionName)}
          </div>
        </div>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--ch-text-3)" }}>
        <span style={{ color: "var(--ch-success)" }}>●</span> Ofertas competidoras ocultas por diseño · solo tu cartera asignada
      </p>
    </header>
  );
}
