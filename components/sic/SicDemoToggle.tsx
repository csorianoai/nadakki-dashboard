"use client";

import { useDemo } from "@/contexts/DemoContext";

export function SicDemoToggle() {
  const { demoMode, setDemoMode } = useDemo();

  return (
    <button
      type="button"
      onClick={() => setDemoMode(!demoMode)}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        demoMode
          ? "bg-violet-600 text-white hover:bg-violet-500"
          : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
      }`}
    >
      Modo Demo: {demoMode ? "Activado" : "Desactivado"}
    </button>
  );
}

export function SicDemoBadge() {
  const { demoMode } = useDemo();
  if (!demoMode) return null;

  return (
    <span className="px-2 py-0.5 rounded border bg-violet-500/20 text-violet-300 border-violet-500/50 text-xs font-semibold">
      DEMO INSTITUCIONAL
    </span>
  );
}
