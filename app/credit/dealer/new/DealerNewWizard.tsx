"use client";

import { ApplicantForm, ValidationBanner, VehicleForm } from "@/components/credit";
import { DocumentCompletenessCard } from "@/components/credit/documents/DocumentCompletenessCard";
import { DocumentList } from "@/components/credit/documents/DocumentList";
import { DocumentUploader } from "@/components/credit/documents/DocumentUploader";
import {
  createApplication,
  CreditApiError,
  getDocumentCompleteness,
  listDocuments,
  processApplication,
  saveApplicant,
  saveVehicle,
  type ApplicantPayload,
  type CreditDocument,
  type VehiclePayload,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STEPS = [
  "Crear solicitud",
  "Solicitante",
  "Vehículo",
  "Documentos",
  "Procesar",
] as const;

function DocumentsStepInline({
  applicationId,
  tenantId,
  onComplete,
}: {
  applicationId: string;
  tenantId: string;
  onComplete: () => void;
}) {
  const [docs, setDocs] = useState<CreditDocument[]>([]);
  const [completeness, setCompleteness] =
    useState<Awaited<ReturnType<typeof getDocumentCompleteness>> | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const loadDocs = useCallback(async () => {
    if (!tenantId.trim()) return;
    setLoadingDocs(true);
    try {
      const [docsData, comp] = await Promise.all([
        listDocuments(tenantId, applicationId),
        getDocumentCompleteness(tenantId, applicationId),
      ]);
      setDocs(docsData);
      setCompleteness(comp);
    } catch {
      setDocs([]);
      setCompleteness(null);
    } finally {
      setLoadingDocs(false);
    }
  }, [tenantId, applicationId]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  return (
    <div className="space-y-4">
      <DocumentCompletenessCard completeness={completeness} />
      <DocumentUploader
        applicationId={applicationId}
        onUploadSuccess={() => {
          void loadDocs();
        }}
      />
      <DocumentList documents={docs} loading={loadingDocs} />
      <button
        type="button"
        onClick={onComplete}
        className="w-full py-2 px-4 rounded bg-purple-600 text-white text-sm font-medium hover:bg-purple-500"
      >
        Continuar a evaluación →
      </button>
    </div>
  );
}

export function DealerNewWizard() {
  const { tenantId: ctxTenantId } = useTenant();
  const tenantId = (ctxTenantId ?? "").trim();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [mode, setMode] = useState<"AI_ONLY" | "BANK_ONLY" | "HYBRID">(
    "AI_ONLY"
  );

  async function stepCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await createApplication(tenantId, {
        application_payload: {
          mode,
          applicant_data: {},
        },
        initial_state: "DRAFT",
      });
      setApplicationId(res.application_id);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function onApplicant(data: ApplicantPayload) {
    if (!applicationId) return;
    setBusy(true);
    setError(null);
    try {
      await saveApplicant(tenantId, applicationId, data);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function onVehicle(data: VehiclePayload) {
    if (!applicationId) return;
    setBusy(true);
    setError(null);
    try {
      await saveVehicle(tenantId, applicationId, data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function onProcess() {
    if (!applicationId) return;
    setBusy(true);
    setError(null);
    try {
      await processApplication(tenantId, applicationId, {
        mode,
        dry_run: false,
      });
      router.push(`/credit/dealer/${encodeURIComponent(applicationId)}`);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-50">Nueva solicitud</h1>
        <Link
          href="/credit/dealer"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ← Volver
        </Link>
      </div>

      <ol className="flex gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg px-2 py-2 text-center ${
              i === step
                ? "bg-violet-600 text-white"
                : i < step
                  ? "bg-white/10 text-slate-400"
                  : "bg-white/5 text-slate-600"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <ValidationBanner
        error={
          error instanceof CreditApiError
            ? error
            : error?.message
              ? error
              : null
        }
      />

      {step === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Se creará un expediente en estado <strong>DRAFT</strong> con modo{" "}
            <strong>{mode}</strong>.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={stepCreate}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {busy ? "Creando…" : "Continuar"}
          </button>
        </div>
      )}

      {step === 1 && applicationId && (
        <ApplicantForm onSubmit={onApplicant} disabled={busy} />
      )}

      {step === 2 && applicationId && (
        <VehicleForm onSubmit={onVehicle} disabled={busy} />
      )}

      {step === 3 && applicationId && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <DocumentsStepInline
            applicationId={applicationId}
            tenantId={tenantId}
            onComplete={() => setStep(4)}
          />
        </div>
      )}

      {step === 4 && applicationId && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Modalidad de evaluación
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Selecciona cómo deseas procesar esta solicitud.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {(
                [
                  {
                    value: "AI_ONLY" as const,
                    label: "Solo IA",
                    desc: "El sistema de inteligencia artificial evalúa automáticamente el perfil crediticio basado en ingresos, historial y datos del vehículo.",
                    color: "border-violet-500/50 bg-violet-500/5",
                  },
                  {
                    value: "BANK_ONLY" as const,
                    label: "Solo banco",
                    desc: "La solicitud se envía directamente a las instituciones bancarias conectadas para su evaluación manual.",
                    color: "border-blue-500/50 bg-blue-500/5",
                  },
                  {
                    value: "HYBRID" as const,
                    label: "Híbrido (IA + Banco)",
                    desc: "La IA realiza una evaluación preliminar y la envía a los bancos con su análisis, acelerando la decisión final.",
                    color: "border-teal-500/50 bg-teal-500/5",
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    mode === opt.value
                      ? opt.color
                      : "border-white/10 bg-white/3 hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={opt.value}
                    checked={mode === opt.value}
                    onChange={() => setMode(opt.value)}
                    className="mt-0.5 accent-violet-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {opt.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-400 font-medium mb-1">
              Resumen de la solicitud
            </p>
            <p className="text-xs text-slate-400">
              Al procesar se ejecutará el análisis{" "}
              {mode === "AI_ONLY"
                ? "de inteligencia artificial"
                : mode === "BANK_ONLY"
                  ? "bancario"
                  : "combinado (IA + banco)"}
              . El resultado estará disponible inmediatamente en el expediente.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onProcess}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
          >
            {busy
              ? "Procesando solicitud..."
              : `Procesar con ${mode === "AI_ONLY" ? "IA" : mode === "BANK_ONLY" ? "banco" : "modo híbrido"}`}
          </button>
        </div>
      )}
    </div>
  );
}
