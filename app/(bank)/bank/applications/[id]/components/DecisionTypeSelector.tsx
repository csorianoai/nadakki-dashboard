"use client";

import type { BankDecisionType } from "@/lib/bank-decision/types";

export interface DecisionTypeSelectorProps {
  value: BankDecisionType | null;
  onChange: (next: BankDecisionType) => void;
  disabled?: boolean;
}

export function DecisionTypeSelector({ value, onChange, disabled }: DecisionTypeSelectorProps) {
  const opts: BankDecisionType[] = ["APPROVE", "REJECT", "COUNTER"];
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-forge-sm font-semibold text-forgeGray-900">Tipo de decisión</legend>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Tipo de decisión">
        {opts.map((t) => {
          const sel = value === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={sel}
              disabled={disabled}
              onClick={() => onChange(t)}
              className={`min-h-11 rounded-lg border px-4 py-2 text-forge-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 disabled:opacity-50 ${
                sel
                  ? "border-forgeBrand-600 bg-forgeBrand-50 text-forgeBrand-900"
                  : "border-forgeGray-300 bg-white text-forgeGray-900 hover:bg-forgeGray-50"
              }`}
            >
              {t === "APPROVE" ? "Aprobar" : t === "REJECT" ? "Rechazar" : "Contraoferta"}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
