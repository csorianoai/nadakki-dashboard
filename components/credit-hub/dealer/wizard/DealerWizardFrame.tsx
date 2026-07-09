"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { StepperWizard } from "@/components/credit-hub/primitives";
import { useDealerWizard } from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { dealerWizardStepHref, DEALER_WIZARD_STEP_PATHS } from "@/components/forge/credit-hub/dealer/dealerWizardPaths";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { formatToastApplicationId, forgeToastLangFromLocale, forgeWizardToasts } from "@/utils/forge-toast-copy";
import { toast } from "@/components/forge";
import { WizardCompletenessBar } from "@/components/credit-hub/dealer/wizard/WizardCompletenessBar";
import { computeWizardCompleteness, missingFieldsHint } from "@/lib/credit-hub/dealer/wizard-completeness";
import { stepIsValid } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import {
  hasRequiredDocumentsFileReady,
  missingRequiredDocumentLabels,
  personalReferencesValid,
} from "@/lib/credit-hub/dealer/wizard-gates";
import { tenantDocumentKey } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

const STEP_LABELS = ["Solicitante", "Co-firmante", "Vehículo", "Documentos", "Consentimiento"];

export function DealerWizardFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { tenantConfig } = useTenantConfig();
  const t = useTranslations();
  const { stepIndex, goNext, goPrev, saveDraftToStorage, submitApplication, canAdvance, isSubmitting, submitError, formData, validationConfig, requiredDocumentsList } = useDealerWizard();
  const [exitOpen, setExitOpen] = useState(false);

  const completeness = useMemo(
    () => computeWizardCompleteness(formData, validationConfig, t),
    [formData, validationConfig, t],
  );
  const missing = useMemo(
    () => missingFieldsHint(formData, validationConfig, t),
    [formData, validationConfig, t],
  );

  /** On step 0, tell the user exactly which section(s) block advancement. */
  const step0BlockReason = useMemo(() => {
    if (stepIndex !== 0 || canAdvance) return null;
    const applicantOk = stepIsValid(0, formData, validationConfig, t);
    const employmentOk = stepIsValid(1, formData, validationConfig, t);
    if (!applicantOk && !employmentOk) return "Completa las secciones Solicitante y Empleo";
    if (!applicantOk) return "Completa la secci\u00f3n Solicitante";
    if (!employmentOk) return "Completa la secci\u00f3n Empleo (despl\u00e1zate hacia abajo)";
    return null;
  }, [stepIndex, canAdvance, formData, validationConfig, t]);

  const step3BlockReason = useMemo(() => {
    if (stepIndex !== 3 || canAdvance) return null;
    const docsOk = hasRequiredDocumentsFileReady(formData);
    const refsOk = personalReferencesValid(formData.personal_references);
    const missingDocs = missingRequiredDocumentLabels(formData, requiredDocumentsList, tenantDocumentKey);
    if (!docsOk && !refsOk) {
      return `Sube ${missingDocs.join(", ")} y completa 3 referencias personales`;
    }
    if (!docsOk) return `Sube los documentos obligatorios: ${missingDocs.join(", ")}`;
    if (!refsOk) return "Se requieren al menos 3 referencias personales completas";
    return null;
  }, [stepIndex, canAdvance, formData, requiredDocumentsList]);

  const blockReason = step0BlockReason ?? step3BlockReason;

  const handleSaveDraft = useCallback(() => {
    const ok = saveDraftToStorage();
    const lang = forgeToastLangFromLocale(tenantConfig.locale);
    const copy = forgeWizardToasts(lang);
    if (ok) {
      toast.success(copy.draftSaved, { duration: 2000 });
      return;
    }
    toast.warning(copy.draftSaveFailed, {
      id: "forge-dealer-manual-save-error",
      duration: 8000,
      action: {
        label: copy.retry,
        onClick: () => {
          if (saveDraftToStorage()) toast.success(copy.draftSaved, { duration: 2000 });
        },
      },
    });
  }, [saveDraftToStorage, tenantConfig.locale]);

  const scrollToFirstIncomplete = useCallback(() => {
    if (stepIndex !== 0) return;
    const applicantOk = stepIsValid(0, formData, validationConfig, t);
    const target = !applicantOk ? "section-applicant" : "section-employment";
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stepIndex, formData, validationConfig, t]);

  const handlePrimary = async () => {
    if (stepIndex < 4) {
      goNext();
      return;
    }
    try {
      const r = await submitApplication();
      const lang = forgeToastLangFromLocale(tenantConfig.locale);
      const copy = forgeWizardToasts(lang);
      toast.success(copy.requestSubmitted(formatToastApplicationId(r.application_id)), { duration: 4000 });
      router.push(`/credit-hub/dealer/applications/new/complete?id=${encodeURIComponent(r.application_id)}`);
    } catch {
      /* submitError surfaced below */
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 120px)", paddingBottom: 88 }} data-testid="dealer-wizard-frame">
      <header style={{ borderBottom: "1px solid var(--ch-line)", padding: "12px 0 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span className="ch-eyebrow" style={{ color: "var(--ch-dealer-accent-text)" }}>
            Motor de solicitud guiado
          </span>
          <DataTruthBadge level="REAL" />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
          <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" style={{ minHeight: 44 }} onClick={() => setExitOpen(true)}>
            ← Volver al panel
          </button>
          <Link href="/credit-hub/dealer/applications" className="ch-btn ch-btn-ghost ch-btn-sm" style={{ textDecoration: "none", minHeight: 44 }}>
            Mis solicitudes
          </Link>
        </div>
        <StepperWizard
          steps={STEP_LABELS.map((label, i) => ({ id: DEALER_WIZARD_STEP_PATHS[i], label }))}
          currentIndex={stepIndex}
          onStep={(i) => {
            if (i <= stepIndex) router.push(dealerWizardStepHref(DEALER_WIZARD_STEP_PATHS[i]!));
          }}
        />
      </header>

      <WizardCompletenessBar percent={completeness} />
      {missing.length > 0 && completeness < 100 ? (
        <p style={{ fontSize: 12, color: "var(--ch-text-3)", margin: "0 0 12px", lineHeight: 1.4 }}>
          Pendiente: {missing.join(" · ")}
        </p>
      ) : null}

      <main style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto" }}>{children}</main>

      {submitError ? (
        <p role="alert" style={{ fontSize: 13, color: "var(--ch-danger-text)", marginTop: 8 }}>
          {submitError}
        </p>
      ) : null}

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          borderTop: "1px solid var(--ch-line)",
          background: "var(--ch-surface)",
          padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
        }}
      >
        {blockReason ? (
          <button
            type="button"
            onClick={scrollToFirstIncomplete}
            style={{
              display: "block",
              width: "100%",
              maxWidth: 720,
              margin: "0 auto 6px",
              padding: "4px 8px",
              fontSize: 12,
              color: "var(--ch-warning-text, #d97706)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
            data-testid="wizard-scroll-to-missing"
          >
            {blockReason}
          </button>
        ) : null}
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 8, alignItems: "stretch" }}>
          <button type="button" className="ch-btn ch-btn-secondary flex-1 min-h-[48px]" onClick={goPrev} disabled={stepIndex === 0}>
            Anterior
          </button>
          <button type="button" className="ch-btn ch-btn-ghost min-h-[48px] shrink-0 px-3 text-xs" onClick={handleSaveDraft}>
            Guardar
          </button>
          {stepIndex < 4 ? (
            <button type="button" className="ch-btn ch-btn-persona flex-1 min-h-[48px]" onClick={goNext} disabled={!canAdvance}>
              Siguiente
            </button>
          ) : (
            <button type="button" className="ch-btn ch-btn-persona flex-1 min-h-[48px]" onClick={() => void handlePrimary()} disabled={!canAdvance || isSubmitting}>
              {isSubmitting ? "Enviando…" : "Enviar solicitud"}
            </button>
          )}
        </div>
      </div>

      {exitOpen ? (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="ch-card" style={{ maxWidth: 420, width: "100%", padding: 20 }}>
            <h2 className="ch-serif" style={{ margin: 0, fontSize: 18 }}>
              ¿Guardar borrador y salir?
            </h2>
            <p style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 10, lineHeight: 1.5 }}>
              Tu progreso se guarda en este dispositivo cada 10 segundos y al confirmar.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" className="ch-btn ch-btn-ghost" onClick={() => setExitOpen(false)}>
                Continuar
              </button>
              <button type="button" className="ch-btn ch-btn-secondary" onClick={() => router.push("/credit-hub/dealer")}>
                Salir sin guardar
              </button>
              <button
                type="button"
                className="ch-btn ch-btn-persona"
                onClick={() => {
                  saveDraftToStorage();
                  setExitOpen(false);
                  router.push("/credit-hub/dealer");
                }}
              >
                Guardar y salir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
