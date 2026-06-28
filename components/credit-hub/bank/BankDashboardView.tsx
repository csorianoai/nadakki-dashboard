"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { EmptyStateRich, KpiStripSkeleton, TableSkeleton } from "@/components/credit-hub/primitives";
import { AreaChart, KpiCardTrend, QueueTable, SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { BankGoals } from "@/components/credit-hub/bank/sections/BankGoals";
import { AuctionIntel } from "@/components/credit-hub/bank/sections/AuctionIntel";
import { RiskCreditPanel } from "@/components/credit-hub/bank/sections/RiskCreditPanel";
import { SegmentedReports } from "@/components/credit-hub/bank/sections/SegmentedReports";
import type { BankDashboardViewProps } from "@/lib/credit-hub/types/bank-views";
import { PRIORITY_RANK, pendingQueueCount } from "@/lib/credit-hub/bank/bankFormat";
import { chMoney } from "@/lib/credit-hub/ch-base";

export function BankDashboardView({
  queue,
  analytics,
  institutionName,
  complianceSummary,
  isLoading,
  isError,
  onRetry,
}: BankDashboardViewProps) {
  const router = useRouter();
  const pending = pendingQueueCount(analytics, queue);

  const topQueue = useMemo(() => {
    return [...queue]
      .filter((x) => x.state !== "decided" && x.state !== "DECIDED" && !x.bank_decision)
      .sort((x, y) => PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority] || y.score - x.score)
      .slice(0, 10);
  }, [queue]);

  const approvalTrend = useMemo(() => analytics?.cohort_analysis?.map((c) => +(c.approval_rate * 100).toFixed(1)) ?? [], [analytics]);
  const volumeTrend = useMemo(() => {
    const cohort = analytics?.cohort_analysis ?? [];
    return cohort.map((c) => c.applications);
  }, [analytics]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <KpiStripSkeleton />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (isError) {
    return <EmptyStateRich variant="error" primary={<button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>Reintentar</button>} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 className="ch-serif" style={{ margin: 0, fontSize: 33, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          Mesa de decisiones — {institutionName}
        </h1>
        <div style={{ fontSize: 13.5, color: "var(--ch-text-3)", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--ch-success)" }} aria-hidden />
            Cumplimiento
          </span>
          {complianceSummary ? (
            <>
              <span>·</span>
              <span>{complianceSummary}</span>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
        <KpiCardTrend label="Solicitudes pendientes" value={pending} trend={null} trendLabel="en cola activa" onClick={() => router.push("/credit-hub/bank/applications")} />
        <KpiCardTrend
          label="Tiempo prom. de decisión"
          value={analytics?.avg_decision_time_hours ?? "—"}
          unit={analytics?.avg_decision_time_hours != null ? "h" : undefined}
          trend={null}
          trendLabel="meta interna ≤ 6 h"
          onClick={() => router.push("/credit-hub/bank/analytics")}
        />
        <KpiCardTrend
          label="Tasa de aprobación"
          value={analytics ? (analytics.approval_rate * 100).toFixed(0) : "—"}
          unit={analytics ? "%" : undefined}
          trend={null}
          trendLabel="últimos 30 días"
          onClick={() => router.push("/credit-hub/bank/analytics")}
        />
        <KpiCardTrend
          label="Volumen del mes"
          value={analytics ? chMoney(analytics.portfolio_value).replace("MX$", "") : "—"}
          unit={analytics ? "MX$" : undefined}
          trend={null}
          trendLabel="cartera viva"
          accent
          onClick={() => router.push("/credit-hub/bank/analytics")}
        />
      </div>

      <SectionHeader
        eyebrow="Bandeja priorizada"
        title="Solicitudes que requieren tu decisión"
        sub={`${pending} en cola · ordenadas por prioridad y score`}
        actions={
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => router.push("/credit-hub/bank/applications")}>
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        }
      />

      {topQueue.length === 0 ? (
        <EmptyStateRich variant="empty" />
      ) : (
        <div className="ch-card" style={{ overflow: "hidden", marginBottom: 26 }}>
          <QueueTable items={topQueue} variant="dashboard" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid var(--ch-line)", fontSize: 11.5, color: "var(--ch-text-3)" }}>
            <span className="ch-mono">
              {topQueue.length} de {pending} en cola
            </span>
            <Link href="/credit-hub/bank/applications" style={{ color: "var(--ch-accent)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
              Abrir bandeja completa
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      )}

      <AuctionIntel />

      <RiskCreditPanel />

      <SegmentedReports />

      <BankGoals analytics={analytics} queueCount={pending} />

      <SectionHeader eyebrow="Insights" title="Tendencia de la operación" sub="Derivado de las cohortes procesadas por el motor" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="ch-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--ch-line)" }}>
            <div>
              <div className="ch-card-title">Volumen por cohorte</div>
              <div className="ch-card-sub">Solicitudes recibidas por periodo</div>
            </div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            {volumeTrend.length ? <AreaChart data={volumeTrend} labels={analytics?.cohort_analysis.map((c) => c.period.slice(5))} /> : <EmptyStateRich variant="placeholder" title="Sin serie disponible" body="Series temporales disponibles cuando el motor procese más solicitudes." />}
          </div>
        </div>
        <div className="ch-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--ch-line)" }}>
            <div>
              <div className="ch-card-title">Tasa de aprobación</div>
              <div className="ch-card-sub">Cohortes mensuales</div>
            </div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            {approvalTrend.length ? <AreaChart data={approvalTrend} color="var(--ch-success)" labels={analytics?.cohort_analysis.map((c) => c.period.slice(5))} fmtY={(v) => `${v.toFixed(0)}%`} /> : <EmptyStateRich variant="placeholder" title="Sin cohortes" body="Series temporales disponibles cuando el motor procese más solicitudes." />}
          </div>
        </div>
      </div>
    </div>
  );
}
