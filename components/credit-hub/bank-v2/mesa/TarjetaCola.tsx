"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { chRelTime } from "@/lib/credit-hub/bank/bankFormat";
import { formatEntero, formatFecha, formatMoneda, type LocaleTenant } from "@/lib/dcc/formato";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { BANDA_TEXTO, PRIORIDAD_TEXTO, RIESGO_TEXTO, iniciales, recomendacion } from "./mesa";

const BOTON_BORDE =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border bg-[var(--dcc-surface)] px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:shadow-[var(--dcc-focus)]";
const TONO = {
  principal: DCC_CLASSES.actionButton,
  secundaria: `${BOTON_BORDE} border-[var(--dcc-teal)] text-[var(--dcc-teal-ink)] hover:bg-[var(--dcc-teal-bg)]`,
  peligro: `${BOTON_BORDE} border-[var(--dcc-error-fg)] text-[var(--dcc-error-fg)] hover:bg-[var(--dcc-error-bg)]`,
} as const;

const PRIORIDAD_ESTILO: Record<BankQueueItem["priority"], string> = {
  ALTA: "border-[var(--dcc-error-fg)] text-[var(--dcc-error-fg)] bg-[var(--dcc-error-bg)]",
  MEDIA: "border-[var(--dcc-partial-line)] text-[var(--dcc-partial-fg)] bg-[var(--dcc-partial-bg)]",
  BAJA: "border-[var(--dcc-border-strong)] text-[var(--dcc-fg-muted)] bg-[var(--dcc-surface-muted)]",
};

/**
 * La cola no trae estas fuentes: "Próximamente" con frase llana. El detalle
 * tecnico esta en el bloque plegado de la Mesa.
 */
const EN_EXPEDIENTE = "Pronto aquí; mientras tanto, consúltalo en el expediente.";
const PROXIMAMENTE = [
  ["Ingresos verificados", EN_EXPEDIENTE],
  ["Deuda / ingreso", EN_EXPEDIENTE],
  ["Regla de política aplicada", "Este dato estará disponible próximamente."],
] as const;

/**
 * Una solicitud pendiente: quien, que vehiculo y dealer, monto, score y banda,
 * UNA accion recomendada (de la banda del motor) y la evidencia plegada. La
 * accion abre el expediente, donde se decide con las mismas reglas de hoy.
 */
export function TarjetaCola({ item, formato, href }: { item: BankQueueItem; formato: LocaleTenant; href: string }) {
  const rec = recomendacion(item.approval_band);
  const monto = formatMoneda(item.requested_amount, formato);
  const banda = item.approval_band ? BANDA_TEXTO[item.approval_band.toUpperCase()] : null;
  const riesgo = item.risk_level ? RIESGO_TEXTO[item.risk_level.toUpperCase()] : null;
  const recibida = formatFecha(item.created_at, formato);
  return (
    <article data-testid="cola-tarjeta" className="grid gap-3 border-t border-[var(--dcc-border)] py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--dcc-teal-bg)] text-xs font-semibold text-[var(--dcc-teal-ink)]">
          {iniciales(item.applicant_name)}
        </span>
        <div className="min-w-[180px] flex-1">
          <p className="truncate font-semibold">{item.applicant_name ?? "Solicitante sin nombre"}</p>
          <p className={`truncate text-xs ${DCC_CLASSES.muted}`}>
            {[item.vehicle_label, item.dealer_name].filter(Boolean).join(" · ") || "Vehículo y dealer sin datos"}
          </p>
        </div>
        <div className="min-w-[132px]">
          {monto ? <p className={`${DCC_CLASSES.cifra} text-base`}>{monto}</p> : <SelloCalidad calidad={{ estado: "no_disponible", motivo: "El importe estará disponible próximamente." }} />}
          <span className={`mt-1 inline-flex rounded-full border px-2 text-[11px] font-semibold ${PRIORIDAD_ESTILO[item.priority] ?? PRIORIDAD_ESTILO.BAJA}`}>
            Prioridad {PRIORIDAD_TEXTO[item.priority] ?? "—"}
          </span>
        </div>
        <div className="min-w-[96px]">
          <p className={`${DCC_CLASSES.cifra} text-base text-[var(--dcc-fg)]`}>{formatEntero(item.score, formato) ?? "—"}</p>
          <p className={`text-xs ${DCC_CLASSES.subtle}`}>{banda ?? "Sin banda"}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Link href={href} className={DCC_CLASSES.link}>
            Abrir expediente
          </Link>
          <Link href={href} data-testid="cola-accion" className={TONO[rec.tono]}>
            {rec.accion}
          </Link>
        </div>
      </div>
      <details className="group rounded-lg border border-[var(--dcc-border)] bg-[var(--dcc-surface-muted)] sm:ml-[52px]">
        <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-xs font-semibold text-[var(--dcc-teal-ink)]">
          <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden="true" />
          Ver evidencia
        </summary>
        <dl className="grid gap-x-6 gap-y-2 border-t border-[var(--dcc-border)] px-3 py-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <Dato k="Score del motor" v={formatEntero(item.score, formato)} />
          <Dato k="Nivel de riesgo" v={riesgo} />
          <Dato k="Banda del motor" v={banda} />
          <Dato k="Recibida" v={recibida ? `${recibida} · ${chRelTime(item.created_at)}` : null} />
          {PROXIMAMENTE.map(([k, motivo]) => (
            <div key={k} className="min-w-0">
              <dt className={DCC_CLASSES.subtle}>{k}</dt>
              <dd className="mt-0.5">
                <SelloCalidad calidad={{ estado: "no_disponible", motivo }} />
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </article>
  );
}

function Dato({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="min-w-0">
      <dt className={DCC_CLASSES.subtle}>{k}</dt>
      <dd className="mt-0.5 font-medium">{v ?? "—"}</dd>
    </div>
  );
}
