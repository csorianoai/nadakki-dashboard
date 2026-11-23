"use client";

import Link from "next/link";
import { useState } from "react";
import type { CaseDeadline } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";
import { CaseDeadlineOverrideModal } from "@/components/legal/cases/CaseDeadlineOverrideModal";

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
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-forgeGray-900">{m.deadlines.title}</h2>
      <ul className="space-y-3">
        {(deadlines ?? []).map((d) => {
          const days = daysUntil(d.effective_deadline_date);
          return (
            <li
              key={d.deadline_id}
              className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {/* Nombre del acto (no el código interno del catálogo), fecha legible y si es perentorio. */}
                  <p className="font-medium text-forgeGray-900">
                    {d.deadline_category || d.deadline_db_id}
                    {d.is_peremptory ? <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-800">Perentorio</span> : null}
                  </p>
                  <p className="text-xs text-forgeGray-600">{d.legal_basis}</p>
                  <p className={`mt-1 text-xs font-medium ${days < 0 ? "text-forgeDanger-700" : days <= 3 ? "text-red-700" : "text-forgeGray-700"}`}>
                    Vence {fechaLarga(d.effective_deadline_date)} · {restantes(days, m.deadlines.expired)}
                  </p>
                  <p className="text-xs text-forgeGray-500">
                    {d.has_human_override ? m.deadlines.human_override : m.deadlines.auto_calculated}
                  </p>
                </div>
                {/* Próxima acción: preparar el escrito o revisar la estrategia; corregir el plazo queda como secundaria.
                    (Las tareas de IA aún no reciben el expediente como contexto: el abogado lo indica en la tarea.) */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/legal/asistente" className="rounded-forge-sm bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-800">
                    Preparar escrito con IA
                  </Link>
                  <Link href={`/legal/cases/${encodeURIComponent(caseId)}/strategy`} className="rounded-forge-sm border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50">
                    Ver estrategia
                  </Link>
                <button
                  type="button"
                  className="rounded-forge-sm border border-forgeGray-200 bg-white px-2.5 py-1 text-xs font-medium text-forgeGray-700 hover:bg-forgeGray-50"
                  onClick={() => setTarget(d)}
                >
                  {m.deadlines.override}
                </button>
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
