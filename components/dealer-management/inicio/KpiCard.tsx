"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { BloqueEstado as Estado } from "@/lib/dealer-management/bloque-estado";
import { BloqueEstadoView } from "./BloqueEstado";

export type KpiTono = "neutro" | "ok" | "revisar" | "urgente";

const TONO_COLOR: Record<KpiTono, string> = {
  neutro: "var(--brand)",
  ok: "var(--success)",
  revisar: "var(--warning)",
  urgente: "var(--danger)",
};

export type KpiCardProps = {
  etiqueta: string;
  /** Cifra ya formateada con el locale y la moneda del tenant. */
  valor?: string;
  /** Linea secundaria: contexto util, no relleno. */
  contexto?: string;
  tono?: KpiTono;
  icono: LucideIcon;
  /** Un clic lleva al destino YA FILTRADO (ficha, seccion 0.5). */
  href: string;
  estado: Estado;
  onReintentar?: () => void;
};

/**
 * Tarjeta KPI, patron 1.1 de la ficha: borde izquierdo de 3 px del color de la
 * metrica, etiqueta en mayusculas, cifra grande en ese mismo color, linea
 * secundaria, chevron a la derecha e icono tenue decorativo.
 *
 * Toda la tarjeta es un <a>: un clic lleva a la pantalla de destino ya
 * filtrada en el caso concreto. Si el estado no es "ok", la tarjeta NO muestra
 * cifra: muestra el caso de la tabla 1 de avisos.
 */
export function KpiCard({
  etiqueta,
  valor,
  contexto,
  tono = "neutro",
  icono: Icono,
  href,
  estado,
  onReintentar,
}: KpiCardProps) {
  const color = TONO_COLOR[tono];
  const interactivo = estado.caso === "ok";

  const cuerpo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-muted)]">
          {etiqueta}
        </p>
        {interactivo ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden="true" />
        ) : null}
      </div>

      <div className="mt-3 min-h-[3.25rem]">
        {interactivo ? (
          <>
            <p
              data-kpi-valor
              className="font-dealer-display font-dealer-numeric text-[30px] font-bold leading-none"
              style={{ color }}
            >
              {valor}
            </p>
            {contexto ? (
              <p className="mt-1.5 text-xs text-[var(--fg-muted)]">{contexto}</p>
            ) : null}
          </>
        ) : (
          <BloqueEstadoView estado={estado} titulo={etiqueta} onReintentar={onReintentar} />
        )}
      </div>

      <Icono
        className="pointer-events-none absolute bottom-2 right-2 h-12 w-12 opacity-[0.06]"
        style={{ color }}
        aria-hidden="true"
      />
    </>
  );

  const clases =
    "relative block overflow-hidden rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-4 pl-5 shadow-[var(--shadow-sm)]";

  if (!interactivo) {
    return (
      <div className={clases} style={{ borderLeft: `3px solid ${color}` }} data-kpi={etiqueta}>
        {cuerpo}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${clases} transition hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]`}
      style={{ borderLeft: `3px solid ${color}` }}
      data-kpi={etiqueta}
    >
      {cuerpo}
    </Link>
  );
}
