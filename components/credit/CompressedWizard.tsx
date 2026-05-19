"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WizardData } from "@/components/credit/compressed-wizard-types";
import { EMPTY_WIZARD_DATA } from "@/components/credit/compressed-wizard-types";
import {
  COMPRESSED_STEP_LABELS,
  CompressedWizardStepApplicant,
  CompressedWizardStepDeal,
  CompressedWizardStepEmployment,
  CompressedWizardStepReview,
  CompressedWizardStepVehicle,
} from "@/components/credit/CompressedWizardSteps";
import { useCompressedWizard, useStepTimer } from "@/hooks/useCompressedWizard";

const TARGET_MS = 25 * 60 * 1000;
const STEP_COUNT = 5;

export interface CompressedWizardProps {
  applicationId?: string;
  tenantId: string;
  onComplete: (data: WizardData) => Promise<void>;
  initialData?: Partial<WizardData>;
  enableOffline?: boolean;
  trackTiming?: boolean;
}

function mergeInitial(base: WizardData, partial?: Partial<WizardData>): WizardData {
  if (!partial) return { ...base };
  return {
    ...base,
    ...partial,
    applicant: { ...base.applicant, ...partial.applicant },
    employment: { ...base.employment, ...partial.employment },
    vehicle: { ...base.vehicle, ...partial.vehicle },
    deal: { ...base.deal, ...partial.deal },
    mode: partial.mode ?? base.mode,
    autoriza_buro: partial.autoriza_buro ?? base.autoriza_buro,
    acepta_politica: partial.acepta_politica ?? base.acepta_politica,
  };
}

function validateStep(step: number, data: WizardData): Partial<Record<string, string>> {
  const e: Partial<Record<string, string>> = {};
  if (step === 0) {
    if (!data.applicant.fullName.trim()) e.fullName = "Requerido";
    if (!data.applicant.dob) e.dob = "Requerido";
    if (data.applicant.nationalId.replace(/\D/g, "").length < 11)
      e.nationalId = "Cédula incompleta (11 dígitos)";
    if (!data.applicant.phone.trim()) e.phone = "Requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.applicant.email)) e.email = "Email inválido";
    if (!data.applicant.addressLine.trim()) e.addressLine = "Requerido";
  }
  if (step === 1) {
    if (!data.employment.employer.trim()) e.employer = "Requerido";
    if (!data.employment.position.trim()) e.position = "Requerido";
    if (data.employment.monthlyIncome <= 0) e.monthlyIncome = "Debe ser mayor a 0";
  }
  if (step === 2) {
    const vinOk = (data.vehicle.vin?.length ?? 0) === 17;
    const manualOk =
      Boolean(data.vehicle.year && data.vehicle.make?.trim() && data.vehicle.model?.trim());
    if (!vinOk && !manualOk) e.vinOrVehicle = "Ingresa VIN válido o marca/modelo/año";
  }
  if (step === 3) {
    if (data.deal.salePrice <= 0) e.salePrice = "Requerido";
    if (data.deal.downPayment < 0) e.downPayment = "Inválido";
    if (data.deal.downPayment > data.deal.salePrice) e.downPayment = "Inicial no puede exceder precio";
  }
  if (step === 4) {
    if (!data.autoriza_buro || !data.acepta_politica)
      e.legal = "Debes autorizar buró y aceptar la política de datos personales.";
  }
  return e;
}

export function CompressedWizard({
  applicationId,
  tenantId,
  onComplete,
  initialData,
  enableOffline = true,
  trackTiming = true,
}: CompressedWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => mergeInitial(EMPTY_WIZARD_DATA, initialData));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [sessionStart] = useState(() => Date.now());
  const [totalTracked, setTotalTracked] = useState(0);

  const wizard = useCompressedWizard({
    tenantId,
    applicationId,
    enableOfflineMode: enableOffline,
    trackTiming,
  });

  const onElapsed = useCallback(
    (step: number, ms: number) => {
      wizard.trackStepTime(step, ms);
      setTotalTracked((t) => t + ms);
    },
    [wizard],
  );

  useStepTimer(currentStep, onElapsed, trackTiming);

  useEffect(() => {
    const loaded = wizard.loadDraft() as Partial<WizardData> | null;
    if (loaded && typeof loaded === "object") setData((d) => mergeInitial(d, loaded));
  }, [wizard]);

  useEffect(() => {
    wizard.saveDraft(data);
  }, [data, wizard]);

  useEffect(() => {
    setAnnounce(`Paso ${currentStep + 1} de ${STEP_COUNT}: ${COMPRESSED_STEP_LABELS[currentStep]}`);
  }, [currentStep]);

  const progressPct = useMemo(() => ((currentStep + 1) / STEP_COUNT) * 100, [currentStep]);
  const elapsedSession = Date.now() - sessionStart;

  const applyPatch = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => mergeInitial(prev, patch));
    setErrors({});
  }, []);

  const handleVinDecode = useCallback(async () => {
    const vin = data.vehicle.vin?.trim() ?? "";
    const res = await wizard.decodeVIN(vin);
    if (res.year)
      applyPatch({ vehicle: { ...data.vehicle, year: res.year, make: res.make, model: res.model } });
  }, [applyPatch, data.vehicle, wizard]);

  const canGoNext = useCallback(() => {
    const v = validateStep(currentStep, data);
    setErrors(v);
    return Object.keys(v).length === 0;
  }, [currentStep, data]);

  const goNext = useCallback(() => {
    if (!canGoNext()) return;
    setCurrentStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }, [canGoNext]);

  const goPrev = useCallback(() => {
    setErrors({});
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const onSubmit = useCallback(async () => {
    const v = validateStep(4, data);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await onComplete(data);
    } finally {
      setBusy(false);
    }
  }, [data, onComplete]);

  return (
    <div className="compressed-wizard space-y-6" data-testid="compressed-wizard-root">
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-900/40 to-slate-900/80 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Flujo comprimido META</p>
          <p className="font-mono text-xs text-slate-400">
            Tiempo sesión: {Math.round(elapsedSession / 60000)} min · objetivo &lt; 25 min
          </p>
        </div>
        <div
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del wizard"
        >
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-teal-400 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>
            Paso {currentStep + 1}/{STEP_COUNT}
          </span>
          <span data-testid="cw-target-remaining">
            Meta restante referencial:{" "}
            {Math.max(0, Math.round((TARGET_MS - elapsedSession) / 60000))} min
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {currentStep === 0 && (
          <CompressedWizardStepApplicant data={data} onChange={applyPatch} errors={errors} />
        )}
        {currentStep === 1 && (
          <CompressedWizardStepEmployment data={data} onChange={applyPatch} errors={errors} />
        )}
        {currentStep === 2 && (
          <CompressedWizardStepVehicle
            data={data}
            onChange={applyPatch}
            errors={errors}
            onVinDecode={handleVinDecode}
            vinBusy={wizard.vinBusy}
          />
        )}
        {currentStep === 3 && <CompressedWizardStepDeal data={data} onChange={applyPatch} errors={errors} />}
        {currentStep === 4 && <CompressedWizardStepReview data={data} onChange={applyPatch} />}

        {errors.legal ? (
          <p className="mt-4 text-sm text-rose-300" role="alert">
            {errors.legal}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentStep === 0 || busy}
          className="min-h-[44px] min-w-[44px] rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40"
        >
          Atrás
        </button>
        <div className="flex gap-2">
          {currentStep < STEP_COUNT - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={busy}
              data-testid="cw-next"
              className="min-h-[44px] rounded-xl bg-violet-600 px-6 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={busy}
              data-testid="cw-submit"
              className="min-h-[44px] rounded-xl bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {busy ? "Enviando…" : "Crear y evaluar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
