"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

const STORAGE_KEY_PREFIX = "nadakki_ch_onboarding_done_v1";

interface OnboardingStep {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

interface WelcomeGuideProps {
  persona: "dealer" | "bank";
  userName?: string;
  institutionName?: string;
}

const DEALER_STEPS: OnboardingStep[] = [
  {
    title: "Crea tu primera solicitud",
    description: "Captura datos del solicitante, vehículo y consentimiento. El motor evaluará automáticamente con múltiples bancos.",
    action: { label: "Nueva solicitud", href: "/credit-hub/dealer/applications/new/applicant" },
  },
  {
    title: "Revisa ofertas de bancos",
    description: "Cuando los bancos respondan, verás sus ofertas lado a lado para comparar tasas, plazos y montos aprobados.",
  },
  {
    title: "Acepta la mejor oferta",
    description: "Selecciona la oferta más conveniente para tu cliente. Las ofertas no seleccionadas se descartarán automáticamente.",
  },
  {
    title: "Monitorea tu pipeline",
    description: "Desde el dashboard puedes seguir el estado de todas tus solicitudes, ver tu tasa de aprobación y métricas clave.",
  },
];

const BANK_STEPS: OnboardingStep[] = [
  {
    title: "Revisa la cola de decisiones",
    description: "Las solicitudes llegan priorizadas por score y SLA. Reclama una solicitud para comenzar tu análisis.",
    action: { label: "Ver cola", href: "/credit-hub/bank/applications" },
  },
  {
    title: "Evalúa riesgo crediticio",
    description: "Revisa el análisis del motor, factores de riesgo, documentos y evidencia antes de tomar tu decisión.",
  },
  {
    title: "Emite tu decisión",
    description: "Aprueba, rechaza o emite una contraoferta. El sistema valida cumplimiento Ley 172-13 antes de aprobar.",
  },
  {
    title: "Monitorea tu portafolio",
    description: "Desde Analytics puedes ver tendencias, distribución de riesgo, ranking de dealers y cohortes de aprobación.",
    action: { label: "Ver analytics", href: "/credit-hub/bank/analytics" },
  },
];

export function WelcomeGuide({ persona, userName, institutionName }: WelcomeGuideProps) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const storageKey = `${STORAGE_KEY_PREFIX}_${persona}`;
  const steps = persona === "dealer" ? DEALER_STEPS : BANK_STEPS;

  useEffect(() => {
    try {
      const done = localStorage.getItem(storageKey);
      if (!done) setVisible(true);
    } catch {
      // localStorage unavailable
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // noop
    }
  }, [storageKey]);

  if (!visible) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const greeting = userName?.trim() || institutionName || "equipo";
  const isDealer = persona === "dealer";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(28, 25, 23, 0.5)",
        backdropFilter: "blur(4px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Guía de bienvenida"
    >
      <div
        className="ch-card"
        style={{
          width: "min(460px, 90vw)",
          padding: 0,
          overflow: "hidden",
          boxShadow: "var(--ch-sh-3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            background: isDealer ? "var(--ch-dealer-accent-soft)" : "var(--ch-bank-accent-soft)",
            borderBottom: "1px solid var(--ch-line)",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="ch-icon-btn"
            style={{ position: "absolute", top: 12, right: 12 }}
            aria-label="Cerrar guía"
          >
            <X className="h-4 w-4" />
          </button>
          {currentStep === 0 ? (
            <>
              <h2 className="ch-serif" style={{ margin: 0, fontSize: 22, letterSpacing: "-0.01em" }}>
                Bienvenido, {greeting}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ch-text-2)" }}>
                {isDealer
                  ? "Tu portal de crédito vehicular. Aquí puedes enviar solicitudes a múltiples bancos y aceptar la mejor oferta."
                  : "Tu mesa de decisiones crediticias. Aquí recibes solicitudes, evalúas riesgo y emites decisiones."}
              </p>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ch-eyebrow">Paso {currentStep + 1} de {steps.length}</span>
            </div>
          )}
        </div>

        {/* Step content */}
        <div style={{ padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--ch-text)" }}>
            {step.title}
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ch-text-2)", lineHeight: 1.5 }}>
            {step.description}
          </p>
          {step.action && (
            <a
              href={step.action.href}
              onClick={dismiss}
              className="ch-btn ch-btn-persona ch-btn-sm"
              style={{ marginTop: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {step.action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Step indicators + nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px 16px",
            borderTop: "1px solid var(--ch-line)",
          }}
        >
          {/* Dots */}
          <div style={{ display: "flex", gap: 6 }}>
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                aria-label={`Paso ${i + 1}`}
                style={{
                  width: i === currentStep ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  background: i === currentStep ? "var(--ch-persona)" : i < currentStep ? "var(--ch-persona)" : "var(--ch-surface-3)",
                  opacity: i < currentStep ? 0.5 : 1,
                  transition: "all 0.2s var(--ch-ease)",
                }}
              />
            ))}
          </div>

          {/* Next / Finish */}
          <div style={{ display: "flex", gap: 8 }}>
            {currentStep > 0 && (
              <button
                type="button"
                className="ch-btn ch-btn-ghost ch-btn-sm"
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                Atrás
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                className="ch-btn ch-btn-persona ch-btn-sm"
                onClick={dismiss}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Comenzar
              </button>
            ) : (
              <button
                type="button"
                className="ch-btn ch-btn-secondary ch-btn-sm"
                onClick={() => setCurrentStep((s) => s + 1)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                Siguiente
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
