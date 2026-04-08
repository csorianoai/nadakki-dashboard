"use client";

export interface SimilarCasesPanelProps {
  cases: Record<string, unknown>[] | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function SimilarCasesPanel({
  cases,
  loading,
  error,
  className = "",
}: SimilarCasesPanelProps) {
  if (loading) {
    return (
      <div
        className={`animate-pulse h-36 rounded-xl bg-white/5 ${className}`}
      />
    );
  }
  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 ${className}`}
      >
        {error}
      </div>
    );
  }
  if (!cases?.length) {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-500 text-center ${className}`}
      >
        Sin casos similares todavía
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 ${className}`}
    >
      <h3 className="text-sm font-medium text-slate-200">Casos similares</h3>
      <ul className="space-y-2 max-h-56 overflow-y-auto">
        {cases.map((c, i) => (
          <li
            key={String(c.application_id ?? i)}
            className="text-xs border border-white/5 rounded-lg p-2"
          >
            <span className="text-slate-400">ID </span>
            <span className="font-mono text-slate-200">
              {String(c.application_id ?? "—")}
            </span>
            {c.distance != null && (
              <span className="text-slate-500 ml-2">
                dist. {String(c.distance)}
              </span>
            )}
            {c.outcome != null && typeof c.outcome === "object" && (
              <pre className="mt-1 text-[10px] text-slate-500 overflow-x-auto">
                {JSON.stringify(c.outcome, null, 0)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
