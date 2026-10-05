"use client";

import { AlertTriangle, CircleDashed, Inbox, Loader2, Lock } from "lucide-react";
import { DCC_CLASSES } from "./clases";

export type EstadoDcc = "cargando" | "vacio" | "error" | "no_disponible" | "bloqueado";

const ICONO = { cargando: Loader2, vacio: Inbox, error: AlertTriangle, no_disponible: CircleDashed, bloqueado: Lock };

const TEXTO: Record<EstadoDcc, string> = {
  cargando: "Cargando…",
  vacio: "Todavía no hay registros.",
  error: "No se pudo cargar. Vuelve a intentarlo.",
  no_disponible: "El backend todavía no entrega esta cifra.",
  bloqueado: "Tu plan no incluye esta información.",
};

/** Cuerpo de tarjeta para los estados sin cifra. Nunca pinta un numero. */
export function DccEstado({ estado, detalle, onReintentar }: { estado: EstadoDcc; detalle?: string | null; onReintentar?: () => void }) {
  const Icono = ICONO[estado];
  return (
    <div
      data-testid="dcc-estado"
      data-estado={estado}
      role={estado === "error" ? "alert" : estado === "cargando" ? "status" : undefined}
      className={`flex items-start gap-2 text-sm ${estado === "error" ? "text-[var(--dcc-error-fg)]" : DCC_CLASSES.muted}`}
    >
      <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${estado === "cargando" ? "animate-spin" : ""}`} aria-hidden="true" />
      <div className="min-w-0">
        <p>{TEXTO[estado]}</p>
        {detalle ? <p className={`mt-1 text-xs ${DCC_CLASSES.subtle}`}>{detalle}</p> : null}
        {estado === "error" && onReintentar ? (
          <button type="button" onClick={onReintentar} className={`mt-2 ${DCC_CLASSES.quietButton}`}>
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
