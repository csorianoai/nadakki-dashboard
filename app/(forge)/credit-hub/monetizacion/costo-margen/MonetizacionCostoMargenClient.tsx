"use client";

import Link from "next/link";
import { formatRd } from "@/lib/credit-hub/monetizacion/format";
import type { CostMargin, DrilldownKey, DrilldownMap } from "@/lib/credit-hub/monetizacion/types";
import {
  isMonetizacionOperadorView,
  MONETIZACION_OPERADOR_EMPTY_MESSAGE,
} from "@/lib/credit-hub/monetizacion/operador-gate";
import { useMonetizacionShell, type TraceDrawerPayload } from "@/components/credit-hub/monetizacion/shell";
import {
  KpiCard,
  MarginBadge,
  MonetizacionScreenEmpty,
  RevenueBar,
  StatCard,
  type FmAccent,
} from "@/components/credit-hub/monetizacion/ui";
import { tenantInitialClass } from "@/components/credit-hub/monetizacion/ui/types";
import "./costo-margen-screen.css";

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
  costMargin: CostMargin;
  drilldowns: DrilldownMap;
};

export function MonetizacionCostoMargenClient({ costMargin, drilldowns }: Props) {
  const { tenantId, openTrace } = useMonetizacionShell();

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

  if (!isMonetizacionOperadorView(tenantId)) {
    return <MonetizacionScreenEmpty message={MONETIZACION_OPERADOR_EMPTY_MESSAGE} />;
  }

  const llmTotal = costMargin.llm_by_core.reduce((sum, slice) => sum + slice.amount, 0);
  const { guardrail } = costMargin;

  return (
    <div className="fm-costo-margen">
      <p className="fm-costo-margen-lead">
        Costo de servir y margen bruto · costo LLM por core + infra · {costMargin.period} · clic en una cifra
        para ver su origen
      </p>

      <div className="fm-costo-margen-kpi-grid">
        <KpiCard
          label="Margen bruto agregado"
          value={costMargin.margen_bruto}
          delta={costMargin.margen_delta}
          onDrill={() => openDrilldown("margen", costMargin.margen_bruto)}
        />
        <KpiCard
          label="Costo de servir"
          value={costMargin.costo_servir}
          delta={costMargin.costo_servir_delta}
          onDrill={() => openDrilldown("margen", costMargin.costo_servir)}
        />
        <KpiCard
          label="Costo LLM"
          value={costMargin.costo_llm}
          sub={costMargin.costo_llm_share}
          onDrill={() => openDrilldown("ai", costMargin.costo_llm)}
        />
        <StatCard
          label="Tenants margen < umbral"
          value={String(costMargin.tenants_bajo_umbral)}
          delta={`umbral ${costMargin.umbral_pct}%`}
        />
      </div>

      <div className="fm-costo-margen-two-col">
        <section className="fm-ui-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h3 className="fm-costo-margen-card-title" style={{ margin: 0 }}>
              Costo LLM por core
            </h3>
            <span className="fm-mono" style={{ fontSize: 12 }}>
              {formatRd(llmTotal, 0)}
            </span>
          </div>
          {costMargin.llm_by_core.map((slice) => (
            <RevenueBar
              key={slice.label}
              label={slice.label}
              amount={formatRd(slice.amount, 0)}
              pct={slice.pct}
              color={sliceColor(slice.color)}
            />
          ))}
        </section>

        <section className="fm-ui-card fm-costo-margen-tenant-scroll">
          <h3 className="fm-costo-margen-card-title">Margen por tenant · semáforo</h3>
          <div className="fm-costo-margen-tenant-head">
            <span>Tenant</span>
            <span>Ingreso</span>
            <span>Costo</span>
            <span>Margen</span>
          </div>
          {costMargin.margin_by_tenant.map((row) => (
            <button
              key={row.name}
              type="button"
              className="fm-costo-margen-tenant-row"
              onClick={() => openDrilldown("margen", `${row.margin_pct}%`)}
            >
              <span className="fm-costo-margen-tenant-name">
                <span className={`fm-ui-tenant-initial ${tenantInitialClass(tenantColorToAccent(row.color))}`}>
                  {row.initial}
                </span>
                {row.name}
              </span>
              <span className="fm-mono">{row.revenue.toLocaleString("en-US")}</span>
              <span className="fm-mono">{row.cost.toLocaleString("en-US")}</span>
              <MarginBadge value={`${row.margin_pct}%`} status={row.status} />
            </button>
          ))}
        </section>
      </div>

      <aside className="fm-costo-margen-guardrail" role="note">
        <span className="fm-costo-margen-guardrail-icon" aria-hidden>
          ⚠
        </span>
        <div className="fm-costo-margen-guardrail-body">
          <p className="fm-costo-margen-guardrail-title">
            {guardrail.tenant} opera al {guardrail.margin_pct}% de margen — bajo el umbral del{" "}
            {guardrail.umbral_pct}%
          </p>
          <p className="fm-costo-margen-guardrail-sub">{guardrail.reason}</p>
          <Link href="/credit-hub/monetizacion/configuracion" className="fm-costo-margen-guardrail-link">
            Ajustar cobro →
          </Link>
        </div>
      </aside>
    </div>
  );
}
