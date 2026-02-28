"use client";

import { Timeline } from "./Timeline";
import { LogStream } from "./LogStream";
import type { ObsEvent } from "@/hooks/observability";

interface ExecutionViewProps {
  events: ObsEvent[];
  currentStep: string | null;
  status: string | null;
}

export function ExecutionView({ events, currentStep, status }: ExecutionViewProps) {
  return (
    <div className="space-y-4">
      {(currentStep || status) && (
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
          <div className="flex gap-4 text-sm">
            {status && (
              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <span className="font-semibold text-slate-200">{status}</span>
              </div>
            )}
            {currentStep && (
              <div>
                <span className="text-slate-400">Step:</span>{" "}
                <span className="text-slate-200">{currentStep}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <Timeline events={events} />
      <LogStream events={events} maxLines={200} />
    </div>
  );
}

