"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Modal } from "@/components/forge";
import { getProyecto, ProyectosApiError, updateProyecto } from "@/app/hooks/useProyectos";
import {
  buildProyectoPatchPayload,
  proyectoRawToForm,
  validateProyectoEditForm,
  type ProyectoEditFormValues,
} from "@/components/proyectos/proyecto-edit-helpers";
import { useModalBackdrop } from "@/components/proyectos/useModalBackdrop";

function formatUsdHelp(raw: string): string {
  const n = Number(raw.replace(/,/g, "").replace(/\s+/g, ""));
  if (!raw.trim() || Number.isNaN(n)) return "";
  try {
    return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return "";
  }
}

function parseUsdInput(raw: string): number {
  const n = Number(raw.replace(/,/g, "").replace(/\s+/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function apiErrorMessage(err: unknown): string {
  if (err instanceof ProyectosApiError) {
    if (err.body && typeof err.body === "object" && "detail" in (err.body as object)) {
      const detail = (err.body as Record<string, unknown>).detail;
      if (typeof detail === "string") return detail;
      if (detail) return JSON.stringify(detail);
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Error desconocido";
}

interface ProyectoEditModalProps {
  open: boolean;
  tenantId: string;
  proyectoId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ProyectoEditModal({
  open,
  tenantId,
  proyectoId,
  onClose,
  onSaved,
}: ProyectoEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProyectoEditFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { overlay, handleClose } = useModalBackdrop(open, onClose, saving);

  useEffect(() => {
    if (!open || !tenantId || !proyectoId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      setValidationError(null);
      try {
        const raw = await getProyecto(tenantId, proyectoId);
        if (cancelled) return;
        if (!raw) {
          setLoadError("No se pudo cargar el proyecto.");
          setForm(null);
          return;
        }
        const values = proyectoRawToForm(raw);
        setForm(values);
      } catch (err) {
        if (!cancelled) setLoadError(apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, tenantId, proyectoId]);

  const budgetPreviews = useMemo(() => {
    if (!form) return { envelope: "", capex: "", opex: "" };
    return {
      envelope: formatUsdHelp(String(form.budget_envelope_usd)),
      capex: formatUsdHelp(String(form.budget_capex_usd)),
      opex: formatUsdHelp(String(form.budget_opex_usd)),
    };
  }, [form]);

  const patchField = useCallback(<K extends keyof ProyectoEditFormValues>(key: K, value: ProyectoEditFormValues[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setValidationError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form || !tenantId) return;

    const validation = validateProyectoEditForm(form);
    if (validation) {
      setValidationError(validation);
      return;
    }

    const updates = buildProyectoPatchPayload(form);

    setSaving(true);
    setValidationError(null);
    try {
      await updateProyecto(tenantId, proyectoId, updates);
      toast.success("Proyecto actualizado");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("No se pudo guardar", { description: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }, [form, onClose, onSaved, proyectoId, tenantId]);

  return (
    <>
      {overlay}
      <Modal
        open={open}
        onClose={handleClose}
        closeOnBackdropClick={false}
        className="!z-50 backdrop:bg-transparent"
        title="Editar proyecto"
        description="Actualiza los campos del proyecto. Los valores del formulario se envían al servidor al guardar."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={saving || loading || !form || !!loadError}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Guardando…
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Cargando datos del proyecto…
          </div>
        ) : loadError ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{loadError}</p>
        ) : form ? (
          <div className="space-y-4">
            {validationError ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {validationError}
              </p>
            ) : null}

            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(e) => patchField("nombre", e.target.value)}
              placeholder="Nombre del proyecto"
              disabled={saving}
              required
            />

            <Input
              label="Código interno (opcional)"
              value={form.codigo_interno}
              onChange={(e) => patchField("codigo_interno", e.target.value)}
              placeholder="ej. ZANJAS-2026"
              disabled={saving}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Input
                  label="Presupuesto total (USD)"
                  value={String(form.budget_envelope_usd || "")}
                  onChange={(e) => patchField("budget_envelope_usd", parseUsdInput(e.target.value))}
                  inputMode="decimal"
                  placeholder="0"
                  disabled={saving}
                />
                {budgetPreviews.envelope ? (
                  <p className="mt-1 text-xs text-zinc-500">{budgetPreviews.envelope}</p>
                ) : null}
              </div>
              <div>
                <Input
                  label="CAPEX (USD)"
                  value={String(form.budget_capex_usd || "")}
                  onChange={(e) => patchField("budget_capex_usd", parseUsdInput(e.target.value))}
                  inputMode="decimal"
                  placeholder="0"
                  disabled={saving}
                />
                {budgetPreviews.capex ? (
                  <p className="mt-1 text-xs text-zinc-500">{budgetPreviews.capex}</p>
                ) : null}
              </div>
              <div>
                <Input
                  label="OPEX (USD)"
                  value={String(form.budget_opex_usd || "")}
                  onChange={(e) => patchField("budget_opex_usd", parseUsdInput(e.target.value))}
                  inputMode="decimal"
                  placeholder="0"
                  disabled={saving}
                />
                {budgetPreviews.opex ? (
                  <p className="mt-1 text-xs text-zinc-500">{budgetPreviews.opex}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Fecha inicio target"
                type="date"
                value={form.fecha_inicio_target}
                onChange={(e) => patchField("fecha_inicio_target", e.target.value)}
                disabled={saving}
              />
              <Input
                label="Fecha fin target"
                type="date"
                value={form.fecha_fin_target}
                onChange={(e) => patchField("fecha_fin_target", e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
