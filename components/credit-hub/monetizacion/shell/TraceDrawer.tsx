"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { Drilldown } from "@/lib/credit-hub/monetizacion/types";
import { formatRd } from "@/lib/credit-hub/monetizacion/format";
import { AuditRow } from "@/components/credit-hub/monetizacion/ui/AuditRow";

export type TraceDrawerPayload = {
  kicker?: string;
  title: string;
  sub?: string;
  body?: string;
  drilldown?: Drilldown;
  aggFormatted?: string;
} | null;

type Props = {
  open: boolean;
  payload: TraceDrawerPayload;
  onClose: () => void;
};

export function TraceDrawer({ open, payload, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const drilldown = payload?.drilldown;
  const aggDisplay = payload?.aggFormatted ?? (drilldown ? formatRd(drilldown.aggValue) : null);

  return (
    <aside
      className={`fm-drawer${open ? " fm-drawer--open" : ""}`}
      aria-hidden={!open}
      aria-label="Trazabilidad de métrica"
    >
      <div className="fm-drawer-inner">
        <div className="fm-drawer-header">
          <div>
            <p className="fm-drawer-kicker">{payload?.kicker ?? "TRAZABILIDAD · EVENTOS DE ORIGEN"}</p>
            <h2 className="fm-drawer-title">{payload?.title ?? "Trazabilidad"}</h2>
            {payload?.sub ? <p className="fm-drawer-sub">{payload.sub}</p> : null}
          </div>
          <button type="button" className="fm-drawer-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {payload?.body && !drilldown ? <p className="fm-drawer-empty">{payload.body}</p> : null}

        {drilldown ? (
          <>
            <div className="fm-drawer-agg">
              <span className="fm-drawer-agg-label">{drilldown.agg_label}</span>
              <div className="fm-drawer-agg-row">
                <span className="fm-drawer-agg-value fm-mono">{aggDisplay}</span>
                <span className="fm-drawer-verified">✓ verificado</span>
              </div>
              <span className="fm-drawer-count">{drilldown.count}</span>
            </div>
            <div className="fm-drawer-events">
              {drilldown.events.map((event) => (
                <div key={`${event.id}-${event.hash}`} className="fm-drawer-event">
                  <AuditRow
                    type={event.type}
                    id={event.id}
                    detail={`${event.detail} · ${event.time}`}
                    hash={event.hash}
                    amount={formatRd(event.amount)}
                  />
                  <button
                    type="button"
                    className="fm-drawer-event-link"
                    onClick={() => toast.info("Abriendo registro completo del evento · audit trail")}
                  >
                    registro completo ↗
                  </button>
                </div>
              ))}
            </div>
            <p className="fm-drawer-foot">{drilldown.foot}</p>
          </>
        ) : !payload?.body ? (
          <p className="fm-drawer-empty">Selecciona un KPI o línea de factura para ver el desglose de eventos.</p>
        ) : null}
      </div>
    </aside>
  );
}
