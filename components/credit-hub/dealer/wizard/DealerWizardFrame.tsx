"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { StepperWizard } from "@/components/credit-hub/primitives";
import { useDealerWizard } from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { dealerWizardStepHref, DEALER_WIZARD_STEP_PATHS } from "@/components/forge/credit-hub/dealer/dealerWizardPaths";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { formatToastApplicationId, forgeToastLangFromLocale, forgeWizardToasts } from "@/utils/forge-toast-copy";
import { toast } from "@/components/forge";

const STEP_LABELS = ["Solicitante", "Co-firmante", "Vehículo", "Documentos", "Consentimiento"];

export function DealerWizardFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { tenantConfig } = useTenantConfig();
  const { stepIndex, goNext, goPrev, saveDraftToStorage, submitApplication, canAdvance, isSubmitting, submitError } = useDealerWizard();
  const [exitOpen, setExitOpen] = useState(false);

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 120px)", paddingBottom: 88 }}>
      <header style={{ borderBottom: "1px solid var(--ch-line)", padding: "12px 0 16px", marginBottom: 16 }}>
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
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 8, alignItems: "stretch" }}>
          <button type="button" className="ch-btn ch-btn-secondary flex-1 min-h-[48px]" onClick={goPrev} disabled={stepIndex === 0}>
            Anterior
          </button>
          <button type="button" className="ch-btn ch-btn-ghost min-h-[48px] shrink-0 px-3 text-xs" onClick={saveDraftToStorage}>
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
