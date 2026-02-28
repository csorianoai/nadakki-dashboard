"use client";

import type { ObsEvent } from "@/hooks/observability";

interface LogStreamProps {
  events: ObsEvent[];
  maxLines?: number;
}

export function LogStream({ events, maxLines = 200 }: LogStreamProps) {
  const display = events.slice(-maxLines);

  if (display.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Log Stream</h3>
        <p className="text-sm text-slate-500">No logs yet. Start a run to see live logs.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">
        Log Stream
        <span className="ml-2 text-slate-500 font-normal">(last {display.length} lines)</span>
      </h3>
      <pre className="text-xs font-mono text-slate-300 bg-slate-950 rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
        {display.map((e, i) => (
          <div key={i} className="mb-1">
            [{e.ts ?? ""}] {e.type}: {e.message ?? JSON.stringify(e.data ?? {})}
          </div>
        ))}
      </pre>
    </div>
  );
}

