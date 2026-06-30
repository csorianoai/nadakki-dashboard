"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAT_STAGES = [
  "Consultando base normativa…",
  "Recuperando fuentes RAG…",
  "Generando análisis legal… (puede tardar hasta 2 minutos)",
] as const;

const DEFAULT_STAGES = ["Analizando con base normativa…"] as const;

type Props = {
  isChatAgent: boolean;
  className?: string;
};

export function LoadingStages({ isChatAgent, className }: Props) {
  const stages = isChatAgent ? CHAT_STAGES : DEFAULT_STAGES;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    setStageIndex(0);
    if (stages.length <= 1) return;
    const t = window.setInterval(() => {
      setStageIndex((i) => (i + 1) % stages.length);
    }, 8000);
    return () => window.clearInterval(t);
  }, [stages.length]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-[var(--legal-border)] bg-[var(--legal-surface-1)] px-4 py-4",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[var(--legal-accent)]" aria-hidden />
      <div>
        <p className="text-sm font-medium text-zinc-100">{stages[stageIndex]}</p>
        <ul className="mt-2 space-y-1 text-xs text-[var(--legal-text-secondary)]">
          {stages.map((s, i) => (
            <li key={s} className={cn(i === stageIndex && "text-[var(--legal-accent)]")}>
              {i <= stageIndex ? "●" : "○"} {s.replace("…", "")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
