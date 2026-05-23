"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Tabs, Textarea, toast } from "@/components/forge";
import { useCreateProyecto } from "@/hooks/projects/useProyectos";
import { ProjectsApiError } from "@/lib/projects/projectsClient";
import {
  METHODOLOGY_LABELS_ES,
  METHODOLOGY_PACK_IDS,
  PROJECT_TYPE_CODES,
  PROJECT_TYPE_LABELS_ES,
  type CreateProyectoPayload,
  type MethodologyPackId,
  type ProjectTypeCode,
} from "@/lib/projects/types";

const STEPS = [
  { id: "basic", label: "1 · Datos" },
  { id: "methodology", label: "2 · Metodología" },
  { id: "budget", label: "3 · Presupuesto" },
  { id: "review", label: "4 · Revisión" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface DraftForm {
  name: string;
  project_type: ProjectTypeCode | "";
  methodology_pack: MethodologyPackId | "";
  preliminary_budget_minor_units: string;
  budget_currency: string;
  description: string;
}

const EMPTY: DraftForm = {
  name: "",
  project_type: "",
  methodology_pack: "",
  preliminary_budget_minor_units: "",
  budget_currency: "MXN",
  description: "",
};

const projectTypeOptions = [
  { value: "", label: "Seleccionar tipo de proyecto…", disabled: true },
  ...PROJECT_TYPE_CODES.map((code) => ({
    value: code,
    label: PROJECT_TYPE_LABELS_ES[code],
  })),
];

const methodologyOptions = [
  { value: "", label: "Seleccionar paquete…", disabled: true },
  ...METHODOLOGY_PACK_IDS.map((id) => ({
    value: id,
    label: METHODOLOGY_LABELS_ES[id],
  })),
];

const currencyOptions = [
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
  { value: "DOP", label: "DOP" },
  { value: "EUR", label: "EUR" },
];

function validateDraft(d: DraftForm): Partial<Record<keyof DraftForm | "budget", string>> {
  const e: Partial<Record<keyof DraftForm | "budget", string>> = {};
  if (!d.name.trim()) e.name = "Nombre del proyecto obligatorio.";
  if (!d.project_type) e.project_type = "Selecciona uno de los 11 tipos.";
  if (!d.methodology_pack) e.methodology_pack = "Elige una metodología base.";
  if (d.preliminary_budget_minor_units.trim()) {
    const normalized = d.preliminary_budget_minor_units.replace(/,/g, "").replace(/\s+/g, "");
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0) e.budget = "Importe debe ser ≥ 0 (unidades minoritarias sin decimales o con punto decimal).";
  }
  return e;
}

export function ProyectoIntakeWizard() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [draft, setDraft] = useState<DraftForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [announce, setAnnounce] = useState("");
  const createMutation = useCreateProyecto();

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.id === step), [step]);
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    setAnnounce(`Paso ${stepIndex + 1} de ${STEPS.length}: ${STEPS[stepIndex]?.label ?? step}`);
  }, [stepIndex, step]);

  const patch = useCallback((p: Partial<DraftForm>) => {
    setDraft((prev) => ({ ...prev, ...p }));
    setErrors({});
  }, []);

  const canLeaveStep = useCallback(
    (from: StepId): boolean => {
      if (from === "basic") {
        if (!draft.name.trim()) {
          setErrors({ name: "Nombre del proyecto obligatorio." });
          return false;
        }
        if (!draft.project_type) {
          setErrors({ project_type: "Selecciona uno de los 11 tipos." });
          return false;
        }
      }
      if (from === "methodology") {
        if (!draft.methodology_pack) {
          setErrors({ methodology_pack: "Elige una metodología base." });
          return false;
        }
      }
      if (from === "budget" && draft.preliminary_budget_minor_units.trim()) {
        const normalized = draft.preliminary_budget_minor_units.replace(/,/g, "").replace(/\s+/g, "");
        const n = Number(normalized);
        if (!Number.isFinite(n) || n < 0) {
          setErrors({ preliminary_budget_minor_units: "Importe inválido." });
          return false;
        }
      }
      return true;
    },
    [draft],
  );

  const goNext = useCallback(() => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i < 0 || !canLeaveStep(STEPS[i].id)) return;
    const next = STEPS[Math.min(i + 1, STEPS.length - 1)].id;
    setStep(next);
    setErrors({});
  }, [canLeaveStep, step]);

  const goPrev = useCallback(() => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i <= 0) return;
    setStep(STEPS[i - 1].id);
    setErrors({});
  }, [step]);

  const onSubmit = useCallback(async () => {
    const v = validateDraft(draft);
    setErrors(v as Record<string, string>);
    if (Object.keys(v).length > 0) {
      toast.error("Revisa los campos marcados antes de crear el proyecto.", { duration: 5000 });
      return;
    }

    let budgetMinor: number | undefined;
    if (draft.preliminary_budget_minor_units.trim()) {
      const normalized = draft.preliminary_budget_minor_units.replace(/,/g, "").replace(/\s+/g, "");
      budgetMinor = Math.round(Number(normalized));
    }

    const payload: CreateProyectoPayload = {
      name: draft.name.trim(),
      project_type: draft.project_type as ProjectTypeCode,
      methodology_pack: draft.methodology_pack,
      preliminary_budget_minor_units: budgetMinor,
      budget_currency: draft.budget_currency,
      description: draft.description.trim() || null,
    };

    try {
      const created = await createMutation.mutateAsync(payload);
      if (!created.id) {
        toast.success("Creación solicitada — ID pendiente hasta que backend normalice.", { duration: 5000 });
        router.push("/proyectos");
        return;
      }
      toast.success("Proyecto creado", { duration: 4000 });
      router.push(`/proyectos/${encodeURIComponent(created.id)}`);
    } catch (err) {
      const msg = err instanceof ProjectsApiError ? err.message : "No se pudo crear el proyecto (backend no disponible o error de validación).";
      toast.error(msg, { duration: 6000 });
    }
  }, [createMutation, draft, router]);

  const basicPanel = (
    <div className="space-y-4">
      <Input
        label="Nombre del proyecto"
        required
        value={draft.name}
        onChange={(e) => patch({ name: e.target.value })}
        error={errors.name}
      />
      <Select
        label="Tipo de proyecto (11 categorías estándar)"
        value={draft.project_type}
        onChange={(e) => patch({ project_type: e.target.value as ProjectTypeCode | "" })}
        options={projectTypeOptions}
        error={errors.project_type}
      />
      <Textarea
        label="Descripción (opcional)"
        rows={3}
        value={draft.description}
        onChange={(e) => patch({ description: e.target.value })}
      />
    </div>
  );

  const methodologyPanel = (
    <div className="space-y-4">
      <p className="text-forge-sm text-forgeGray-600">
        Elige el paquete metodológico que gobernará rituals y gates. Contrato puede ampliarlo con YAML de catálogo.
      </p>
      <Select
        label="Paquete metodológico"
        value={draft.methodology_pack}
        onChange={(e) => patch({ methodology_pack: e.target.value as MethodologyPackId | "" })}
        options={methodologyOptions}
        error={errors.methodology_pack}
      />
    </div>
  );

  const budgetPanel = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        className="sm:col-span-1"
        label="Moneda referencial"
        value={draft.budget_currency}
        onChange={(e) => patch({ budget_currency: e.target.value })}
        options={currencyOptions}
      />
      <div className="sm:col-span-2">
        <Input
          label="Presupuesto preliminar (unidades minoritarias)"
          inputMode="decimal"
          helper="Opcional hasta que financiero confirme. Usa mismo criterio que backend (minor units)."
          value={draft.preliminary_budget_minor_units}
          onChange={(e) => patch({ preliminary_budget_minor_units: e.target.value })}
          error={errors.preliminary_budget_minor_units ?? errors.budget}
        />
      </div>
    </div>
  );

  const reviewPanel = (
    <div className="space-y-3 text-forge-sm text-forgeGray-800">
      <dl className="grid gap-2 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4">
        <div>
          <dt className="text-forge-xs font-semibold text-forgeGray-500">Nombre</dt>
          <dd>{draft.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-forge-xs font-semibold text-forgeGray-500">Tipo</dt>
          <dd>{draft.project_type ? PROJECT_TYPE_LABELS_ES[draft.project_type as ProjectTypeCode] : "—"}</dd>
        </div>
        <div>
          <dt className="text-forge-xs font-semibold text-forgeGray-500">Metodología</dt>
          <dd>
            {draft.methodology_pack ? METHODOLOGY_LABELS_ES[draft.methodology_pack as MethodologyPackId] : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-forge-xs font-semibold text-forgeGray-500">Presupuesto</dt>
          <dd>
            {draft.preliminary_budget_minor_units.trim()
              ? `${draft.preliminary_budget_minor_units} ${draft.budget_currency}`
              : "Sin capturar"}
          </dd>
        </div>
      </dl>
      <p className="text-forge-xs text-forgeGray-500">
        Al confirmar se envía <code className="font-forgeMono">POST /api/v1/proyectos</code> con cabecera{" "}
        <code className="font-forgeMono">X-Tenant-ID</code>.
      </p>
    </div>
  );

  const tabDefs = STEPS.map((s) => ({
    id: s.id,
    label: s.label,
    panel:
      s.id === "basic"
        ? basicPanel
        : s.id === "methodology"
          ? methodologyPanel
          : s.id === "budget"
            ? budgetPanel
            : reviewPanel,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="proyecto-intake-wizard">
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      <Card className="overflow-hidden border border-forgeGray-200 p-5">
        <p className="text-forge-xs font-semibold uppercase tracking-wider text-forgeBrand-600">
          Alta de proyecto · Intake wizard
        </p>
        <p className="mt-2 text-forge-xs text-forgeGray-500">
          Flujo paralelo al backend — los pasos pueden guardarse cuando exista borrador persistente en API.
        </p>

        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-forge-md bg-forgeGray-100"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del wizard"
        >
          <div
            className="h-full bg-forgeBrand-500 transition-all duration-[var(--forge-duration-fast)] ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 font-forgeMono text-forge-xs text-forgeGray-500">
          Paso {stepIndex + 1} / {STEPS.length}
        </p>
      </Card>

      <Tabs
        variant="pills"
        value={step}
        onValueChange={(id) => setStep(id as StepId)}
        tabs={tabDefs}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" className="min-h-11" disabled={stepIndex === 0 || createMutation.isPending} onClick={goPrev}>
          Atrás
        </Button>
        <div className="flex gap-2">
          {step !== "review" ? (
            <Button type="button" variant="primary" className="min-h-11" disabled={createMutation.isPending} onClick={goNext}>
              Siguiente
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="min-h-11"
              loading={createMutation.isPending}
              onClick={() => void onSubmit()}
            >
              Crear proyecto
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
