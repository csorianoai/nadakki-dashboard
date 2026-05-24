"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProyecto, ProyectosApiError } from "@/app/hooks/useProyectos";
import { Button, Input, Modal, Select, Tabs } from "@/components/forge";
import { motion } from "@/lib/motion-stub";
import GlassCard from "@/components/ui/GlassCard";
import {
  BACKEND_PROJECT_TYPE_LABELS_ES,
  BACKEND_PROJECT_TYPES,
  type BackendClassification,
  type BackendProjectType,
  BACKEND_CLASSIFICATION_LABELS_ES,
  BACKEND_CLASSIFICATIONS,
} from "@/components/proyectos/projectsCoreEnums";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";

const STEPS = [
  { id: "identity", label: "1 · Identidad" },
  { id: "clasificacion", label: "2 · Clasificación" },
  { id: "presupuesto", label: "3 · Presupuesto" },
  { id: "review", label: "4 · Revisión" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface DraftForm {
  name: string;
  project_type: BackendProjectType | "";
  codigo_interno: string;
  classification: BackendClassification | "";
  industry_overlay: string;
  sponsor_user_id: string;
  pmo_director_user_id: string;
  budget_envelope_usd: string;
}

const EMPTY: DraftForm = {
  name: "",
  project_type: "",
  codigo_interno: "",
  classification: "",
  industry_overlay: "",
  sponsor_user_id: "",
  pmo_director_user_id: "",
  budget_envelope_usd: "",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectTypeOptions = [
  { value: "", label: "Seleccionar tipo de proyecto…", disabled: true },
  ...BACKEND_PROJECT_TYPES.map((code) => ({
    value: code,
    label: BACKEND_PROJECT_TYPE_LABELS_ES[code],
  })),
];

const classificationOptions = [
  { value: "", label: "Sin clasificación (opcional)", disabled: true },
  ...BACKEND_CLASSIFICATIONS.map((code) => ({
    value: code,
    label: BACKEND_CLASSIFICATION_LABELS_ES[code],
  })),
];

/**
 * Payload POST /api/v1/proyectos — sólo campos soportados por gateway (sin fechas).
 */
function buildCreatePayload(draft: DraftForm): Record<string, unknown> {
  const body: Record<string, unknown> = {
    nombre: draft.name.trim(),
    project_type: draft.project_type as string,
  };

  const code = draft.codigo_interno.trim();
  if (code) body.codigo_interno = code;

  if (draft.classification) body.classification = draft.classification;

  const overlay = draft.industry_overlay.trim();
  if (overlay) body.industry_overlay = overlay;

  const sponsor = draft.sponsor_user_id.trim();
  if (sponsor) body.sponsor_user_id = sponsor;

  const pmo = draft.pmo_director_user_id.trim();
  if (pmo) body.pmo_director_user_id = pmo;

  const normalizedBudget = draft.budget_envelope_usd.replace(/,/g, "").replace(/\s+/g, "").trim();
  if (normalizedBudget !== "") {
    const n = Number(normalizedBudget);
    if (!Number.isNaN(n) && Number.isFinite(n) && n >= 0) {
      body.budget_envelope_usd = n;
    }
  }

  return body;
}

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

/** Formato legible USD para input (solo ayuda UI; servidor recibe número) */
function formatUsdHelp(raw: string): string {
  const n = Number(raw.replace(/,/g, "").replace(/\s+/g, ""));
  if (!raw.trim() || Number.isNaN(n)) return "";
  try {
    return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return "";
  }
}

export function ProyectoIntakeWizard() {
  const router = useRouter();
  const tid = useForgeProjectsTenantId() ?? "";

  const [step, setStep] = useState<StepId>("identity");
  const [draft, setDraft] = useState<DraftForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [announce, setAnnounce] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.id === step), [step]);
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  const uuidErrors = useMemo(() => {
    const e: Partial<Record<"sponsor_user_id" | "pmo_director_user_id", string>> = {};
    const s = draft.sponsor_user_id.trim();
    if (s && !UUID_RE.test(s)) e.sponsor_user_id = "Debe ser un UUID v4 válido.";
    const p = draft.pmo_director_user_id.trim();
    if (p && !UUID_RE.test(p)) e.pmo_director_user_id = "Debe ser un UUID v4 válido.";
    return e;
  }, [draft.sponsor_user_id, draft.pmo_director_user_id]);

  const canSubmitCreation = Boolean(
    draft.name.trim() && draft.project_type && Object.keys(uuidErrors).length === 0,
  );

  const budgetPreview = useMemo(() => formatUsdHelp(draft.budget_envelope_usd), [draft.budget_envelope_usd]);

  useEffect(() => {
    setAnnounce(`Paso ${stepIndex + 1} de ${STEPS.length}: ${STEPS[stepIndex]?.label ?? step}`);
  }, [stepIndex, step]);

  const patch = useCallback((p: Partial<DraftForm>) => {
    setDraft((prev) => ({ ...prev, ...p }));
    setErrors({});
    setSubmitError(null);
  }, []);

  const canLeaveStep = useCallback(
    (from: StepId): boolean => {
      if (from === "identity") {
        if (!draft.name.trim()) {
          setErrors({ name: "Nombre del proyecto obligatorio." });
          return false;
        }
        if (!draft.project_type) {
          setErrors({ project_type: "Selecciona un tipo válido para el CORE." });
          return false;
        }
      }
      if (from === "clasificacion") {
        const ue = uuidErrors;
        if (Object.keys(ue).length > 0) {
          setErrors(ue as Record<string, string>);
          return false;
        }
      }
      if (from === "presupuesto") {
        const norm = draft.budget_envelope_usd.replace(/,/g, "").replace(/\s+/g, "").trim();
        if (norm !== "") {
          const n = Number(norm);
          if (!Number.isFinite(n) || n < 0) {
            setErrors({ budget_envelope_usd: "Montos ≥ 0; usa punto o coma como separador decimal si aplica." });
            return false;
          }
        }
      }
      return true;
    },
    [draft.budget_envelope_usd, draft.name, draft.project_type, uuidErrors],
  );

  const goNext = useCallback(() => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i < 0 || !canLeaveStep(STEPS[i].id)) return;
    const next = STEPS[Math.min(i + 1, STEPS.length - 1)].id;
    setStep(next);
    setErrors({});
    setSubmitError(null);
  }, [canLeaveStep, step]);

  const goPrev = useCallback(() => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i <= 0) return;
    setStep(STEPS[i - 1].id);
    setErrors({});
    setSubmitError(null);
  }, [step]);

  const onSubmit = useCallback(async () => {
    if (!tid) {
      setSubmitError("No hay tenant activo (UUID Auth V2).");
      toast.error("Falta tenant", { description: "Selecciona institución antes de crear." });
      return;
    }
    if (!canSubmitCreation) {
      setSubmitError("Nombre y tipo de proyecto son obligatorios. Revisa los UUID opcionales.");
      toast.warning("Completa datos requeridos", { description: "Nombre y tipo de proyecto." });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const normBudget = draft.budget_envelope_usd.replace(/,/g, "").replace(/\s+/g, "").trim();
    if (normBudget !== "") {
      const bn = Number(normBudget);
      if (!Number.isFinite(bn) || bn < 0) {
        toast.warning("Revisa el sobre presupuesto", { description: "Debe ser un número ≥ 0." });
        setSubmitting(false);
        return;
      }
    }

    const apiBody = buildCreatePayload(draft);

    try {
      const raw = await createProyecto(tid, apiBody);
      const newId = extractProyectoCreateId(raw);
      toast.success("Proyecto creado", {
        description: newId ? `Blueprint activo · ID ${newId.slice(0, 8)}…` : "Sincronizado con Projects Core.",
      });

      if (newId) {
        router.push(`/proyectos/${encodeURIComponent(newId)}`);
        return;
      }
      setSubmitError(
        "Respuesta OK sin `id` reconocido. Revisa el contrato POST o la consola red.",
      );
    } catch (err) {
      const msg =
        err instanceof ProyectosApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error desconocido al crear proyecto.";
      setSubmitError(msg);
      toast.error("No se creó el proyecto", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }, [draft, router, tid, canSubmitCreation]);

  const identityPanel = (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-zinc-500">
        Objetivos de obra y nomenclatura pública — el estado inicial lo fija el backend (<span className="font-mono text-amber-200/90">INTAKE</span>
        ).
      </p>
      <Input
        label="Nombre del proyecto"
        required
        value={draft.name}
        onChange={(e) => patch({ name: e.target.value })}
        error={errors.name}
      />
      <Select
        label="Tipo de proyecto (CORE)"
        value={draft.project_type}
        onChange={(e) => patch({ project_type: e.target.value as BackendProjectType | "" })}
        options={projectTypeOptions}
        error={errors.project_type}
      />
      <Input
        label="Código interno (opcional)"
        value={draft.codigo_interno}
        onChange={(e) => patch({ codigo_interno: e.target.value })}
        helper="Referencia ledger / SAP — sólo texto."
      />
    </div>
  );

  const clasificacionPanel = (
    <div className="space-y-4">
      <Select
        label="Clasificación de confidencialidad"
        value={draft.classification}
        onChange={(e) => patch({ classification: e.target.value as BackendClassification | "" })}
        options={classificationOptions}
      />
      <Input
        label="Industry overlay"
        value={draft.industry_overlay}
        onChange={(e) => patch({ industry_overlay: e.target.value })}
        helper="Vertical de negocio (texto libre). No enviar fechas al crear proyecto."
      />
      <Input
        label="Sponsor · user ID UUID (opcional)"
        value={draft.sponsor_user_id}
        onChange={(e) => patch({ sponsor_user_id: e.target.value })}
        error={errors.sponsor_user_id}
      />
      <Input
        label="PMO director · user ID UUID (opcional)"
        value={draft.pmo_director_user_id}
        onChange={(e) => patch({ pmo_director_user_id: e.target.value })}
        error={errors.pmo_director_user_id}
      />
      <button
        type="button"
        className="text-[11px] font-semibold text-amber-300 underline-offset-4 hover:text-amber-100 hover:underline"
        onClick={() => setInfoModalOpen(true)}
      >
        Por qué no pedimos fechas en el alta
      </button>
      <Modal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="Sin fechas en POST"
        description="El núcleo valida DATE estrictamente; hasta que el YAML esté enlazado, evita envío accidental."
        className="border-amber-400/35 bg-zinc-950 text-zinc-100 backdrop:bg-black/80 !text-zinc-100"
        footer={
          <Button type="button" variant="secondary" onClick={() => setInfoModalOpen(false)}>
            Entendido
          </Button>
        }
      >
        <p className="text-sm text-zinc-300">
          Los campos <span className="font-mono text-amber-200">fecha_inicio_target</span> /{" "}
          <span className="font-mono text-amber-200">fecha_fin_target</span> son DATE server-side y hoy pueden romperse con strings ISO desde el navegador. El wizard sólo usa campos whitelisteados hasta alinear serializers.
        </p>
      </Modal>
    </div>
  );

  const presupuestoPanel = (
    <div className="space-y-4">
      <Input
        label="Sobre presupuesto (USD)"
        inputMode="decimal"
        helper="Equivalente servidor: budget_envelope_usd (number). Ej. 28500000 o 28,500,000"
        value={draft.budget_envelope_usd}
        onChange={(e) => patch({ budget_envelope_usd: e.target.value })}
        error={errors.budget_envelope_usd}
      />
      {budgetPreview ? (
        <p className="text-[11px] text-zinc-500">
          Vista rápida: <span className="font-mono text-emerald-200/95">{budgetPreview}</span>
        </p>
      ) : null}
    </div>
  );

  const previewPayload = useMemo(() => buildCreatePayload(draft), [draft]);

  const reviewPanel = (
    <div className="space-y-3 text-sm text-zinc-200">
      <dl className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Nombre</dt>
          <dd className="font-medium text-white">{draft.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Tipo</dt>
          <dd>
            {draft.project_type
              ? BACKEND_PROJECT_TYPE_LABELS_ES[draft.project_type as BackendProjectType]
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Código interno</dt>
          <dd className="font-mono text-xs">{draft.codigo_interno.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Clasificación</dt>
          <dd>
            {draft.classification
              ? BACKEND_CLASSIFICATION_LABELS_ES[draft.classification as BackendClassification]
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Industry overlay</dt>
          <dd>{draft.industry_overlay.trim() || "—"}</dd>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Sponsor</dt>
            <dd className="break-all font-mono text-[11px] text-zinc-400">{draft.sponsor_user_id.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">PMO director</dt>
            <dd className="break-all font-mono text-[11px] text-zinc-400">{draft.pmo_director_user_id.trim() || "—"}</dd>
          </div>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">budget_envelope_usd</dt>
          <dd className="font-mono text-emerald-200/90">{String(previewPayload.budget_envelope_usd ?? "—")}</dd>
        </div>
      </dl>
      <GlassCard hover={false} className="p-4 font-mono text-[11px] leading-relaxed text-emerald-100/95">
        <p className="mb-2 font-semibold text-amber-100">Vista previa JSON · POST</p>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(previewPayload, null, 2)}</pre>
      </GlassCard>
      {!canSubmitCreation ? (
        <p className="text-[11px] text-rose-300/95">Completa nombre, tipo de proyecto y UUID válidos antes de crear.</p>
      ) : null}
    </div>
  );

  const tabDefs = STEPS.map((s) => ({
    id: s.id,
    label: s.label,
    panel:
      s.id === "identity"
        ? identityPanel
        : s.id === "clasificacion"
          ? clasificacionPanel
          : s.id === "presupuesto"
            ? presupuestoPanel
            : reviewPanel,
  }));

  const busyDisabled = submitting;

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="proyecto-intake-wizard">
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      {submitError ? (
        <GlassCard hover={false} className="border border-rose-500/40 bg-rose-500/10 p-4">
          <p className="text-sm font-medium text-rose-100">{submitError}</p>
        </GlassCard>
      ) : null}

      {!tid ? (
        <GlassCard hover={false} className="border border-amber-400/35 bg-amber-500/[0.12] p-4">
          <p className="text-sm text-amber-50">Esperando tenant institucional (UUID) Auth V2.</p>
        </GlassCard>
      ) : null}

      <GlassCard hover={false} className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#fbbf24" }}>
          Alta de proyecto · Intake blueprint
        </p>
        <p className="mt-3 text-xs text-zinc-400">
          POST completo contra Projects Core sin fechas legacy — mismo pulido vivo que Marketing.
        </p>

        <div
          className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del wizard"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_28px_-4px_rgba(251,191,36,0.95)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.55 }}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] text-zinc-500">
          Paso {stepIndex + 1} / {STEPS.length}
        </p>
      </GlassCard>

      <Tabs variant="pills" value={step} onValueChange={(id) => setStep(id as StepId)} tabs={tabDefs} />

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
              disabled={busyDisabled || !tid || !canSubmitCreation}
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
