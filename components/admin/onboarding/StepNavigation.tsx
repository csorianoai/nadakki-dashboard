"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTenantOnboarding } from "@/hooks/useTenantOnboarding";

export interface StepNavigationProps {
  step: number;
}

export function StepNavigation({ step }: StepNavigationProps) {
  const { goNext, goBack, saving } = useTenantOnboarding();
  const [pending, setPending] = useState(false);

  if (step >= 6) {
    return (
      <div className="mt-8 flex justify-start" data-testid="onboarding-step-nav">
        <button
          type="button"
          onClick={() => goBack(step)}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/10"
        >
          Atrás
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between" data-testid="onboarding-step-nav">
      <button
        type="button"
        onClick={() => goBack(step)}
        disabled={step <= 1 || pending}
        className="order-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:order-1"
      >
        Atrás
      </button>
      <button
        type="button"
        data-testid="onboarding-next"
        onClick={() => {
          setPending(true);
          void goNext(step).finally(() => setPending(false));
        }}
        disabled={pending || saving}
        className="order-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2"
      >
        {(pending || saving) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Siguiente
      </button>
    </div>
  );
}
