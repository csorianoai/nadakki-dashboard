"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StepperWizardProps } from "@/lib/credit-hub/ch-types";

export function StepperWizard({ steps, currentIndex, className }: StepperWizardProps) {
  return (
    <nav aria-label="Progreso del formulario" className={cn("flex flex-wrap gap-2", className)}>
      {steps.map((step, index) => {
        const active = index === currentIndex;
        const complete = index < currentIndex;
        const content = (
          <>
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
              style={{
                background: active || complete ? "var(--ch-persona-primary)" : "var(--ch-surface-2)",
                color: active || complete ? "#fff" : "var(--ch-ink-3)",
              }}
            >
              {index + 1}
            </span>
            <span className="text-xs font-medium" style={{ color: active ? "var(--ch-ink)" : "var(--ch-ink-3)" }}>
              {step.label}
            </span>
          </>
        );

        const shellClass = cn(
          "inline-flex min-h-10 items-center gap-2 rounded-[var(--ch-r)] px-2 py-1",
          active ? "bg-[var(--ch-persona-primary-soft)]" : undefined
        );

        if (step.href && !active) {
          return (
            <Link key={step.id} href={step.href} className={shellClass} aria-current={active ? "step" : undefined}>
              {content}
            </Link>
          );
        }

        return (
          <div key={step.id} className={shellClass} aria-current={active ? "step" : undefined}>
            {content}
          </div>
        );
      })}
    </nav>
  );
}
