"use client";

import { useEffect } from "react";

export type TraceDrawerPayload = {
  title: string;
  kicker?: string;
  body?: string;
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

  return (
    <aside
      className={`fm-drawer${open ? " fm-drawer--open" : ""}`}
      aria-hidden={!open}
      aria-label="Trazabilidad de métrica"
    >
      <div className="fm-drawer-inner">
        <div className="fm-drawer-header">
          <div>
            {payload?.kicker ? <p className="fm-drawer-kicker">{payload.kicker}</p> : null}
            <h2 className="fm-drawer-title">{payload?.title ?? "Trazabilidad"}</h2>
          </div>
          <button type="button" className="fm-drawer-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {payload?.body ? (
          <p className="fm-drawer-empty">{payload.body}</p>
        ) : (
          <p className="fm-drawer-empty">
            Selecciona un KPI o línea de factura para ver el desglose de eventos.
          </p>
        )}
      </div>
    </aside>
  );
}
