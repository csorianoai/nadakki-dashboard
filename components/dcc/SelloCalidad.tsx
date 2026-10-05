"use client";

import { CheckCircle2, CircleDashed, CircleHelp, Lock } from "lucide-react";
import { rotuloCalidad, type Calidad } from "@/lib/dcc/calidad";
import { DccTooltip } from "./DccTooltip";

/** Colores de estado: reservados a calidad y riesgo (nunca dorado ni turquesa). */
const ESTILO: Record<Calidad["estado"], string> = {
  verificado: "bg-[var(--dcc-ok-bg)] text-[var(--dcc-ok-fg)] border-[var(--dcc-ok-line)]",
  parcial: "bg-[var(--dcc-partial-bg)] text-[var(--dcc-partial-fg)] border-[var(--dcc-partial-line)]",
  bloqueado: "bg-[var(--dcc-blocked-bg)] text-[var(--dcc-blocked-fg)] border-[var(--dcc-blocked-line)]",
  no_disponible: "bg-transparent text-[var(--dcc-na-fg)] border-dashed border-[var(--dcc-na-border)]",
};

const ICONO = {
  verificado: CheckCircle2,
  parcial: CircleHelp,
  bloqueado: Lock,
  no_disponible: CircleDashed,
} as const;

/** Lo que ve el usuario. Sin dato: solo "Próximamente"; el porque va al tooltip. */
export function textoSello(calidad: Calidad): string {
  return calidad.estado === "no_disponible" ? "Próximamente" : rotuloCalidad(calidad);
}

/** Detalle para el tooltip: motivo y rotulos tecnicos, nunca en la vista. */
function detalle(calidad: Calidad, tecnico: string | null | undefined): string {
  const lineas: string[] = [];
  if ((calidad.estado === "parcial" || calidad.estado === "no_disponible") && calidad.motivo) lineas.push(calidad.motivo);
  if (calidad.estado === "bloqueado" && calidad.reasonCode) lineas.push(`reason_code: ${calidad.reasonCode}`);
  if (tecnico?.trim()) lineas.push(tecnico.trim());
  return lineas.join(" · ");
}

/** Sello compacto: verificado / parcial n/m / bloqueado / Próximamente. */
export function SelloCalidad({ calidad, tecnico }: { calidad: Calidad; tecnico?: string | null }) {
  const Icono = ICONO[calidad.estado];
  return (
    <DccTooltip contenido={detalle(calidad, tecnico)}>
      <span
        data-testid="dcc-sello"
        data-estado={calidad.estado}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ESTILO[calidad.estado]}`}
      >
        <Icono className="h-3 w-3" aria-hidden="true" />
        {textoSello(calidad)}
      </span>
    </DccTooltip>
  );
}
