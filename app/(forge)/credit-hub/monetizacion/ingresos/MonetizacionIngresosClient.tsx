"use client";

import { formatRd, formatRdCompact } from "@/lib/credit-hub/monetizacion/format";
import type { DrilldownKey, DrilldownMap, RevenueAnalytics } from "@/lib/credit-hub/monetizacion/types";
import {
  isMonetizacionOperadorView,
  MONETIZACION_OPERADOR_EMPTY_MESSAGE,
} from "@/lib/credit-hub/monetizacion/operador-gate";
import { useMonetizacionShell, type TraceDrawerPayload } from "@/components/credit-hub/monetizacion/shell";
import { useAuth } from "@/hooks/useAuth";
import {
  KpiCard,
  MonetizacionScreenEmpty,
  RevenueBar,
  StatCard,
  type FmAccent,
} from "@/components/credit-hub/monetizacion/ui";
import { tenantInitialClass } from "@/components/credit-hub/monetizacion/ui/types";
import "./ingresos-screen.css";

function sliceColor(color: string): FmAccent {
  if (color === "green") return "green";
  if (color === "blue") return "blue";
  if (color === "violet") return "violet";
  if (color === "amber") return "amber";
  return "sub";
}

function tenantColorToAccent(color: string): FmAccent {
  if (color === "#2bd073") return "green";
  if (color === "#54a8ec") return "blue";
  if (color === "#a98bf0") return "violet";
  if (color === "#f4b740") return "amber";
  return "sub";
}

type Props = {
  revenue: RevenueAnalytics;
  drilldowns: DrilldownMap;
};

export function MonetizacionIngresosClient({ revenue, drilldowns }: Props) {
  const { tenantId, openTrace } = useMonetizacionShell();
  const { activeRole } = useAuth();

  const openDrilldown = (key: DrilldownKey, aggFormatted: string) => {
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

  if (!isMonetizacionOperadorView(activeRole?.role_key, tenantId)) {
    return <MonetizacionScreenEmpty message={MONETIZACION_OPERADOR_EMPTY_MESSAGE} />;
  }

  const modelTotal = revenue.by_model.reduce((sum, slice) => sum + slice.amount, 0);

  return (
    <div className="fm-ingresos">
      <p className="fm-ingresos-lead">
        Ingreso operado por la plataforma · {revenue.period} · clic en una cifra para ver su origen
      </p>

      <div className="fm-ingresos-kpi-grid">
        <KpiCard
          label="Ingreso total"
          value={revenue.total}
          delta={revenue.total_delta}
          onDrill={() => openDrilldown("takerate", revenue.total)}
        />
        <KpiCard
          label="GMV financiado"
          value={revenue.gmv}
          delta={revenue.gmv_delta}
          onDrill={() => openDrilldown("gmv", revenue.gmv)}
        />
        <KpiCard
          label="Take rate efectivo"
          value={revenue.take_rate}
          sub="ingreso / GMV facturable"
          onDrill={() => openDrilldown("takerate", revenue.take_rate)}
        />
        <StatCard
          label="Ticket medio / tenant"
          value={revenue.ticket_medio}
          delta={`${revenue.active_tenants} tenants activos`}
        />
      </div>

      <div className="fm-ingresos-two-col">
        <section className="fm-ui-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h3 className="fm-ingresos-card-title" style={{ margin: 0 }}>
              Ingreso por modelo de cobro
            </h3>
            <span className="fm-mono" style={{ fontSize: 12 }}>
              {formatRd(modelTotal, 0)}
            </span>
          </div>
          {revenue.by_model.map((slice) => (
            <RevenueBar
              key={slice.label}
              label={slice.label}
              amount={formatRd(slice.amount, 0)}
              pct={slice.pct}
              color={sliceColor(slice.color)}
            />
          ))}
        </section>

        <section className="fm-ui-card">
          <h3 className="fm-ingresos-card-title">GMV vs. take rate · 6 meses</h3>
          <div className="fm-ingresos-chart-legend">
            <span className="fm-ingresos-legend-gmv">GMV</span>
            <span className="fm-ingresos-legend-take">Take rate</span>
          </div>
          <div className="fm-ingresos-chart">
            {revenue.gmv_vs_take.map((point) => (
              <div key={point.month} className="fm-ingresos-chart-col">
                <div className="fm-ingresos-chart-bars">
                  <div className="fm-ingresos-chart-gmv" style={{ height: `${point.gmv_h}%` }} />
                  <div className="fm-ingresos-chart-take" style={{ height: `${point.take_h}%` }} />
                </div>
                <span className="fm-ingresos-chart-label">{point.month}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="fm-ui-card fm-ingresos-tenant-scroll">
        <h3 className="fm-ingresos-card-title">Ingreso por tenant</h3>
        <div className="fm-ingresos-tenant-head">
          <span>Tenant</span>
          <span>Gmv</span>
          <span>Ingreso</span>
          <span>% del total</span>
          <span>Modelo</span>
        </div>
        {revenue.by_tenant.map((row) => (
          <button
            key={row.name}
            type="button"
            className="fm-ingresos-tenant-row"
            onClick={() => openDrilldown(row.drilldown_key, row.revenue.toLocaleString("en-US"))}
          >
            <span className="fm-ingresos-tenant-name">
              <span className={`fm-ui-tenant-initial ${tenantInitialClass(tenantColorToAccent(row.color))}`}>
                {row.initial}
              </span>
              {row.name}
            </span>
            <span className="fm-mono">{formatRdCompact(row.gmv).replace("RD$ ", "")}</span>
            <span className="fm-mono">{row.revenue.toLocaleString("en-US")}</span>
            <span className="fm-mono">{row.pct}%</span>
            <span>{row.model}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
