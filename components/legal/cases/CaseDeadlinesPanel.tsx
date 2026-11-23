"use client";

import Link from "next/link";
import { useState } from "react";
import type { CaseDeadline } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";
import { CaseDeadlineOverrideModal } from "@/components/legal/cases/CaseDeadlineOverrideModal";
import { postCaseAction } from "@/lib/legal/cases/legal-cases-api";

/** Actos del catálogo con su ortografía (QA ronda 2: salía «Apelacion»). */
const ACTOS: Record<string, string> = {
  apelacion: "apelación", casacion: "casación", oposicion: "oposición", prescripcion: "prescripción",
  investigacion: "investigación", detencion: "detención", reconsideracion: "reconsideración",
  declaracion: "declaración", adopcion: "adopción", revision: "revisión", reestructuracion: "reestructuración",
};

/** Nombre del plazo: el que escribió el abogado (tribunal) o el acto del catálogo. */
export function nombreDelPlazo(d: CaseDeadline): string {
  if (d.deadline_category === "TRIBUNAL") return d.notes || d.deadline_sub_category || "Plazo fijado por el tribunal";
  const acto = (d.deadline_sub_category || d.deadline_category || d.deadline_db_id).toLowerCase();
  const conTilde = ACTOS[acto] ?? acto.replace(/_/g, " ");
  return conTilde.charAt(0).toUpperCase() + conTilde.slice(1);
}

function fechaLarga(iso: string): string {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function restantes(days: number, vencido: string): string {
  if (days < 0) return vencido;
  if (days === 0) return "vence hoy";
  return days === 1 ? "1 día restante" : `${days} días restantes`;
}

export function CaseDeadlinesPanel({
  deadlines,
  caseId,
  tenantId,
  onOverridden,
}: {
  deadlines: CaseDeadline[];
  caseId: string;
  tenantId: string;
  onOverridden?: () => void;
}) {
  const m = useLegalCasesMessages();
  const [target, setTarget] = useState<CaseDeadline | null>(null);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [errorCumplido, setErrorCumplido] = useState<string | null>(null);
  const marcarCumplido = async (d: CaseDeadline) => {
    setErrorCumplido(null);
    setMarcando(d.deadline_id);
    try {
      await postCaseAction(tenantId, caseId, "complete_deadline", { deadline_id: d.deadline_id });
      onOverridden?.();
    } catch {
      setErrorCumplido("No se pudo marcar como cumplido. No se guardó nada.");
    } finally {
      setMarcando(null);
    }
  };
  const lista = deadlines ?? [];
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-forgeGray-900">{m.deadlines.title}</h2>
      {lista.length === 0 ? (
        <p className="rounded-forge-md border border-dashed border-slate-300 p-3 text-sm text-slate-600">
          Este expediente aún no tiene plazos. Agrégalos abajo con la fecha real del hecho que los inicia.
        </p>
      ) : null}
      {errorCumplido ? <p role="alert" className="mb-2 text-xs text-red-700">{errorCumplido}</p> : null}
      <ul data-compacto="" className="space-y-3">
        {lista.map((d) => {
          const days = daysUntil(d.effective_deadline_date);
          const cumplido = d.status === "completed";
          return (
            <li
              key={d.deadline_id}
              className={`rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-3 text-sm ${cumplido ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {/* Nombre del acto (no el código interno del catálogo), fecha legible y si es perentorio. */}
                  <p className="font-medium text-forgeGray-900">
                    {nombreDelPlazo(d)}
                    {d.is_peremptory && !cumplido ? <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-800">Perentorio</span> : null}
                    {cumplido ? <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">Cumplido</span> : null}
                  </p>
                  <p className="text-xs text-forgeGray-600">{d.legal_basis}</p>
                  {d.trigger_date ? (
                    <p className="text-xs text-forgeGray-500">Corre desde {fechaLarga(d.trigger_date)}</p>
                  ) : null}
                  <p className={`mt-1 text-xs font-medium ${cumplido ? "text-forgeGray-600" : days < 0 ? "text-forgeDanger-700" : days <= 3 ? "text-red-700" : "text-forgeGray-700"}`}>
                    Vence {fechaLarga(d.effective_deadline_date)}{cumplido ? "" : ` · ${restantes(days, m.deadlines.expired)}`}
                  </p>
                  <p className="text-xs text-forgeGray-500">
                    {d.has_human_override
                      ? m.deadlines.human_override
                      : d.deadline_category === "TRIBUNAL"
                        ? "Fijado por el tribunal"
                        : m.deadlines.auto_calculated}
                  </p>
                </div>
                {/* Próxima acción: preparar el escrito o revisar la estrategia; corregir el plazo queda como secundaria.
                    (Las tareas de IA aún no reciben el expediente como contexto: el abogado lo indica en la tarea.) */}
                <div className="flex flex-wrap items-center gap-2">
                  {!cumplido ? (<>
                  <Link
                    href="/legal/asistente"
                    aria-describedby={`ia-sin-contexto-${d.deadline_id}`}
                    className="rounded-forge-sm bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                  >
                    Preparar escrito con IA
                  </Link>
                  <Link href={`/legal/cases/${encodeURIComponent(caseId)}/strategy`} className="rounded-forge-sm border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50">
                    Ver estrategia
                  </Link>
                  </>) : null}
                {!cumplido ? (
                  <button
                    type="button"
                    disabled={marcando === d.deadline_id}
                    className="rounded-forge-sm border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                    onClick={() => void marcarCumplido(d)}
                  >
                    {marcando === d.deadline_id ? "Guardando…" : "Marcar cumplido"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-forge-sm border border-forgeGray-200 bg-white px-2.5 py-1 text-xs font-medium text-forgeGray-700 hover:bg-forgeGray-50"
                  onClick={() => setTarget(d)}
                >
                  {m.deadlines.override}
                </button>
                {!cumplido ? (
                  <p id={`ia-sin-contexto-${d.deadline_id}`} className="w-full text-[11px] text-slate-500 sm:text-right">
                    El asistente no recibe este expediente: indica tú los datos del caso en la tarea.
                  </p>
                ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {target ? (
        <CaseDeadlineOverrideModal
          deadline={target}
          caseId={caseId}
          tenantId={tenantId}
          onClose={() => setTarget(null)}
          onSuccess={() => {
            setTarget(null);
            onOverridden?.();
          }}
        />
      ) : null}
    </div>
  );
}
