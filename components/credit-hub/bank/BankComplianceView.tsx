"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmptyStateRich, KpiStripSkeleton } from "@/components/credit-hub/primitives";
import { KpiCardTrend, SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import type { BankComplianceViewProps } from "@/lib/credit-hub/types/bank-views";
import { complianceHeroTitle } from "@/lib/credit-hub/bank/bankFormat";

const SEV: Record<string, [string, string]> = {
  alta: ["var(--ch-danger-text)", "var(--ch-danger-soft)"],
  media: ["var(--ch-warning-text)", "var(--ch-warning-soft)"],
  baja: ["var(--ch-text-3)", "var(--ch-surface-3)"],
};

export function BankComplianceView({ issues, jurisdictionCode, institutionName, isLoading, isError, onRetry }: BankComplianceViewProps) {
  if (isLoading) return <KpiStripSkeleton n={3} />;
  if (isError) return <EmptyStateRich variant="error" primary={<button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>Reintentar</button>} />;

  const heroTitle = complianceHeroTitle(jurisdictionCode, institutionName);
  const sorted = [...issues].sort((a, b) => {
    const rank = { alta: 0, media: 1, baja: 2 } as Record<string, number>;
    return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
  });

  const altaCount = issues.filter((i) => i.severity === "alta" || i.severity === "ALTA").length;

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 className="ch-serif" style={{ margin: 0, fontSize: 33, letterSpacing: "-0.02em" }}>
          {heroTitle}
        </h1>
        <div style={{ fontSize: 13.5, color: "var(--ch-text-3)", marginTop: 6 }}>Cumplimiento regulatorio</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 26 }}>
        <KpiCardTrend label="Incidencias abiertas" value={issues.length} trend={null} trendLabel={`${altaCount} de severidad alta`} accent />
        <KpiCardTrend label="Solicitudes en cola" value="—" trend={null} trendLabel="derivado de bandeja activa" />
        <KpiCardTrend label="RTBF pendientes" value="—" trend={null} trendLabel="sin endpoint de listado RTBF" />
      </div>

      <SectionHeader eyebrow="Incidencias" title="Incidencias regulatorias abiertas" sub={`${issues.length} requieren atención`} />
      <div className="ch-card" style={{ overflow: "hidden", marginBottom: 26 }}>
        {sorted.length === 0 ? (
          <EmptyStateRich variant="empty" title="Sin incidencias abiertas" body="Todas las solicitudes visibles cumplen el perfil regulatorio vigente." />
        ) : (
          sorted.map((iss, i) => {
            const [c, bg] = SEV[iss.severity] ?? SEV.baja!;
            return (
              <div key={iss.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center", padding: "14px 18px", borderTop: i ? "1px solid var(--ch-line)" : "none" }}>
                <span className="ch-pill" style={{ color: c, background: bg, height: 22, fontSize: 11 }}>
                  {iss.severity}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="ch-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                    {iss.rule}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ch-text-2)", marginTop: 2 }}>{iss.description}</div>
                </div>
                <Link href={`/credit-hub/bank/applications/${iss.application_id}`} className="ch-mono" style={{ fontSize: 12, color: "var(--ch-accent)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  {iss.application_id}
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </Link>
                <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm">
                  Resolver
                </button>
              </div>
            );
          })
        )}
      </div>

      <SectionHeader eyebrow="Derecho al olvido (RTBF)" title="Solicitudes de eliminación de datos" sub="Placeholder — endpoint RTBF no expuesto en MVP" />
      <div className="ch-card" style={{ padding: 24 }}>
        <EmptyStateRich variant="placeholder" title="RTBF próximamente" body="Las solicitudes RTBF se listarán cuando el backend exponga el endpoint correspondiente." />
      </div>
    </div>
  );
}
