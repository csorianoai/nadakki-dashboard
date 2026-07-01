"use client";

import { toast } from "sonner";
import { formatRd } from "@/lib/credit-hub/monetizacion/format";
import type { DrilldownKey, DrilldownMap, Reconciliation } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionShell, type TraceDrawerPayload } from "@/components/credit-hub/monetizacion/shell";
import { StatCard } from "@/components/credit-hub/monetizacion/ui";
import "./reconciliacion-screen.css";

type Props = {
  reconciliation: Reconciliation;
  drilldowns: DrilldownMap;
};

export function MonetizacionReconciliacionClient({ reconciliation, drilldowns }: Props) {
  const { openTrace } = useMonetizacionShell();

  const openMatch = (key: string, sum: number) => {
    const drilldown = drilldowns[key as DrilldownKey];
    if (!drilldown) return;
    openTrace({
      kicker: "TRAZABILIDAD · EVENTOS DE ORIGEN",
      title: drilldown.title,
      sub: drilldown.sub,
      drilldown,
      aggFormatted: formatRd(sum),
    } as TraceDrawerPayload);
  };

  return (
    <div>
      <header className="fm-recon-header">
        <p className="fm-recon-lead">
          Cada evento facturable, trazable contra su origen. Banco del Cibao · mayo 2026.
        </p>
        <div className="fm-recon-actions">
          <span className="fm-recon-ok-chip">✓ 0 discrepancias</span>
          <button type="button" className="fm-recon-export-btn" onClick={() => toast.info("Exportando libro de eventos auditables")}>
            Exportar libro
          </button>
        </div>
      </header>

      <div className="fm-recon-kpi-grid">
        <StatCard label="Líneas de factura" value={String(reconciliation.lines_count)} />
        <StatCard label="Eventos vinculados" value={reconciliation.events_count.toLocaleString("en-US")} />
        <StatCard label="Suma reconciliada" value={formatRd(reconciliation.reconciled_sum, 0)} />
        <StatCard label="Discrepancia" value={formatRd(reconciliation.discrepancy)} />
      </div>

      <section className="fm-ui-card" style={{ marginBottom: 16 }}>
        <h3 className="fm-recon-card-title">Factura ↔ eventos de origen</h3>
        <div className="fm-recon-table-head">
          <span>Línea</span>
          <span>Eventos</span>
          <span>Facturado</span>
          <span>Σ eventos</span>
          <span>Ok</span>
        </div>
        {reconciliation.matches.map((match) => (
          <button
            key={match.drilldown_key}
            type="button"
            className="fm-recon-row"
            onClick={() => openMatch(match.drilldown_key, match.sum)}
          >
            <span className="fm-recon-row-label">{match.label}</span>
            <span className="fm-recon-row-mono">{match.events.toLocaleString("en-US")}</span>
            <span className="fm-recon-row-mono">{formatRd(match.billed)}</span>
            <span className="fm-recon-row-mono">{formatRd(match.sum)}</span>
            <span className="fm-recon-row-ok">{match.ok ? "✓" : "—"}</span>
          </button>
        ))}
      </section>

      <section className="fm-ui-card">
        <h3 className="fm-recon-card-title">Libro de eventos · audit trail</h3>
        {reconciliation.ledger.map((event) => (
          <div key={`${event.id}-${event.hash}`} className="fm-recon-ledger-row">
            <span className="fm-ui-tape-tag">{event.type}</span>
            <span className="fm-recon-ledger-detail">
              <span className="fm-mono">{event.id}</span> · {event.detail}
            </span>
            <span className="fm-ui-audit-hash">🔒 {event.hash}</span>
            <span className="fm-recon-ledger-amount">{formatRd(event.amount)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
