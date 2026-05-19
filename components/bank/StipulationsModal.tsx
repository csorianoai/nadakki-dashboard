"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { StipulationCreatePayload } from "@/lib/api/stipulations-types";
import {
  WORKFLOW_STIPULATION_TEMPLATES,
  type WorkflowStipulationTemplate,
} from "@/lib/bank/stipulations/workflow-templates";
import { cn } from "@/lib/utils";

export interface StipulationsModalProps {
  applicationId: string;
  dealerId: string;
  tenantId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: StipulationCreatePayload) => Promise<void>;
}

function hoursUntilDeadline(deadlineIsoLocal: string): number {
  const t = new Date(deadlineIsoLocal).getTime();
  const delta = t - Date.now();
  return Math.max(1, Math.ceil(delta / 3_600_000));
}

function LiveRegion({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

/**
 * StipulationsModal — add and template-pick stipulations with bank workflow polish.
 */
export function StipulationsModal({
  applicationId,
  dealerId,
  tenantId: _tenantId,
  isOpen,
  onClose,
  onSave,
}: StipulationsModalProps) {
  const titleId = useId();
  const descId = useId();

  const [assignment, setAssignment] = useState<"dealer" | "customer">("dealer");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [announce, setAnnounce] = useState("");
  const [pending, setPending] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<StipulationCreatePayload[]>([]);

  const selectedTemplate = useMemo(
    () => WORKFLOW_STIPULATION_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? null,
    [selectedTemplateId],
  );

  useEffect(() => {
    if (!isOpen) return;
    setAnnounce("Diálogo de estipulaciones abierto.");
    const t = window.setTimeout(() => setAnnounce(""), 400);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setAssignment("dealer");
    setSelectedTemplateId(null);
    setCustomDescription("");
    setDeadlineLocal("");
  }, []);

  const close = useCallback(() => {
    if (pending) return;
    resetForm();
    onClose();
  }, [onClose, pending, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, isOpen]);

  const buildPayload = useCallback((): StipulationCreatePayload | null => {
    const d = dealerId.trim();
    if (!d) return null;

    const templateDesc =
      selectedTemplate?.defaultDescription?.trim() ||
      (selectedTemplate?.label ? `Template: ${selectedTemplate.label}` : "");
    const custom = customDescription.trim();
    const descParts = [
      templateDesc || undefined,
      custom || undefined,
      assignment === "customer" ? "[Asignación: cliente]" : "[Asignación: concesionario]",
    ].filter(Boolean);
    const description = descParts.join(" · ") || undefined;
    const type = selectedTemplate?.backendType ?? "other";
    const sla_hours = deadlineLocal.trim() ? hoursUntilDeadline(deadlineLocal) : undefined;

    return {
      type,
      dealer_id: d,
      description,
      sla_hours,
    };
  }, [assignment, customDescription, deadlineLocal, dealerId, selectedTemplate]);

  const submit = useCallback(async () => {
    const payload = buildPayload();
    if (!payload) return;
    if (!navigator.onLine) {
      setOfflineQueue((q) => [...q, payload]);
      setAnnounce("Sin conexión: solicitud en cola pendiente de sincronización.");
      return;
    }
    setPending(true);
    try {
      await onSave(payload);
      setAnnounce("Estipulación guardada correctamente.");
      resetForm();
      onClose();
    } finally {
      setPending(false);
    }
  }, [buildPayload, onClose, onSave, resetForm]);

  const flushOffline = useCallback(async () => {
    if (!navigator.onLine || offlineQueue.length === 0) return;
    const queued = [...offlineQueue];
    setOfflineQueue([]);
    setPending(true);
    try {
      for (const p of queued) {
        await onSave(p);
      }
      setAnnounce("Cola sin conexión enviada correctamente.");
    } finally {
      setPending(false);
    }
  }, [offlineQueue, onSave]);

  useEffect(() => {
    if (!navigator.onLine) return;
    void flushOffline();
  }, [flushOffline]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-testid="stipulations-modal"
    >
      <LiveRegion message={announce} />
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-forgeGray-200 bg-forgeWhite p-6 shadow-2xl dark:border-forgeGray-800 dark:bg-forgeGray-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold">
              Nueva estipulación
            </h2>
            <p id={descId} className="mt-1 text-sm text-forgeGray-600 dark:text-forgeGray-400">
              Solicitud <span className="font-mono">{applicationId}</span> · Define el tipo, la descripción y la
              fecha límite. Se notificará al dealer conforme al contrato.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            aria-label="Cerrar diálogo de estipulaciones"
            data-testid="stip-workflow-close"
          >
            Cerrar
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
              Plantillas frecuentes
            </p>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-forgeGray-200 p-2 dark:border-forgeGray-800">
              {WORKFLOW_STIPULATION_TEMPLATES.map((tpl: WorkflowStipulationTemplate) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-forgeGray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forgeGray-900 dark:hover:bg-forgeGray-900/60 dark:focus-visible:ring-forgeGray-300",
                    selectedTemplateId === tpl.id && "bg-forgeGray-100 dark:bg-forgeGray-900",
                  )}
                  aria-pressed={selectedTemplateId === tpl.id}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
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
            <div>
              <label htmlFor="custom-desc" className="text-forge-xs font-semibold text-forgeGray-500">
                Descripción adicional (opcional)
              </label>
              <textarea
                id="custom-desc"
                className="mt-1 w-full rounded-md border border-forgeGray-300 bg-white p-2 text-sm text-forgeGray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forgeGray-900 dark:border-forgeGray-700 dark:bg-forgeGray-950 dark:text-forgeGray-50 dark:focus-visible:ring-forgeGray-300"
                rows={3}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="deadline" className="text-forge-xs font-semibold text-forgeGray-500">
                Fecha límite (opcional)
              </label>
              <input
                id="deadline"
                type="datetime-local"
                className="mt-1 w-full rounded-md border border-forgeGray-300 bg-white p-2 text-sm dark:border-forgeGray-700 dark:bg-forgeGray-950"
                value={deadlineLocal}
                onChange={(e) => setDeadlineLocal(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                data-testid="stip-workflow-deadline"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-forgeGray-200 pt-4 dark:border-forgeGray-800">
          <p className="text-forge-xs text-forgeGray-600">
            Tipo backend: <span className="font-mono">{selectedTemplate?.backendType ?? "other"}</span>
            {offlineQueue.length > 0 ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-50">
                Cola: {offlineQueue.length}
              </span>
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={pending} data-testid="stip-workflow-clear">
              Limpiar
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={pending || !dealerId.trim()}
              aria-busy={pending}
              data-testid="stip-workflow-save"
            >
              {pending ? "Guardando…" : "Guardar estipulación"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
