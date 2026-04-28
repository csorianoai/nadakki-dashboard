import { ForgeMetricCard } from "@/components/credit-hub/dealer/ForgeMetricCard";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";

export function BankExecutiveMetrics({ analytics, loading }: { analytics?: BankDashboardAnalytics; loading?: boolean }) {
  const pending = analytics
    ? Object.entries(analytics.applications_by_status).reduce((sum, [status, count]) => (["APROBADO", "RECHAZADO", "CONTRA_OFERTA"].includes(status) ? sum : sum + count), 0)
    : null;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <ForgeMetricCard label="Solicitudes" value={analytics?.total_applications ?? null} loading={loading} />
      <ForgeMetricCard label="Pendientes" value={pending} loading={loading} />
      <ForgeMetricCard label="Aprobación %" value={analytics ? Math.round(analytics.approval_rate * 100) : null} loading={loading} />
      <ForgeCard>
        <p className="text-sm font-medium text-forge-text-muted">Cartera activa</p>
        <p className="mt-3 font-display text-3xl font-bold text-forge-text">
          {analytics ? `RD$ ${Math.round(analytics.portfolio_value).toLocaleString("es-DO")}` : "—"}
        </p>
      </ForgeCard>
    </div>
  );
}
