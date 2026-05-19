"use client";

import type { KeyboardEventHandler } from "react";
import { cn } from "@/lib/utils";
import type { BankWorkflowStipulation } from "@/lib/bank/stipulations/workflow-types";

export interface WorkflowStipulationListCallbacks {
  onUpdate: (s: BankWorkflowStipulation) => void | { scrollIntoView?: false };
}

export interface WorkflowStipulationListExtras {
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

/**
 * Lista viva Agent-4 (T6.3) sin colisionar con `components/bank/StipulationsList.tsx`, que sirve la cola Credit API.
 */
export interface WorkflowStipulationsListProps extends WorkflowStipulationListCallbacks, WorkflowStipulationListExtras {
  applicationId: string;
  stipulations: BankWorkflowStipulation[];
}

const STATUS_LABEL_ES: Record<BankWorkflowStipulation["status"], string> = {
  pending: "Pendiente",
  sent: "Enviado",
  in_progress: "En curso",
  completed: "Completado",
  rejected: "Rechazado",
};

function isoToLocal(dt?: string): string {
  if (!dt?.trim()) return "—";
  const t = Date.parse(dt);
  if (!Number.isFinite(t)) return dt;
  return new Date(t).toLocaleString("es-LA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StipulationRow({
  stipulation,
  onUpdate,
  selectable,
  selected,
  onToggleSelect,
}: {
  stipulation: BankWorkflowStipulation;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
} & Pick<WorkflowStipulationListCallbacks, "onUpdate">) {
  const onKeyRow: KeyboardEventHandler = (evt) => {
    if ((evt.target as HTMLElement).tagName === "SELECT") return;
    if (evt.key === "ArrowDown" || evt.key === "ArrowUp") evt.preventDefault();
  };

  return (
    <article
      className={cn(
        "rounded-xl border px-4 py-3 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-forgeGray-900",
        "border-forgeGray-200 bg-forgeGray-50/80 text-forgeGray-950",
      )}
      aria-label={`Estipulación ${stipulation.description}`}
      tabIndex={0}
      data-testid="workflow-stipulation-row"
      onKeyDown={onKeyRow}
    >
      <div className="flex flex-wrap items-start gap-3">
        {selectable ? (
          <input
            type="checkbox"
            className="mt-1 size-5 accent-forgeGray-950"
            checked={selected}
            aria-describedby={`workflow-stip-meta-${stipulation.id}`}
            aria-label={`Seleccionar estipulación ${stipulation.description}`}
            onChange={() => onToggleSelect?.(stipulation.id)}
          />
        ) : null}
        <div className="min-w-[200px] flex-1 space-y-1">
          <p className="text-forge-sm font-semibold leading-snug text-forgeGray-950">{stipulation.description}</p>
          <p id={`workflow-stip-meta-${stipulation.id}`} className="text-forge-xs text-forgeGray-700">
            Asignada a: <span className="font-medium capitalize">{stipulation.assigned_to}</span> · Vigencia:{" "}
            <span className="font-mono">{stipulation.deadline ? stipulation.deadline.slice(0, 10) : "—"}</span>
          </p>
          <dl className="grid gap-1 text-forge-xs text-forgeGray-800 sm:grid-cols-2">
            <div>
              <dt className="uppercase tracking-wide text-forgeGray-600">Actualizado</dt>
              <dd className="font-mono">{isoToLocal(stipulation.updated_at)}</dd>
            </div>
          </dl>
        </div>
        <label className="flex flex-col gap-1 text-forge-xs text-forgeGray-800">
          Estado
          <select
            className="rounded-md border border-forgeGray-300 bg-white px-2 py-2 text-forge-sm text-forgeGray-950"
            value={stipulation.status}
            aria-label={`Estado para ${stipulation.description}`}
            onChange={(e) => {
              const status = e.target.value as BankWorkflowStipulation["status"];
              if (status === stipulation.status) return;
              onUpdate({ ...stipulation, status, updated_at: new Date().toISOString() });
            }}
          >
            {(Object.keys(STATUS_LABEL_ES) as BankWorkflowStipulation["status"][]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL_ES[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {stipulation.documents_uploaded.length ? (
        <div className="mt-3 space-y-1 border-t border-forgeGray-200 pt-3 text-forge-xs">
          <p className="font-semibold text-forgeGray-900">Documentos</p>
          <ul className="space-y-1">
            {stipulation.documents_uploaded.map((doc) => (
              <li key={doc}>
                <span className="break-all font-mono text-forgeGray-800">{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function WorkflowStipulationsList(props: WorkflowStipulationsListProps) {
  const { stipulations, applicationId, onUpdate, selectable, selectedIds, onToggleSelect } = props;
  void applicationId;

  const selectedSet = selectable && selectedIds ? new Set(selectedIds) : undefined;

  return (
    <div
      role="list"
      aria-label="Lista de estipulaciones"
      data-testid="workflow-stipulation-list-root"
      className="space-y-3"
    >
      {stipulations.map((s) => (
        <div key={s.id} role="listitem">
          <StipulationRow
            stipulation={s}
            onUpdate={onUpdate}
            selectable={selectable}
            selected={selectedSet?.has(s.id)}
            onToggleSelect={onToggleSelect}
          />
        </div>
      ))}
    </div>
  );
}
