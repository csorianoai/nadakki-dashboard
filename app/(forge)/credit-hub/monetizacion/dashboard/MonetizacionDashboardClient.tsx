"use client";

import { useMemo, useState } from "react";
import { formatRd, formatRdCompact } from "@/lib/credit-hub/monetizacion/format";
import type { DashboardKPIs, DrilldownKey, DrilldownMap } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionShell, type TraceDrawerPayload } from "@/components/credit-hub/monetizacion/shell";
import {
  AlertChip,
  EventTapeRow,
  KpiCard,
  RevenueBar,
  StatCard,
  TenantRow,
  type FmAccent,
} from "@/components/credit-hub/monetizacion/ui";
import "./dashboard-screen.css";

const BUSINESS_KPIS: {
  key: DrilldownKey;
  label: string;
  pick: (k: DashboardKPIs) => string;
  delta: string;
  sub: string;
}[] = [
  { key: "gmv", label: "GMV financiado", pick: (k) => k.gmv, delta: "+12.4%", sub: "34 préstamos fundeados" },
  { key: "takerate", label: "Take rate", pick: (k) => k.take_rate, delta: "+0.3pp", sub: "ingreso / GMV" },
  { key: "mrr", label: "MRR", pick: (k) => k.mrr, delta: "+6.1%", sub: "recurrente" },
  {
    key: "margen",
    label: "Margen bruto",
    pick: (k) => k.margen_bruto,
    delta: "−2pp",
    sub: "ingreso − costo servir",
  },
];

const OPS_KPIS: { label: string; pick: (k: DashboardKPIs) => string; delta: string }[] = [
  { label: "Subastas activas", pick: (k) => String(k.subastas_activas), delta: "+4" },
  { label: "Bancos en línea", pick: (k) => k.bancos_en_linea, delta: "−1" },
  { label: "Aprobación", pick: (k) => k.aprobacion, delta: "+1.5pp" },
  { label: "Tiempo a 1ª oferta", pick: (k) => k.tiempo_primera_oferta, delta: "−0.6s" },
];

function tenantColorToAccent(color: string): FmAccent {
  if (color === "#2bd073") return "green";
  if (color === "#54a8ec") return "blue";
  if (color === "#a98bf0") return "violet";
  if (color === "#f4b740") return "amber";
  return "green";
}

function tapeTone(type: string): FmAccent {
  if (type === "FUNDEADO") return "green";
  if (type === "IA") return "violet";
  if (type === "OFERTA" || type === "DOC") return "blue";
  return "sub";
}

function kindLabel(kind: string): string {
  return kind === "banco" ? "Banco" : "Dealer";
}

type Props = {
  initialKpis: DashboardKPIs;
  drilldowns: DrilldownMap;
};

export function MonetizacionDashboardClient({ initialKpis, drilldowns }: Props) {
  const { openTrace } = useMonetizacionShell();
  const [kpis] = useState(initialKpis);

  const revenueTotal = useMemo(
    () => kpis.revenue_by_model.reduce((sum, slice) => sum + slice.amount, 0),
    [kpis.revenue_by_model],
  );

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

  return (
    <div className="fm-dash">
      <div className="fm-dash-alerts">
        {kpis.alerts.map((alert) => (
          <AlertChip key={alert.kind} kind={alert.kind} text={alert.text} severity={alert.severity} />
        ))}
      </div>

      <section>
        <p className="fm-dash-section-label">Negocio · clic en una cifra para ver su origen</p>
        <div className="fm-dash-kpi-grid">
          {BUSINESS_KPIS.map((item) => (
            <KpiCard
              key={item.key}
              label={item.label}
              value={item.pick(kpis)}
              delta={item.delta}
              sub={item.sub}
              onDrill={() => openDrilldown(item.key, item.pick(kpis))}
            />
          ))}
        </div>
      </section>

      <section>
        <p className="fm-dash-section-label">Operativo</p>
        <div className="fm-dash-kpi-grid">
          {OPS_KPIS.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.pick(kpis)} delta={item.delta} />
          ))}
        </div>
      </section>

      <div className="fm-dash-two-col">
        <section className="fm-ui-card">
          <div className="fm-dash-card-head">
            <h3 className="fm-dash-card-title">Ingreso por modelo de cobro</h3>
            <span className="fm-dash-card-total">{formatRd(revenueTotal)}</span>
          </div>
          {kpis.revenue_by_model.map((slice) => (
            <RevenueBar
              key={slice.label}
              label={slice.label}
              amount={formatRd(slice.amount, 0)}
              pct={slice.pct}
              color={slice.color as FmAccent}
            />
          ))}
        </section>

        <section className="fm-ui-card">
          <div className="fm-dash-tape-head">
            <span className="fm-dash-tape-dot" aria-hidden />
            <h3 className="fm-dash-card-title">Cinta de eventos facturables</h3>
          </div>
          {kpis.tape.map((row) => (
            <EventTapeRow
              key={`${row.time}-${row.type}-${row.text}`}
              time={row.time}
              type={row.type}
              text={row.text}
              amount={row.amount}
              tone={tapeTone(row.type)}
            />
          ))}
        </section>
      </div>

      <section className="fm-ui-card fm-dash-tenant-scroll">
        <div className="fm-dash-card-head">
          <h3 className="fm-dash-card-title">Tenants · ingreso, costo y margen</h3>
        </div>
        <p className="fm-dash-tenant-note">
          margen efectivo = (ingreso − costo de servir) / ingreso
        </p>
        <div className="fm-dash-tenant-table">
        <div className="fm-dash-tenant-head">
          <span>Tenant</span>
          <span>Tipo</span>
          <span>Modelo</span>
          <span>Gmv/volumen</span>
          <span>Ingreso</span>
          <span>Costo</span>
          <span>Margen</span>
        </div>
        {kpis.tenants.map((tenant) => (
          <button
            key={tenant.name}
            type="button"
            className="fm-dash-tenant-row"
            onClick={() => openDrilldown("margen", `${tenant.margin_pct}%`)}
          >
            <TenantRow
              name={tenant.name}
              initials={tenant.initial}
              accent={tenantColorToAccent(tenant.color)}
              kind={kindLabel(tenant.kind)}
              model={tenant.model}
              gmv={formatRdCompact(tenant.gmv).replace("RD$ ", "")}
              revenue={tenant.revenue.toLocaleString("en-US")}
              cost={tenant.cost.toLocaleString("en-US")}
              margin={`${tenant.margin_pct}%`}
              status={tenant.status}
            />
          </button>
        ))}
        </div>
      </section>
    </div>
  );
}
