"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { emoji: "📸", label: "Analizando fotos...", duration: 20 },
  { emoji: "🔍", label: "Detectando marca y modelo...", duration: 20 },
  { emoji: "📝", label: "Generando descripción...", duration: 20 },
  { emoji: "💰", label: "Sugiriendo precio óptimo...", duration: 15 },
  { emoji: "🏷️", label: "Etiquetando features...", duration: 15 },
] as const;

const TOTAL_SECONDS = STEPS.reduce((s, step) => s + step.duration, 0);

export function AIAnalysisProgress({
  photoUrl,
  active,
  onComplete,
}: {
  photoUrl?: string;
  active: boolean;
  onComplete?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const t = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= TOTAL_SECONDS) {
          clearInterval(t);
          onComplete?.();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [active, onComplete]);

  const progress = Math.min(100, (elapsed / TOTAL_SECONDS) * 100);
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);

  let acc = 0;
  let currentStep = 0;
  for (let i = 0; i < STEPS.length; i++) {
    acc += STEPS[i]!.duration;
    if (elapsed < acc) {
      currentStep = i;
      break;
    }
    if (i === STEPS.length - 1) currentStep = i;
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="relative mx-auto mb-6 aspect-video max-w-md overflow-hidden rounded-r-sm border border-nk-border">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full bg-nk-surface-3" />
        )}
        <div className="absolute inset-0 bg-brand-2/20 backdrop-blur-[1px]" />
      </div>

      <ul className="mb-6 space-y-2 text-left">
        {STEPS.map((step, i) => (
          <li
            key={step.label}
            className={cn(
              "flex items-center gap-2 text-sm transition",
              i === currentStep ? "font-bold text-brand-2" : i < currentStep ? "text-nk-fg-muted" : "text-nk-fg-subtle",
            )}
          >
            <span>{step.emoji}</span>
            <span>{step.label}</span>
            {i === currentStep ? (
              <span className="ml-auto animate-pulse text-xs">…</span>
            ) : i < currentStep ? (
              <span className="ml-auto text-green-600">✓</span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="h-2 overflow-hidden rounded-full bg-nk-surface-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-2 to-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-nk-fg-muted">
        Aprox. {remaining} segundos restantes…
      </p>
    </div>
  );
}

export { TOTAL_SECONDS as AI_ANALYSIS_SECONDS };
