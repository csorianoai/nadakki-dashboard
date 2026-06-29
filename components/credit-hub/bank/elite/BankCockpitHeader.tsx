"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

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
              border: "1px solid var(--ch-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 className="h-5 w-5" style={{ color: "var(--ch-bank-accent, var(--ch-info))" }} aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="ch-serif" style={{ margin: 0, fontSize: "clamp(22px, 4vw, 28px)" }}>
                Mesa de decisiones
              </h1>
              <span className="ch-chip" style={{ fontSize: 9 }}>BANCO</span>
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
          <span className="ch-chip" style={{ fontSize: 10, color: "var(--ch-success-text)", background: "var(--ch-success-soft)" }}>
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
        </div>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--ch-text-3)" }}>
        <span style={{ color: "var(--ch-success)" }}>●</span> Ofertas competidoras ocultas por diseño · solo tu cartera asignada
      </p>
    </header>
  );
}
