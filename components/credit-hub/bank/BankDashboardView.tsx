"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { EmptyStateRich, KpiStripSkeleton, TableSkeleton } from "@/components/credit-hub/primitives";
import { AreaChart, QueueTable, SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { BankGoals } from "@/components/credit-hub/bank/sections/BankGoals";
import { AuctionIntel } from "@/components/credit-hub/bank/sections/AuctionIntel";
import { RiskCreditPanel } from "@/components/credit-hub/bank/sections/RiskCreditPanel";
import {
  ComplianceFooter,
  MetricCard,
} from "@/components/credit-hub/elite";
import { BankCockpitHeader } from "@/components/credit-hub/bank/elite/BankCockpitHeader";
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
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const pending = pendingQueueCount(analytics, queue);

  const topQueue = useMemo(() => {
    return [...queue]
      .filter((x) => x.state !== "decided" && x.state !== "DECIDED" && !x.bank_decision)
      .sort((x, y) => PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority] || y.score - x.score)
      .slice(0, 10);
  }, [queue]);

  const approvalTrend = useMemo(() => analytics?.cohort_analysis?.map((c) => +(c.approval_rate * 100).toFixed(1)) ?? [], [analytics]);
  const volumeTrend = useMemo(() => analytics?.cohort_analysis?.map((c) => c.applications) ?? [], [analytics]);

  const counterOffers = useMemo(() => queue.filter((q) => q.state?.toLowerCase().includes("counter")).length, [queue]);

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
    <div data-testid="bank-decision-desk" className="min-w-0 pb-8">
      <BankCockpitHeader
        institutionName={institutionName}
        complianceSummary={complianceSummary}
        period={period}
        onPeriodChange={setPeriod}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 mb-[26px]">
        <MetricCard label="En cola" value={pending} truth="REAL" footnote="Solicitudes pendientes" onClick={() => router.push("/credit-hub/bank/applications")} />
        <MetricCard label="Decisiones pendientes" value={topQueue.length} truth="REAL" footnote="Priorizadas en bandeja" />
        <MetricCard label="Contraofertas activas" value={counterOffers || "—"} truth={counterOffers ? "REAL" : "ROADMAP"} footnote="Estimado desde cola" />
        <MetricCard
          label="Tasa de aprobación"
          value={analytics ? (analytics.approval_rate * 100).toFixed(0) : "—"}
          unit={analytics ? "%" : undefined}
          truth="REAL"
          footnote="Últimos 30 días"
          accent
        />
        <MetricCard
          label="Tiempo prom. decisión"
          value={analytics?.avg_decision_time_hours ?? "—"}
          unit={analytics?.avg_decision_time_hours != null ? "h" : undefined}
          truth="ROADMAP"
          footnote="Endpoint devuelve null hoy"
        />
        <MetricCard
          label="Volumen cartera"
          value={analytics ? chMoney(analytics.portfolio_value).replace("MX$", "") : "—"}
          unit={analytics ? "MX$" : undefined}
          truth="REAL"
          footnote="Cartera viva"
        />
        <MetricCard label="SLA compliance" value="—" truth="ROADMAP" footnote="Meta ≤ 6 h · sin serie aún" />
      </div>

      <SectionHeader
        eyebrow="Cola de decisión"
        title="Solicitudes que requieren revisión humana"
        sub={`${pending} en cola · ordenadas por prioridad y score`}
        actions={
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => router.push("/credit-hub/bank/applications")}>
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        }
      />

      {topQueue.length === 0 ? (
        <EmptyStateRich variant="empty" title="Cola vacía" description="No hay solicitudes pendientes de decisión." />
      ) : (
        <div className="ch-card overflow-x-auto mb-[26px]" data-testid="bank-decision-queue">
          <QueueTable items={topQueue} variant="dashboard" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--ch-line)", fontSize: 11.5, color: "var(--ch-text-3)" }}>
            <span className="ch-mono">{topQueue.length} de {pending}</span>
            <Link href="/credit-hub/bank/applications" style={{ color: "var(--ch-accent)", fontWeight: 500 }}>
              Abrir bandeja completa →
            </Link>
          </div>
        </div>
      )}

      <div className="ch-card mb-[26px] p-4">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <h2 className="ch-serif" style={{ margin: 0, fontSize: 17 }}>
            Panel de decisión
          </h2>
          <span className="ch-chip" style={{ fontSize: 10 }}>ROADMAP inline</span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginBottom: 12 }}>
          Aprobar, rechazar, contraofertar y stipulations desde el expediente de cada solicitud.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" disabled title="Abrir expediente desde la cola">
            Aprobar
          </button>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled>
            Rechazar
          </button>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled>
            Contraofertar
          </button>
          <span className="ch-chip" style={{ fontSize: 10 }}>
            ROADMAP acciones inline — usar expediente
          </span>
        </div>
      </div>

      <AuctionIntel />
      <RiskCreditPanel />
      <BankGoals analytics={analytics} queueCount={pending} />

      <SectionHeader eyebrow="Tendencias" title="Operación por cohortes" sub="Derivado del motor — solo tu institución" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-[26px]">
        <div className="ch-card p-4 overflow-hidden">
          <div className="ch-card-title mb-2">Volumen</div>
          {volumeTrend.length ? <AreaChart data={volumeTrend} labels={analytics?.cohort_analysis.map((c) => c.period.slice(5))} /> : <EmptyStateRich variant="placeholder" title="Sin serie" body="Más solicitudes generarán cohortes." />}
        </div>
        <div className="ch-card p-4 overflow-hidden">
          <div className="ch-card-title mb-2">Tasa de aprobación</div>
          {approvalTrend.length ? <AreaChart data={approvalTrend} color="var(--ch-success)" labels={analytics?.cohort_analysis.map((c) => c.period.slice(5))} fmtY={(v) => `${v.toFixed(0)}%`} /> : <EmptyStateRich variant="placeholder" title="Sin cohortes" body="Más solicitudes generarán cohortes." />}
        </div>
      </div>

      <ComplianceFooter variant="bank" />
    </div>
  );
}
