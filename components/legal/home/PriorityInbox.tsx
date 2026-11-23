"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, FileCheck2, Gavel } from "lucide-react";
import type { LegalCase } from "@/lib/legal/cases/case-types";
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import { useHearingsList } from "@/hooks/legal/useHearings";
import { useValidationQueue } from "@/hooks/legal/useValidationQueue";
import {
  desdeAudiencia, desdePlazo, desdeRevision, ordenarPrioridades, type ElementoPrioridad, type TipoPrioridad,
} from "@/lib/legal/home/bandeja-prioridades";

const MAX_FILAS = 6;
const DIAS = 7;

const ICONO: Record<TipoPrioridad, typeof CalendarClock> = { plazo: CalendarClock, audiencia: Gavel, revision: FileCheck2 };
const NOMBRE: Record<TipoPrioridad, string> = { plazo: "Plazos", audiencia: "Audiencias", revision: "Revisiones" };

function ventana(): { from: string; to: string } {
  const now = new Date();
  now.setSeconds(0, 0);
  return { from: now.toISOString(), to: new Date(now.getTime() + DIAS * 864e5).toISOString() };
}

function cuando(e: ElementoPrioridad): string | null {
  if (!e.fecha) return null;
  if (e.tipo === "audiencia") {
    const d = new Date(e.fecha);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleString("es-DO", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  }
  const d = new Date(`${e.fecha.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

const TONO = {
  red: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  blue: "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
} as const;

/**
 * «Atención prioritaria» como bandeja unificada: plazos (7 días y vencidos sin acusar), audiencias (7 días) y
 * revisiones abiertas, ordenados por urgencia y fecha, cada uno con su acción. Si una fuente falla o el rol no
 * puede verla, se dice en una línea y las demás siguen.
 */
export function PriorityInbox({ tenantId, casos }: { tenantId: string | undefined; casos: LegalCase[] }) {
  const plazos = useUpcomingDeadlines(tenantId, DIAS, false, true);
  const rango = useMemo(ventana, []);
  const audiencias = useHearingsList(tenantId, { ...rango, limit: 10 });
  const cola = useValidationQueue(tenantId);
  const [filtro, setFiltro] = useState<TipoPrioridad | "todo">("todo");

  const titulos = useMemo(() => new Map(casos.map((c) => [c.case_id, c.title])), [casos]);
  const tituloCaso = (id: string) => titulos.get(id) ?? null;

  const elementos = ordenarPrioridades([
    ...(plazos.data?.deadlines ?? []).map(desdePlazo),
    ...(audiencias.data?.hearings ?? []).map((h) => desdeAudiencia(h, tituloCaso)),
    ...(cola.forbidden || cola.error ? [] : cola.open).map((i) => desdeRevision(i, tituloCaso)),
  ]);
  const cuenta = (t: TipoPrioridad) => elementos.filter((e) => e.tipo === t).length;
  const visibles = (filtro === "todo" ? elementos : elementos.filter((e) => e.tipo === filtro)).slice(0, MAX_FILAS);
  const cargando = plazos.isLoading || audiencias.isLoading || cola.loading;

  const fallos = [plazos.error, audiencias.error, cola.error].filter(Boolean).length;
  const avisos: string[] = [];
  if (plazos.error) avisos.push("No se pudieron cargar los plazos: revísalos dentro de cada expediente.");
  if (audiencias.error) avisos.push("No se pudieron cargar las audiencias.");
  if (cola.forbidden) avisos.push("Las revisiones de documentos solo se muestran a abogados validadores.");
  else if (cola.error) avisos.push("No se pudo cargar la cola de revisión.");

  return (
    <section data-compacto="" id="atencion-prioritaria" aria-labelledby="legal-priority" className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
        <h2 id="legal-priority" className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-zinc-100">
          <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" aria-hidden />Atención prioritaria
        </h2>
        <div role="group" aria-label="Filtrar prioridades" className="flex flex-wrap gap-1">
          {(["todo", "plazo", "audiencia", "revision"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={filtro === t}
              onClick={() => setFiltro(t)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${filtro === t ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:text-zinc-300"}`}
            >
              {t === "todo" ? `Todo (${elementos.length})` : `${NOMBRE[t]} (${cuenta(t)})`}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-3">
        {cargando ? (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />)}</div>
        ) : visibles.length === 0 ? (
          <p className="py-2 text-sm text-slate-600 dark:text-zinc-400">
            {/* Si alguna fuente falló no se afirma «nada urgente»: solo se dice qué se pudo comprobar. */}
            {fallos > 0
              ? "No se puede confirmar que no haya nada urgente: alguna fuente no respondió (detalle abajo)."
              : filtro === "todo"
                ? "Nada urgente: no hay plazos, audiencias ni revisiones en los próximos 7 días."
                : `Sin ${NOMBRE[filtro].toLowerCase()} en los próximos 7 días.`}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {visibles.map((e) => {
              const Icono = e.urgente ? AlertTriangle : ICONO[e.tipo];
              const fecha = cuando(e);
              return (
                <li key={e.id} className="flex items-start gap-3 py-2.5" data-tipo={e.tipo}>
                  <Icono aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${e.urgente ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-zinc-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-900 dark:text-zinc-100">
                      <span className="font-semibold">{e.titulo}</span>
                      <span className="text-slate-600 dark:text-zinc-400">{" — "}{e.expediente}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400">
                      <span className="sr-only">{NOMBRE[e.tipo]}: </span>
                      {fecha ? <>{e.tipo === "revision" ? "Revisar antes del " : e.tipo === "audiencia" ? "" : e.urgente ? "Venció " : "Vence "}{fecha}</> : null}
                      {e.detalle ? <>{fecha ? " · " : ""}{e.detalle}</> : null}
                    </p>
                    {e.etiquetas.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.etiquetas.map((t) => <span key={t.texto} className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${TONO[t.tono]}`}>{t.texto}</span>)}
                      </div>
                    ) : null}
                  </div>
                  <Link
                    href={e.accion.href}
                    className="shrink-0 rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:text-blue-300"
                  >
                    {e.accion.label}<span className="sr-only"> — {e.expediente}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {!cargando && elementos.length > visibles.length && filtro === "todo" ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Y {elementos.length - visibles.length} más: usa los filtros o abre cada sección.</p>
        ) : null}
        {avisos.length ? <ul className="mt-2 space-y-0.5 text-xs text-amber-800 dark:text-amber-300">{avisos.map((a) => <li key={a}>{a}</li>)}</ul> : null}
        <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">Verifica el fundamento de cada plazo antes de actuar.</p>
      </div>
    </section>
  );
}
