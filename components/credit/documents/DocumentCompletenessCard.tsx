"use client";

import type { DocumentCompleteness } from "@/lib/credit-api";

const KEYS = ["IDENTIDAD", "DOMICILIO", "INGRESOS"] as const;

export interface DocumentCompletenessCardProps {
  completeness: DocumentCompleteness | null;
}

export function DocumentCompletenessCard({
  completeness,
}: DocumentCompletenessCardProps) {
  if (!completeness) {
    return (
      <div className="max-h-[72px] rounded-lg border border-white/10 bg-white/5 animate-pulse h-14" />
    );
  }

  const missing = new Set(
    (completeness.missing_categories ?? []).map((c) => c.toUpperCase())
  );

  return (
    <div className="max-h-[72px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 flex flex-col justify-center gap-1">
      <div className="flex items-center gap-6">
        {KEYS.map((k) => {
          const ok = !missing.has(k);
          return (
            <div key={k} className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${ok ? "bg-emerald-500" : "bg-red-500"}`}
              />
              {k}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 m-0 truncate">
        {completeness.is_complete ? (
          <>✓ Expediente documental mínimo completo</>
        ) : (
          <>
            Falta:{" "}
            {(completeness.missing_categories ?? []).join(", ") || "documentación"}
          </>
        )}
      </p>
    </div>
  );
}
