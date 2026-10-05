"use client";

import { AlertTriangle, Inbox, Loader2, Lock } from "lucide-react";
import { DCC_CLASSES } from "./clases";
import { SelloCalidad } from "./SelloCalidad";

export type EstadoDcc = "cargando" | "vacio" | "error" | "no_disponible" | "bloqueado";

const ICONO = { cargando: Loader2, vacio: Inbox, error: AlertTriangle, bloqueado: Lock };

const TEXTO: Record<Exclude<EstadoDcc, "no_disponible">, string> = {
  cargando: "Cargando…",
  vacio: "Todavía no hay registros.",
  error: "No se pudo cargar. Vuelve a intentarlo.",
  bloqueado: "Tu plan no incluye esta información.",
};

/**
 * Cuerpo para los estados sin cifra. Nunca pinta un numero. "No disponible"
 * es compacto: solo el sello "Próximamente"; el detalle tecnico va al tooltip.
 * En `error`, el detalle (codigo HTTP, motivo) tambien va al tooltip.
 */
export function DccEstado({ estado, detalle, onReintentar }: { estado: EstadoDcc; detalle?: string | null; onReintentar?: () => void }) {
  if (estado === "no_disponible") {
    return (
      <div data-testid="dcc-estado" data-estado={estado}>
        <SelloCalidad calidad={{ estado: "no_disponible", motivo: detalle ?? null }} />
      </div>
    );
  }
  const Icono = ICONO[estado];
  return (
    <div
      data-testid="dcc-estado"
      data-estado={estado}
      title={detalle ?? undefined}
      role={estado === "error" ? "alert" : estado === "cargando" ? "status" : undefined}
      className={`flex items-start gap-2 text-sm ${estado === "error" ? "text-[var(--dcc-error-fg)]" : DCC_CLASSES.muted}`}
    >
      <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${estado === "cargando" ? "animate-spin" : ""}`} aria-hidden="true" />
      <div className="min-w-0">
        <p>{TEXTO[estado]}</p>
        {estado !== "error" && detalle ? <p className={`mt-1 text-xs ${DCC_CLASSES.subtle}`}>{detalle}</p> : null}
        {estado === "error" && onReintentar ? (
          <button type="button" onClick={onReintentar} className={`mt-2 ${DCC_CLASSES.link}`}>
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
