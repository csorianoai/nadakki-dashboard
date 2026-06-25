"use client";

import type { GoldenPathStep } from "@/lib/legal-cockpit/types";

const S = {
  done: {
    ring: "border-emerald-800/50 bg-emerald-950/30",
    num: "bg-emerald-900 text-emerald-300",
    text: "text-zinc-500",
    badge: "bg-emerald-950/50 text-emerald-500 border-emerald-800/40",
  },
  active: {
    ring: "border-violet-700/50 bg-violet-950/20",
    num: "bg-violet-900 text-violet-200",
    text: "text-white font-medium",
    badge: "bg-violet-950/50 text-violet-400 border-violet-800/40",
  },
  pending: {
    ring: "border-zinc-800/40 bg-zinc-900/40",
    num: "bg-zinc-800 text-zinc-500",
    text: "text-zinc-500",
    badge: "bg-zinc-800/50 text-zinc-600 border-zinc-700/40",
  },
  blocked: {
    ring: "border-red-900/40 bg-red-950/10",
    num: "bg-red-950 text-red-500",
    text: "text-red-500",
    badge: "bg-red-950/40 text-red-500 border-red-900/40",
  },
};
const L = {
  done: "listo",
  active: "en curso",
  pending: "pendiente",
  blocked: "bloqueado",
};

interface Props {
  steps: GoldenPathStep[];
  onStep: (href: string) => void;
}

export function LegalGoldenPath({ steps, onStep }: Props) {
  const done = steps.filter((s) => s.status === "done").length;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-violet-500 text-sm">&#x2B21;</span>
          <span className="text-sm font-medium text-white">
            Golden Path del expediente
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">
          {done}/{steps.length} completados
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {steps.map((step) => {
          const s = S[step.status];
          return (
            <button
              key={step.key}
              onClick={() => onStep(step.action)}
              className={`flex items-center gap-3 p-2.5 rounded-lg border ${s.ring}
                         transition-all text-left hover:opacity-80 w-full`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center
                           text-[11px] font-medium flex-shrink-0 ${s.num}`}
              >
                {step.status === "done" ? "\u2713" : step.step}
              </span>
              <span className={`flex-1 text-sm ${s.text}`}>{step.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded border flex-shrink-0 ${s.badge}`}
              >
                {L[step.status]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
