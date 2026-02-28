"use client";

import type { ObsEvent } from "@/hooks/observability";

const MEANINGFUL_TYPES = new Set([
  "step",
  "tool_call",
  "tool_result",
  "output_final",
  "done",
  "error",
  "run.started",
  "run.canceled",
  "run.failed",
  "run.timeout",
  "stream.end",
]);

function typeColor(type: string): string {
  if (type.includes("error") || type.includes("failed") || type.includes("canceled")) return "text-red-400";
  if (type === "done" || type === "stream.end") return "text-green-400";
  if (type === "run.started") return "text-cyan-400";
  if (type === "tool_call") return "text-amber-400";
  if (type === "tool_result") return "text-emerald-400";
  if (type === "output_final") return "text-purple-400";
  return "text-slate-400";
}

interface TimelineProps {
  events: ObsEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const filtered = events.filter((e) => MEANINGFUL_TYPES.has(e.type));

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Timeline</h3>
        <p className="text-sm text-slate-500">No events yet. Start a run to see timeline.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Timeline</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filtered.map((e, i) => (
          <div
            key={i}
            className="flex gap-2 items-start text-xs border-l-2 border-slate-600 pl-2 py-1"
          >
            <span className="text-slate-500 shrink-0">{e.ts ?? ""}</span>
            <span className={`shrink-0 font-medium ${typeColor(e.type)}`}>{e.type}</span>
            {e.message && <span className="text-slate-300 truncate">{e.message}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

