"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createProyecto, ProyectosApiError } from "@/app/hooks/useProyectos";
import { Button, Card, Input, Select, Tabs, Textarea } from "@/components/forge";
import {
  METHODOLOGY_LABELS_ES,
  METHODOLOGY_PACK_IDS,
  PROJECT_TYPE_CODES,
  PROJECT_TYPE_LABELS_ES,
  type MethodologyPackId,
  type ProjectTypeCode,
} from "@/lib/projects/types";
import { useTenant } from "@/contexts/TenantContext";

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

/**
 * Payload JSON POST /api/v1/proyectos — alinea con scaffolding previo hasta que el YAML
 * Nadakki_ProjectsCore_02_API_Contract_v1_1 esté en este repo para cotejo literal.
 */
function buildCreatePayload(draft: DraftForm): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: draft.name.trim(),
    project_type: draft.project_type,
    methodology_pack: draft.methodology_pack,
    budget_currency: draft.budget_currency,
  };

  const desc = draft.description.trim();
  if (desc) body.description = desc;

  if (draft.preliminary_budget_minor_units.trim()) {
    const normalized = draft.preliminary_budget_minor_units.replace(/,/g, "").replace(/\s+/g, "");
    body.preliminary_budget_minor_units = Math.round(Number(normalized));
  }

  return body;
}

/** Extrae id devuelto por varias envolturas API habituales. */
function extractProyectoCreateId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const o = payload as Record<string, unknown>;
  const direct = o.id ?? o.uuid ?? o.proyecto_id ?? o.project_id;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const data = o.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const inner = d.id ?? d.uuid ?? d.proyecto_id;
    if (typeof inner === "string" && inner.trim()) return inner.trim();
  }
  return undefined;
}

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
  const { tenantId } = useTenant();
  const tid = (tenantId ?? "").trim();

  const [step, setStep] = useState<StepId>("basic");
  const [draft, setDraft] = useState<DraftForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [announce, setAnnounce] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.id === step), [step]);
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    setAnnounce(`Paso ${stepIndex + 1} de ${STEPS.length}: ${STEPS[stepIndex]?.label ?? step}`);
  }, [stepIndex, step]);

  const patch = useCallback((p: Partial<DraftForm>) => {
    setDraft((prev) => ({ ...prev, ...p }));
    setErrors({});
    setSubmitError(null);
    setSuccessNote(null);
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
    setSubmitError(null);
    setSuccessNote(null);
  }, [canLeaveStep, step]);

  const goPrev = useCallback(() => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i <= 0) return;
    setStep(STEPS[i - 1].id);
    setErrors({});
    setSubmitError(null);
    setSuccessNote(null);
  }, [step]);

  const onSubmit = useCallback(async () => {
    if (!tid) {
      setSubmitError("No hay tenant activo. Selecciona institución en la cabecera.");
      return;
    }

    const v = validateDraft(draft);
    setErrors(v as Record<string, string>);
    if (Object.keys(v).length > 0) {
      setSubmitError("Corrige los campos marcados antes de crear el proyecto.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessNote(null);

    const apiBody = buildCreatePayload(draft);

    try {
      const raw = await createProyecto(tid, apiBody);
      const newId = extractProyectoCreateId(raw);
      setSuccessNote("Proyecto creado correctamente.");

      if (newId) {
        router.push(`/proyectos/${encodeURIComponent(newId)}`);
        return;
      }
      setSubmitError(
        "El servidor respondió OK pero sin `id` reconocido en JSON. Consulta auditoría/consola o revisa contrato YAML.",
      );
    } catch (err) {
      const msg =
        err instanceof ProyectosApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error desconocido al crear proyecto.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [draft, router, tid]);

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
        Elige el paquete metodológico que gobernará rituals y gates. Verifica nomenclatura con el contrato NADAKKI
        Projects Core cuando el YAML esté en este repositorio.
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
          helper="Opcional. Se envía como entero rounded (minor units) según acuerdos backend."
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
      <div className="rounded-forge-md border border-forgeGray-200 bg-white p-3 font-forgeMono text-[11px] text-forgeGray-600 dark:bg-gray-950/40">
        <p className="mb-2 font-semibold text-forgeGray-800 dark:text-gray-100">Vista previa JSON (POST)</p>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all">
          {JSON.stringify(buildCreatePayload(draft), null, 2)}
        </pre>
      </div>
      <p className="text-forge-xs text-forgeGray-500">
        Ejecución <code className="font-forgeMono">POST {process.env.NEXT_PUBLIC_API_URL || "BACKEND_URL"}/api/v1/proyectos</code>{" "}
        con cabecera <code className="font-forgeMono">X-Tenant-ID</code> desde el tenant activo (sin defaults).
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

  const busyDisabled = submitting;

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="proyecto-intake-wizard">
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      {submitError ? (
        <Card className="border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <p className="text-forge-sm font-medium text-red-900 dark:text-red-100">{submitError}</p>
        </Card>
      ) : null}

      {successNote && !submitError ? (
        <Card className="border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
          <p className="text-forge-sm font-medium text-green-900 dark:text-green-100">{successNote}</p>
        </Card>
      ) : null}

      {!tid ? (
        <Card variant="outlined" className="border-amber-200 bg-amber-50/90 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-forge-sm text-amber-950 dark:text-amber-100">
            Esperando tenant institucional desde el selector global. Esta pantalla debería mostrarse bajo gate;
            si llegaste aquí sin tenant selecciona una institución.
          </p>
        </Card>
      ) : null}

      <Card className="overflow-hidden border border-forgeGray-200 p-5">
        <p className="text-forge-xs font-semibold uppercase tracking-wider text-forgeBrand-600">
          Alta de proyecto · Intake wizard
        </p>
        <p className="mt-2 text-forge-xs text-forgeGray-500">
          El formulario ejecuta llamada POST real al Projects Core mediante <code className="font-forgeMono text-[10px]">createProyecto</code>.
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
        <Button type="button" variant="secondary" className="min-h-11" disabled={stepIndex === 0 || busyDisabled} onClick={goPrev}>
          Atrás
        </Button>
        <div className="flex gap-2">
          {step !== "review" ? (
            <Button type="button" variant="primary" className="min-h-11" disabled={busyDisabled} onClick={goNext}>
              Siguiente
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="min-h-11"
              loading={busyDisabled}
              disabled={busyDisabled || !tid}
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
