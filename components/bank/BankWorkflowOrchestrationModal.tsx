"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkflowStipulationsList } from "@/components/bank/WorkflowStipulationsList";
import {
  WORKFLOW_STIPULATION_TEMPLATES,
  type WorkflowStipulationTemplate,
} from "@/lib/bank/stipulations/workflow-templates";
import { useBankStipulationsWorkflow } from "@/hooks/useBankStipulationsWorkflow";
import type { BankWorkflowStipulation } from "@/lib/bank/stipulations/workflow-types";
import type { BankApplicationStipulation } from "@/lib/bank-application-detail/types";
import { cn } from "@/lib/utils";

export interface BankWorkflowOrchestrationModalProps {
  applicationId: string;
  tenantId: string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  stipulationSeeds?: BankApplicationStipulation[] | undefined;
}

export function BankWorkflowOrchestrationModal({
  applicationId,
  tenantId,
  isOpen,
  onClose,
  stipulationSeeds,
}: BankWorkflowOrchestrationModalProps) {
  const workflow = useBankStipulationsWorkflow({
    applicationId,
    tenantId: tenantId ?? undefined,
    enabled: isOpen,
    detailSeeds: stipulationSeeds,
  });

  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState("");
  const [assignment, setAssignment] = useState<BankWorkflowStipulation["assigned_to"]>("dealer");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string>("");

  const titleId = useMemo(() => "bank-wf-orchestration-title", []);
  const descId = useMemo(() => "bank-wf-orchestration-desc", []);

  useEffect(() => {
    if (!isOpen) {
      setBulkSelectedIds([]);
      setCustomDescription("");
      setDeadlineLocal("");
      setFormError(null);
      setActionBanner("");
    }
  }, [isOpen]);

  const closeInternal = useCallback(() => {
    setActionBanner("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeInternal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeInternal, isOpen]);

  useEffect(() => {
    if (workflow.liveRegionMessage.trim()) setActionBanner(workflow.liveRegionMessage);
  }, [workflow.liveRegionMessage]);

  const toggleBulk = useCallback((id: string) => {
    setBulkSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const bulkMarkSentSelection = useCallback(() => {
    const setIds = new Set(bulkSelectedIds);
    workflow.items.forEach((row) => {
      if (!setIds.has(row.id)) return;
      if (row.status === "completed" || row.status === "rejected") return;
      workflow.updateRow({ ...row, status: "sent", updated_at: new Date().toISOString() });
    });
    setBulkSelectedIds([]);
    setActionBanner("Selección marcada como enviada para las filas elegibles.");
  }, [bulkSelectedIds, workflow]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-3 py-6 sm:px-4",
        "supports-[backdrop-filter]:backdrop-blur-[2px]",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-testid="bank-workflow-orchestration"
    >
      <div className="max-h-[min(920px,_92vh)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-forgeGray-200 bg-white p-5 shadow-2xl dark:border-forgeGray-800 dark:bg-forgeGray-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold text-forgeGray-950 dark:text-forgeGray-50">
              Orquestación de estipulaciones
            </h2>
            <p id={descId} className="mt-2 text-sm text-forgeGray-700 dark:text-forgeGray-300">
              Vista operativa: priorización masiva, estados tácticos y reintento de notificación Agent-2. Persistencia
              local aislada por tenant.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={closeInternal}
            aria-label="Cerrar orquestador de estipulaciones"
            data-testid="bank-workflow-orchestration-close"
          >
            Cerrar
          </Button>
        </div>

        {actionBanner ? (
          <div
            role="status"
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
          >
            {actionBanner}
          </div>
        ) : null}

        {workflow.hasOfflineQueuedChanges ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Offline: overlays pendientes hasta reconectar — reintenta notificación al concesionario después.
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <p className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-600">Plantillas rápidas</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW_STIPULATION_TEMPLATES.map((tpl: WorkflowStipulationTemplate) => (
              <Button
                key={tpl.id}
                type="button"
                variant="outline"
                className="min-h-[3rem] whitespace-normal px-3 py-2 text-left text-sm leading-snug"
                data-testid={`bank-workflow-tpl-${tpl.id}`}
                onClick={() => workflow.addFromTemplate(tpl, assignment)}
              >
                {tpl.label}
              </Button>
            ))}
          </div>
        </div>

        <section className="mt-8 space-y-3 rounded-xl border border-forgeGray-200 bg-forgeGray-50/70 p-4 dark:border-forgeGray-800">
          <h3 className="text-sm font-semibold text-forgeGray-900 dark:text-forgeGray-50">Manual / deadline</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase text-forgeGray-600 dark:text-forgeGray-400">
                Descripción
              </span>
              <textarea
                rows={3}
                data-testid="bank-workflow-orchestration-desc"
                className="mt-2 w-full rounded-lg border border-forgeGray-300 bg-white p-3 text-sm dark:border-forgeGray-700 dark:bg-forgeGray-950"
                value={customDescription}
                onChange={(e) => {
                  setFormError(null);
                  setCustomDescription(e.target.value);
                }}
              />
            </label>
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-xs font-semibold uppercase text-forgeGray-600 dark:text-forgeGray-400">
                  Asignación
                </span>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant={assignment === "dealer" ? "default" : "outline"}
                    onClick={() => setAssignment("dealer")}
                    aria-pressed={assignment === "dealer"}
                  >
                    Dealer
                  </Button>
                  <Button
                    type="button"
                    variant={assignment === "customer" ? "default" : "outline"}
                    onClick={() => setAssignment("customer")}
                    aria-pressed={assignment === "customer"}
                  >
                    Cliente
                  </Button>
                </div>
              </div>
              <label className="text-xs font-semibold text-forgeGray-700 dark:text-forgeGray-300">
                Fecha objetivo opcional (ISO local)
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-lg border border-forgeGray-300 bg-white p-3 text-xs dark:border-forgeGray-700 dark:bg-forgeGray-950"
                  value={deadlineLocal}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => {
                    setDeadlineLocal(e.target.value);
                  }}
                  data-testid="bank-workflow-orchestration-deadline"
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="bank-workflow-orchestration-add-custom"
              onClick={() => {
                const err = workflow.addCustomStipulation({
                  description: customDescription,
                  assigned_to: assignment,
                  deadline: deadlineLocal.trim() ? new Date(deadlineLocal).toISOString() : undefined,
                });
                if (err) {
                  setFormError(err);
                  return;
                }
                setFormError(null);
                setCustomDescription("");
                setDeadlineLocal("");
                setActionBanner("Entrada manual añadida al overlay local.");
              }}
            >
              Agregar entrada
            </Button>
            <Button type="button" variant="outline" disabled={workflow.isLoading} onClick={() => void workflow.refresh()}>
              Actualizar desde créditos
            </Button>
          </div>
          {formError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {formError}
            </p>
          ) : null}
        </section>

        <section className="mt-6 space-y-3 rounded-xl border border-forgeGray-200 p-4 dark:border-forgeGray-800">
          <h3 className="text-sm font-semibold">Acciones masivas</h3>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={workflow.bulkMarkAllSent} data-testid="bank-workflow-bulk-sent">
              Marcar todas como enviadas
            </Button>
            <Button type="button" variant="outline" onClick={workflow.bulkResetToPending}>
              Reiniciar pendientes aplicables
            </Button>
            <Button type="button" variant="outline" disabled={bulkSelectedIds.length === 0} onClick={bulkMarkSentSelection}>
              Marcar selección enviadas
            </Button>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-forgeGray-600">Lista viva operativa</h3>
          <WorkflowStipulationsList
            applicationId={applicationId}
            stipulations={workflow.items}
            selectable
            selectedIds={bulkSelectedIds}
            onToggleSelect={toggleBulk}
            onUpdate={(s) => {
              void workflow.updateRow(s);
            }}
          />
        </section>

        <div className="mt-10 flex flex-col gap-3 border-t border-forgeGray-200 pt-4 sm:flex-row sm:justify-end dark:border-forgeGray-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              workflow.persistLocalSnapshot();
              setActionBanner("Snapshot local persistido (sessionStorage tenant-safe).");
            }}
          >
            Guardar borrador local
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void (async () => {
                const r = await workflow.sendToDealer();
                if (r.ok === false) {
                  if ("unsupported" in r && r.unsupported) {
                    setActionBanner("Servicio Agent-2 sin endpoint aún — sólo auditoría cliente.");
                  } else if (r.reason === "no_application") {
                    setActionBanner("Sin expediente válido.");
                  } else {
                    setActionBanner("Falló notifyDealer.");
                  }
                  return;
                }
                setActionBanner("Notificación ejecutada; estados de envío actualizados.");
              })()
            }
            data-testid="bank-workflow-send-dealer"
          >
            Enviar todo al concesionario
          </Button>
          <Button type="button" variant="default" onClick={closeInternal}>
            Terminar revisión
          </Button>
        </div>
      </div>
    </div>
  );
}
