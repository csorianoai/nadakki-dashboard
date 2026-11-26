"use client";

import Link from "next/link";
import type { FilaTrabajo } from "@/lib/legal/home/trabajo-expedientes";
import { rutaContinuar } from "@/lib/legal/home/trabajo-expedientes";

const ESTADOS: Record<string, string> = {
  EVALUACION_INICIAL: "Evaluación", INGESTION: "Ingreso", TRIAGE: "Clasificación",
  STRATEGY: "Estrategia", ACTIVE: "Activo", HEARING: "Audiencia",
  JUDGMENT: "Sentencia", APPEAL: "Apelación", EXECUTION: "Ejecución",
  CLOSED: "Cerrado", ARCHIVED: "Archivado",
};
const PRIORIDADES: Record<string, string> = { critical: "Crítica", high: "Alta", normal: "Normal", low: "Baja" };

const tonoPrioridad = (p: string) =>
  p === "critical" ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
  : p === "high" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300";

function fechaCorta(iso: string, utc = false): string {
  const d = utc ? new Date(`${iso.slice(0, 10)}T12:00:00Z`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-DO", { day: "numeric", month: "short", ...(utc ? { timeZone: "UTC" } : {}) });
}

function CeldaPlazo({ fila, disponible }: { fila: FilaTrabajo; disponible: boolean }) {
  if (!disponible) return <span className="text-slate-400 dark:text-zinc-500" title="No se pudieron cargar los plazos">—</span>;
  const p = fila.plazo;
  if (!p) return <span className="text-slate-500 dark:text-zinc-400">Sin plazos próximos</span>;
  const tono = p.vencido || p.perentorio ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-zinc-200";
  return (
    <span className="flex flex-col">
      <span className={`font-medium ${tono}`}>{p.vencido ? "Venció " : ""}{fechaCorta(p.fecha, true)}{p.perentorio ? " · perentorio" : ""}</span>
      <span className={`text-[11px] ${p.verificado ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
        {p.verificado ? "Regla verificada" : "Regla por verificar"}
      </span>
    </span>
  );
}

type Props = {
  filas: FilaTrabajo[];
  plazosDisponibles: boolean;
  revisionesDisponibles: boolean;
  /** Etiqueta accesible de la tabla. */
  titulo: string;
};

/**
 * Centro de trabajo de expedientes (Legal OS): estado, prioridad, próximo plazo verificado, trabajo pendiente
 * (cola de revisión) y «Continuar». Solo datos que dan las APIs; lo que no se sabe se muestra como «—».
 */
export function CaseWorkTable({ filas, plazosDisponibles, revisionesDisponibles, titulo }: Props) {
  return (
    <>
    {/* Móvil: tarjetas apiladas; plazo y «Continuar» siempre a la vista (la tabla obligaba a desplazar en horizontal). */}
    <ul data-compacto="" className="divide-y divide-slate-100 sm:hidden dark:divide-zinc-800" aria-label={titulo}>
      {filas.map((f) => {
        const c = f.caso;
        const pend = f.revisionesPendientes;
        return (
          <li key={c.case_id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/legal/cases/${encodeURIComponent(c.case_id)}`} className="line-clamp-2 text-sm font-semibold text-blue-800 hover:underline dark:text-blue-300">{c.title}</Link>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                  {c.case_number_internal || "Sin número interno"} · {ESTADOS[c.state] ?? c.state} · {PRIORIDADES[c.priority] ?? "—"}
                </p>
              </div>
              <Link href={rutaContinuar(f)} className="inline-flex min-h-[44px] shrink-0 items-center rounded-md border border-blue-200 px-3 text-xs font-semibold text-blue-800 dark:border-blue-800 dark:text-blue-300">
                Continuar<span className="sr-only"> con {c.title}</span>
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <CeldaPlazo fila={f} disponible={plazosDisponibles} />
              {revisionesDisponibles && pend ? <span className="font-medium text-amber-800 dark:text-amber-300">{pend === 1 ? "1 documento por revisar" : `${pend} documentos por revisar`}</span> : null}
            </div>
          </li>
        );
      })}
    </ul>
    <div data-compacto="" className="hidden sm:block">
      <table className="w-full table-fixed text-left text-[13px]" aria-label={titulo}>
        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th scope="col" className="w-auto px-4 py-2.5">Expediente</th>
            <th scope="col" className="hidden w-[7.5rem] px-3 py-2.5 sm:table-cell">Estado</th>
            <th scope="col" className="w-[6rem] px-3 py-2.5">Prioridad</th>
            <th scope="col" className="w-[8.5rem] px-3 py-2.5">Próximo plazo</th>
            <th scope="col" className="hidden w-[10rem] px-3 py-2.5 2xl:table-cell">Pendiente</th>
            <th scope="col" className="hidden w-[6.5rem] px-3 py-2.5 2xl:table-cell">Actualizado</th>
            <th scope="col" className="w-[7rem] px-4 py-2.5 text-right"><span className="sr-only">Acción</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {filas.map((f) => {
            const c = f.caso;
            const pend = f.revisionesPendientes;
            return (
              <tr key={c.case_id} className="hover:bg-[#f8fafc] dark:hover:bg-zinc-800">
                <td className="px-4 py-2.5">
                  <Link href={`/legal/cases/${encodeURIComponent(c.case_id)}`} className="block truncate font-semibold text-blue-800 hover:underline dark:text-blue-300">{c.title}</Link>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-zinc-400">{c.case_number_internal || "Sin número interno"}</span>
                </td>
                <td className="hidden truncate px-3 py-2.5 text-slate-700 dark:text-zinc-300 sm:table-cell">{ESTADOS[c.state] ?? c.state}</td>
                <td className="px-3 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${tonoPrioridad(c.priority)}`}>{PRIORIDADES[c.priority] ?? "—"}</span></td>
                <td className="whitespace-nowrap px-3 py-2.5"><CeldaPlazo fila={f} disponible={plazosDisponibles} /></td>
                <td className="hidden truncate px-3 py-2.5 text-slate-700 dark:text-zinc-300 2xl:table-cell">
                  {!revisionesDisponibles || pend === null ? <span className="text-slate-400 dark:text-zinc-500" title="Solo visible con rol de abogado">—</span>
                    : pend === 0 ? <span className="text-slate-500 dark:text-zinc-400">Nada en revisión</span>
                    : <span className="font-medium text-amber-800 dark:text-amber-300">{pend === 1 ? "1 documento por revisar" : `${pend} documentos por revisar`}</span>}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2.5 text-slate-500 dark:text-zinc-400 2xl:table-cell">{fechaCorta(c.updated_at)}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={rutaContinuar(f)} className="inline-flex items-center rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40">
                    Continuar<span className="sr-only"> con {c.title}</span>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
