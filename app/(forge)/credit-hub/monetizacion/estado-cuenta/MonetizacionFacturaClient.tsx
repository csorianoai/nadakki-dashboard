"use client";

import { toast } from "sonner";
import { formatRd } from "@/lib/credit-hub/monetizacion/format";
import type { DrilldownKey, DrilldownMap, Invoice } from "@/lib/credit-hub/monetizacion/types";
import { DEMO_TENANTS, useMonetizacionShell, type TraceDrawerPayload } from "@/components/credit-hub/monetizacion/shell";
import { InvoiceLine, InvoiceTotals } from "@/components/credit-hub/monetizacion/ui";
import "./factura-screen.css";

type Props = {
  invoice: Invoice;
  drilldowns: DrilldownMap;
};

export function MonetizacionFacturaClient({ invoice, drilldowns }: Props) {
  const { tenantId, openTrace } = useMonetizacionShell();
  const tenant = DEMO_TENANTS.find((t) => t.id === tenantId) ?? DEMO_TENANTS[0];

  const openLineDrilldown = (key: DrilldownKey, amount: number) => {
    const drilldown = drilldowns[key];
    if (!drilldown) return;
    openTrace({
      kicker: "TRAZABILIDAD · EVENTOS DE ORIGEN",
      title: drilldown.title,
      sub: drilldown.sub,
      drilldown,
      aggFormatted: formatRd(amount),
    } as TraceDrawerPayload);
  };

  return (
    <div className="fm-factura-wrap">
      <article className="fm-ui-card fm-factura-card">
        <header className="fm-factura-header">
          <div className="fm-factura-tenant">
            <span className="fm-factura-initial">{tenant.initials}</span>
            <div>
              <h1 className="fm-factura-title">{tenant.label}</h1>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fm-sub)" }}>
                Estado de cuenta · {invoice.period} · modelo {invoice.model}
              </p>
            </div>
          </div>
          <div className="fm-factura-meta">
            <div className="fm-factura-number">{invoice.number}</div>
            <div className="fm-factura-issued">
              emitida {invoice.issued_at} · RNC operador {invoice.rnc}
            </div>
            <span className="fm-factura-ficticio">DATOS FICTICIOS</span>
          </div>
        </header>

        <div className="fm-factura-audit-hint">
          <span style={{ color: "var(--fm-tenant)" }} aria-hidden>
            👁
          </span>
          <span>
            Cada línea es auditable. Clic en cualquier renglón para descomponerlo en sus eventos de origen, con timestamp y hash.
          </span>
        </div>

        <div className="fm-factura-cols">
          <span>Concepto</span>
          <span>Importe RD$</span>
        </div>

        {invoice.lines.map((line) => (
          <InvoiceLine
            key={line.drilldown_key}
            label={line.label}
            count={line.count}
            note={line.note}
            amount={formatRd(line.amount)}
            onDrill={() => openLineDrilldown(line.drilldown_key as DrilldownKey, line.amount)}
          />
        ))}

        <div className="fm-factura-info fm-factura-info--ok">
          ✓ Mínimo mensual garantizado {formatRd(invoice.min_guarantee)} — cumplido por comisión + base, sin ajuste.
        </div>
        <div className="fm-factura-info fm-factura-info--muted">{invoice.setup_note}</div>

        <InvoiceTotals
          subtotal={formatRd(invoice.subtotal)}
          itbis={formatRd(invoice.itbis)}
          total={formatRd(invoice.total)}
        />

        <div className="fm-factura-actions">
          <button
            type="button"
            className="fm-factura-btn"
            onClick={() =>
              toast.success("Reconciliación: 4 líneas ↔ 49 eventos · 0 discrepancias")
            }
          >
            Reconciliar contra eventos
          </button>
          <button
            type="button"
            className="fm-factura-btn"
            onClick={() => toast.info("PDF en preparación · incluye anexo de eventos auditables")}
          >
            Exportar PDF
          </button>
        </div>
      </article>
    </div>
  );
}
