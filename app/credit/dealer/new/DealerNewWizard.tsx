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
import { AiReadinessPanel, VehicleShowcaseCard, WizardProgressRail } from "@/components/credit/forge";
import { Sparkles } from "lucide-react";

const STEPS = ["Crear solicitud", "Solicitante", "Vehículo", "Documentos", "Evaluar"] as const;

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
  const [completeness, setCompleteness] = useState<Awaited<ReturnType<typeof getDocumentCompleteness>> | null>(null);
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
        className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500"
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
  const [mode, setMode] = useState<"AI_ONLY" | "BANK_ONLY" | "HYBRID">("AI_ONLY");

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-slate-900 to-slate-950 p-6 shadow-2xl md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-300">
              <Sparkles className="h-4 w-4" aria-hidden />
              AI Financing Wizard
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Nueva solicitud de crédito</h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400">
              Flujo guiado con validaciones existentes. Cada paso persiste contra el Credit Core; sin datos de demostración
              embebidos.
            </p>
          </div>
          <Link
            href="/credit/dealer"
            className="shrink-0 text-sm font-medium text-slate-400 underline-offset-4 hover:text-white hover:underline"
          >
            ← Volver al command center
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <WizardProgressRail steps={STEPS} currentIndex={step} />

          <ValidationBanner
            error={
              error instanceof CreditApiError ? error : error?.message ? error : null
            }
          />

          {step === 0 && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <p className="text-sm leading-relaxed text-slate-400">
                Se creará un expediente en estado <strong className="text-slate-200">DRAFT</strong> con modo{" "}
                <strong className="text-slate-200">{mode}</strong>.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={stepCreate}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500 disabled:opacity-50"
              >
                {busy ? "Creando…" : "Crear expediente y continuar"}
              </button>
            </div>
          )}

          {step === 1 && applicationId && <ApplicantForm onSubmit={onApplicant} disabled={busy} />}

          {step === 2 && applicationId && <VehicleForm onSubmit={onVehicle} disabled={busy} />}

          {step === 3 && applicationId && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <DocumentsStepInline
                applicationId={applicationId}
                tenantId={tenantId}
                onComplete={() => setStep(4)}
              />
            </div>
          )}

          {step === 4 && applicationId && (
            <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-200">Modalidad de evaluación</h3>
                <p className="mb-4 text-xs text-slate-500">Selecciona cómo procesar esta solicitud (misma lógica que antes).</p>
                <div className="grid grid-cols-1 gap-3">
                  {(
                    [
                      {
                        value: "AI_ONLY" as const,
                        label: "Solo IA",
                        desc: "Evaluación automática del perfil crediticio.",
                        color: "border-violet-500/50 bg-violet-500/10",
                      },
                      {
                        value: "BANK_ONLY" as const,
                        label: "Solo banco",
                        desc: "Enviar a instituciones para evaluación manual.",
                        color: "border-blue-500/50 bg-blue-500/10",
                      },
                      {
                        value: "HYBRID" as const,
                        label: "Híbrido (IA + Banco)",
                        desc: "Pre-evaluación IA y paquete para mesa bancaria.",
                        color: "border-teal-500/50 bg-teal-500/10",
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        mode === opt.value ? opt.color : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value={opt.value}
                        checked={mode === opt.value}
                        onChange={() => setMode(opt.value)}
                        className="mt-1 accent-violet-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-200">{opt.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                <p className="text-xs font-medium text-amber-200">Resumen</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
                  Al procesar se ejecutará el análisis{" "}
                  {mode === "AI_ONLY" ? "de IA" : mode === "BANK_ONLY" ? "bancario" : "combinado"}. El resultado quedará en el
                  expediente.
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={onProcess}
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-500 disabled:opacity-50"
              >
                {busy
                  ? "Procesando solicitud..."
                  : `Procesar con ${mode === "AI_ONLY" ? "IA" : mode === "BANK_ONLY" ? "banco" : "modo híbrido"}`}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <AiReadinessPanel stepIndex={step} />
          <VehicleShowcaseCard />
        </div>
      </div>
    </div>
  );
}
