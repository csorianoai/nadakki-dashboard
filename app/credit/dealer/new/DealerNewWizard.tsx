"use client";

import { ApplicantForm, ValidationBanner, VehicleForm } from "@/components/credit";
import {
  createApplication,
  CreditApiError,
  processApplication,
  saveApplicant,
  saveVehicle,
  type ApplicantPayload,
  type VehiclePayload,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  "Crear solicitud",
  "Solicitante",
  "Vehículo",
  "Procesar",
] as const;

export function DealerNewWizard() {
  const { tenantId: ctxTenantId } = useTenant();
  const tenantId = (ctxTenantId ?? "").trim();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [mode] = useState<"AI_ONLY" | "BANK_ONLY" | "HYBRID">("AI_ONLY");

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
        dry_run: true,
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
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Ejecutar análisis (dry run). Tras finalizar, verá el expediente
            completo.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={onProcess}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-50"
          >
            {busy ? "Procesando…" : "Procesar solicitud"}
          </button>
        </div>
      )}
    </div>
  );
}
