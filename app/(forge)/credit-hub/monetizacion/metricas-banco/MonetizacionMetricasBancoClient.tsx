"use client";

import Link from "next/link";
import { formatRd } from "@/lib/credit-hub/monetizacion/format";
import type { BankMetrics, DrilldownMap } from "@/lib/credit-hub/monetizacion/types";
import { DEMO_TENANTS, useMonetizacionShell, type TraceDrawerPayload } from "@/components/credit-hub/monetizacion/shell";
import { FunnelStep, MonetizacionScreenEmpty } from "@/components/credit-hub/monetizacion/ui";
import "./metricas-banco-screen.css";

type Props = {
  metrics: BankMetrics | null;
  drilldowns: DrilldownMap;
};

export function MonetizacionMetricasBancoClient({ metrics: bankMetrics, drilldowns }: Props) {
  const { tenantId, openTrace } = useMonetizacionShell();
  const tenant = DEMO_TENANTS.find((t) => t.id === tenantId) ?? DEMO_TENANTS[0];
  const metrics = bankMetrics && bankMetrics.tenant_id === tenantId ? bankMetrics : null;

  const openDrilldown = (key: keyof DrilldownMap, aggFormatted: string) => {
    const drilldown = drilldowns[key];
    if (!drilldown) return;
    openTrace({
      kicker: "TRAZABILIDAD · EVENTOS DE ORIGEN",
      title: drilldown.title,
      sub: drilldown.sub,
      drilldown,
      aggFormatted,
    } as TraceDrawerPayload);
  };

  if (!metrics) {
    return (
      <MonetizacionScreenEmpty message="Vista white-label disponible solo para tenants banco. Cambia el tenant switcher a un banco para ver sus métricas aisladas." />
    );
  }

  const ai = metrics.ai_usage;

  return (
    <div>
      <header className="fm-bank-wl-header">
        <div className="fm-bank-wl-title">
          <span className="fm-bank-wl-avatar">{tenant.initials}</span>
          <div>
            <h1 className="fm-bank-wl-name">{tenant.label} · panel del banco</h1>
            <p className="fm-bank-wl-sub">
              Vista white-label · solo datos de este banco · {metrics.period}
            </p>
          </div>
        </div>
        <span className="fm-bank-wl-chip">🔒 aislado por actor</span>
      </header>

      <section className="fm-ui-card" style={{ padding: 0, overflow: "hidden" }}>
        <p className="fm-bank-section-label" style={{ padding: "14px 14px 0" }}>
          Funnel de subasta
        </p>
        <div className="fm-bank-funnel">
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

      <div className="fm-bank-cols">
        <section className="fm-ui-card">
          <h3 className="fm-bank-card-title">SLA · tiempo a respuesta</h3>
          <div className="fm-bank-sla-row">
            <span>p50</span>
            <span className="fm-mono">{metrics.sla.p50}</span>
          </div>
          <div className="fm-bank-sla-row">
            <span>p95</span>
            <span className="fm-mono">{metrics.sla.p95}</span>
          </div>
          <div className="fm-bank-sla-row">
            <span>Dentro de SLA</span>
            <span className="fm-mono fm-ui-text-green">{metrics.sla.within_pct}%</span>
          </div>
          <div className="fm-bank-sla-bar">
            <div className="fm-bank-sla-bar-fill" style={{ width: `${metrics.sla.within_pct}%` }} />
          </div>
          <div className="fm-bank-sla-row" style={{ borderBottom: "none", marginTop: 8 }}>
            <span>Tasa de rechazo</span>
            <span className="fm-mono fm-ui-text-amber">{metrics.sla.reject_pct}%</span>
          </div>
        </section>

        <section
          className="fm-ui-card fm-bank-ai-card"
          role="button"
          tabIndex={0}
          onClick={() => openDrilldown("ai", formatRd(ai.cost))}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDrilldown("ai", formatRd(ai.cost));
            }
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="fm-bank-card-title">Consumo de IA</h3>
            <span className="fm-ui-drill-chip">ver origen ↗</span>
          </div>
          <div className="fm-bank-ai-stat">
            <span>Decisiones scoring</span>
            <span className="fm-mono">{ai.decisions.toLocaleString("en-US")}</span>
          </div>
          <div className="fm-bank-ai-stat">
            <span>Documentos SIC/OCR</span>
            <span className="fm-mono">{ai.documents.toLocaleString("en-US")}</span>
          </div>
          <div className="fm-bank-ai-stat">
            <span>Tokens in/out</span>
            <span className="fm-mono">{ai.tokens}</span>
          </div>
          <div className="fm-bank-ai-cost">
            <span>Costo IA</span>
            <span>{formatRd(ai.cost)}</span>
          </div>
        </section>

        <section className="fm-ui-card">
          <h3 className="fm-bank-card-title">Factura del periodo</h3>
          <div className="fm-bank-invoice-total">{formatRd(metrics.invoice_current)}</div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--fm-sub)" }}>
            total con ITBIS · modelo {metrics.model_label}
          </p>
          <div className="fm-bank-invoice-proj">
            Proyectada cierre mes {formatRd(metrics.invoice_projected)}
          </div>
          <Link
            href="/credit-hub/monetizacion/estado-cuenta"
            className="fm-btn-primary"
            style={{ display: "inline-block", marginTop: 14, textDecoration: "none" }}
          >
            Ver estado de cuenta →
          </Link>
        </section>
      </div>
    </div>
  );
}
