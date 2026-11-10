"use client";

import type { PuntoSerie } from "@/lib/analytics/graficos";
import { formatearDiaCorto } from "./formato";
import { cn } from "@/lib/utils";

export interface TiraConversionesProps {
  /** Conversiones por dia (mismo orden que el grafico de inversion). */
  conversiones: PuntoSerie[];
  /** Dias finales que pueden estar incompletos. */
  diasIncompletos: number;
  className?: string;
}

/** Tira de dias con conversion: una celda por dia. Resumen en texto y lista de fechas para lectores de pantalla. */
export function TiraConversiones({ conversiones, diasIncompletos, className }: TiraConversionesProps) {
  const dias = conversiones.length;
  const conConversion = conversiones.filter((p) => typeof p.y === "number" && Number.isFinite(p.y) && p.y > 0);
  const total = conConversion.reduce((s, p) => s + (p.y as number), 0);
  const fechas = conConversion.map((p) => formatearDiaCorto(p.x)).join(", ");
  const primerIncompleto = dias - Math.max(0, Math.min(diasIncompletos, dias));
  return (
    <div className={cn("min-w-0", className)} data-testid="tira-conversiones">
      <p className="m-0 text-forge-xs font-medium text-forgeGray-800">
        {`Días con conversión: ${conConversion.length} de ${dias} (${total} ${total === 1 ? "conversión" : "conversiones"} en total)`}
      </p>
      <div role="img" aria-label={`Días con conversión: ${fechas || "ninguno"}`} className="mt-2 flex h-3 gap-px" data-testid="tira-celdas">
        {conversiones.map((p, i) => {
          const hay = typeof p.y === "number" && Number.isFinite(p.y) && p.y > 0;
          const incompleto = i >= primerIncompleto;
          return (
            <span
              key={`${p.x}-${i}`}
              data-conversion={hay ? "1" : "0"}
              data-incompleto={incompleto ? "1" : "0"}
              className={cn("min-w-0 flex-1 rounded-[2px]", hay ? "bg-forgeBrand-700" : "bg-forgeGray-200", incompleto && "opacity-50")}
            />
          );
        })}
      </div>
      <p className="m-0 mt-1 text-forge-xs text-forgeGray-600">Oscuro: día con conversión · tenue: datos que pueden estar incompletos</p>
    </div>
  );
}
