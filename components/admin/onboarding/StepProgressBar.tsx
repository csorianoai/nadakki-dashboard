"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasCreditCoreSelected } from "@/hooks/useTenantOnboarding";
import type { TenantOnboardingState } from "@/types/onboarding";

const LABELS = [
  "Básica",
  "Marca",
  "Cores",
  "Usuarios",
  "Bancos",
  "Revisión",
] as const;

export interface StepProgressBarProps {
  currentStep: number;
  state: TenantOnboardingState;
}

export function StepProgressBar({ currentStep, state }: StepProgressBarProps) {
  const credit = hasCreditCoreSelected(state);

  return (
    <nav aria-label="Progreso de pasos" className="mb-8 overflow-x-auto pb-1">
      <ol className="flex min-w-[min(100%,520px)] flex-wrap gap-2 sm:gap-3 md:flex-nowrap md:items-center" data-testid="onboarding-progress">
        {LABELS.map((label, index) => {
          const stepNum = index + 1;
          const isCredentials = stepNum === 5;
          const skipped = isCredentials && !credit;
          const active = currentStep === stepNum;
          const done = currentStep > stepNum;
          return (
            <li key={label} className="flex items-center gap-1 sm:gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors sm:h-10 sm:w-10",
                  skipped && "border-white/10 bg-white/5 text-gray-600 line-through decoration-white/30",
                  !skipped && done && "border-emerald-500/80 bg-emerald-500/20 text-emerald-200",
                  !skipped && active && "border-purple-400 bg-purple-500/25 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]",
                  !skipped && !done && !active && "border-white/15 bg-white/5 text-gray-500",
                )}
              >
                {skipped ? "—" : done ? <Check className="h-4 w-4" aria-hidden /> : stepNum}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium text-gray-400 sm:inline md:text-sm",
                  active && "text-gray-100",
                  skipped && "text-gray-600 line-through",
                )}
              >
                {label}
              </span>
              {stepNum < 6 && <span className="hidden text-gray-600 md:inline">·</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
