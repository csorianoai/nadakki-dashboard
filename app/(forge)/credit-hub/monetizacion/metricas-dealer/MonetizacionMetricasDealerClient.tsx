"use client";

import { formatRd, formatRdCompact } from "@/lib/credit-hub/monetizacion/format";
import type { DealerMetrics } from "@/lib/credit-hub/monetizacion/types";
import { DEMO_TENANTS, useMonetizacionShell } from "@/components/credit-hub/monetizacion/shell";
import { FunnelStep, MonetizacionScreenEmpty, StatCard } from "@/components/credit-hub/monetizacion/ui";
import type { FmAccent } from "@/components/credit-hub/monetizacion/ui";
import { tenantInitialClass } from "@/components/credit-hub/monetizacion/ui/types";
import "./metricas-dealer-screen.css";

function mixAccent(color: string): FmAccent {
  if (color === "#2bd073") return "green";
  if (color === "#54a8ec") return "blue";
  if (color === "#f4b740") return "amber";
  return "sub";
}

type Props = {
  metrics: DealerMetrics | null;
};

export function MonetizacionMetricasDealerClient({ metrics: dealerMetrics }: Props) {
  const { tenantId } = useMonetizacionShell();
  const tenant = DEMO_TENANTS.find((t) => t.id === tenantId) ?? DEMO_TENANTS[2];
  const metrics = dealerMetrics && dealerMetrics.tenant_id === tenantId ? dealerMetrics : null;

  if (!metrics) {
    return (
      <MonetizacionScreenEmpty message="Vista white-label disponible solo para tenants dealer. Cambia el tenant switcher a un dealer para ver sus métricas aisladas." />
    );
  }

  const fees = metrics.dealer_fees;

  return (
    <div>
      <header className="fm-dealer-wl-header">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="fm-dealer-wl-avatar">{tenant.initials}</span>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--fm-font-display)", fontSize: 16, fontWeight: 600 }}>
              {tenant.label} · panel del dealer
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fm-sub)" }}>
              Vista white-label · solo datos de este dealer · plan {metrics.plan} · {metrics.period}
            </p>
          </div>
        </div>
        <span className="fm-dealer-wl-chip">🔒 aislado por actor</span>
      </header>

      <div className="fm-dealer-top">
        <section className="fm-ui-card" style={{ padding: 0, overflow: "hidden" }}>
          <p className="fm-dealer-section-label" style={{ padding: "14px 14px 0" }}>
            Funnel · originadas → desembolsadas
          </p>
          <div className="fm-dealer-funnel">
            {metrics.funnel.map((step) => (
              <FunnelStep
                key={step.label}
                label={step.label}
                value={step.value.toLocaleString("en-US")}
                conv={step.conv}
              />
            ))}
          </div>
        </section>
        <section className="fm-ui-card fm-dealer-l2b">
          <div style={{ fontSize: 11, color: "var(--fm-sub)", marginBottom: 6 }}>Look-to-book</div>
          <div className="fm-dealer-l2b-value">{metrics.look_to_book.pct}%</div>
          <div style={{ fontSize: 12, color: "var(--fm-ink-soft)", marginTop: 6 }}>solicitudes → deals cerrados</div>
          <div style={{ fontSize: 11, color: "var(--fm-green)", marginTop: 8 }}>{metrics.look_to_book.delta}</div>
        </section>
      </div>

      <div className="fm-dealer-bottom">
        <section className="fm-ui-card">
          <h3 className="fm-dealer-card-title">Mix de bancos ganadores</h3>
          {metrics.bank_mix.map((row) => (
            <div key={row.name} className="fm-dealer-mix-row">
              <span className={`fm-ui-tenant-initial ${tenantInitialClass(mixAccent(row.color))}`}>{row.initial}</span>
              <div>
                <div style={{ color: "var(--fm-ink-soft)" }}>{row.name}</div>
                <div className="fm-dealer-mix-bar">
                  <div className="fm-dealer-mix-fill" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
              <span className="fm-mono">{row.deals}</span>
              <span className="fm-mono">{row.pct}%</span>
            </div>
          ))}
        </section>

        <section className="fm-ui-card">
          <div className="fm-dealer-kpi-grid">
            <StatCard label="Volumen financiado" value={formatRdCompact(metrics.kpis.volume)} />
            <StatCard label="APR promedio obtenido" value={`${metrics.kpis.apr_pct}%`} />
            <StatCard label="Tiempo a 1ª oferta" value={metrics.kpis.time_to_offer} />
            <StatCard label="Seats activos" value={String(metrics.kpis.seats)} />
          </div>
          <div className="fm-ui-card" style={{ padding: 12, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fm-ink)" }}>
                Fees del dealer · plan {metrics.plan}
              </span>
              <span className="fm-dealer-fees-chip">{fees.limit_pct}% del límite</span>
            </div>
            <div className="fm-mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--fm-ink)" }}>
              {formatRd(fees.base, 0)}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--fm-sub)" }}>
              base mensual · {fees.requests_used}/{fees.requests_limit} solicitudes usadas · overage RD${" "}
              {fees.overage} c/u
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
