"use client";

import { Loader2 } from "lucide-react";

export interface MetricsRefreshIndicatorProps {
  /** ms since epoch from SWR `dataUpdatedAt` */
  dataUpdatedAt: number;
  isValidating: boolean;
  refreshIntervalMs?: number;
  error?: Error | boolean | null;
  className?: string;
}

function formatAgo(ts: number): string {
  if (!ts) return "—";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "ahora";
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  return `hace ${m} min`;
}

export function MetricsRefreshIndicator({
  dataUpdatedAt,
  isValidating,
  refreshIntervalMs = 30_000,
  error,
  className = "",
}: MetricsRefreshIndicatorProps) {
  const hasErr = Boolean(error);

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-400 ${className}`}
      data-testid="metrics-refresh-indicator"
    >
      <span className="inline-flex items-center gap-1.5">
        {isValidating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" aria-hidden />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
        )}
        <span>
          Métricas: actualizado {formatAgo(dataUpdatedAt)}
          {isValidating ? " · sincronizando" : ""}
        </span>
      </span>
      <span className="text-gray-600">·</span>
      <span>polling {Math.round(refreshIntervalMs / 1000)}s</span>
      {hasErr ? <span className="text-amber-300/90">· error de red</span> : null}
    </div>
  );
}
