"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepperWizardProps, StepperWizardStep } from "@/lib/credit-hub/ch-types";

function normalizeSteps(steps: StepperWizardProps["steps"]): StepperWizardStep[] {
  if (!steps?.length) {
    return [
      { label: "Datos personales" },
      { label: "Ingresos" },
      { label: "Buró" },
      { label: "Decisión" },
    ];
  }
  return steps.map((s, i) => (typeof s === "string" ? { id: String(i), label: s } : s));
}

export function StepperWizard({
  steps,
  current,
  currentIndex,
  errorStep = null,
  onStep,
  className,
}: StepperWizardProps) {
  const data = normalizeSteps(steps);
  const cur = current ?? currentIndex ?? 1;

  return (
    <div className={cn(className)} style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
      {data.map((step, i) => {
        const done = i < cur;
        const active = i === cur;
        const err = i === errorStep;
        const last = i === data.length - 1;

        return (
          <div key={step.id ?? i} style={{ display: "flex", alignItems: "center", flex: last ? "0 0 auto" : "1 1 0" }}>
            <button
              type="button"
              onClick={() => onStep?.(i)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 7,
                background: "none",
                border: "none",
                cursor: onStep ? "pointer" : "default",
                fontFamily: "inherit",
                padding: "0 4px",
                minWidth: 72,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "2px solid",
                  borderColor: err ? "var(--ch-danger)" : done || active ? "var(--ch-persona)" : "var(--ch-line-2)",
                  background: done ? "var(--ch-persona)" : active ? "var(--ch-persona-soft)" : "var(--ch-surface)",
                  color: done ? "#fff" : active ? "var(--ch-persona-text)" : "var(--ch-text-3)",
                  transition: "all 0.15s",
                }}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  color: err ? "var(--ch-danger)" : active ? "var(--ch-text)" : "var(--ch-text-3)",
                  textAlign: "center",
                  lineHeight: 1.3,
                  maxWidth: 80,
                }}
              >
                {step.label}
              </span>
            </button>
            {!last ? (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: done ? "var(--ch-persona)" : "var(--ch-line-2)",
                  margin: "0 2px",
                  marginBottom: 22,
                  borderRadius: 1,
                  minWidth: 16,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
