"use client";

import type { BankDecisionType } from "@/lib/bank-decision/types";
import { reasonCodesForDecisionType } from "@/lib/bank-decision/reason-codes";

export interface ReasonCodesSelectProps {
  decisionType: BankDecisionType | null;
  value: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
}

export function ReasonCodesSelect({ decisionType, value, onChange, disabled }: ReasonCodesSelectProps) {
  const opts = decisionType ? [...reasonCodesForDecisionType(decisionType)] : [];
  const toggle = (code: string) => {
    const set = new Set(value);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    onChange([...set]);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-forge-sm font-semibold text-forgeGray-900">Razones (códigos)</legend>
      {!decisionType ? (
        <p className="text-forge-sm text-forgeGray-600">Elige un tipo de decisión primero.</p>
      ) : (
        <ul className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-forgeGray-200 p-3" role="group">
          {opts.map((code) => (
            <li key={code} className="flex items-start gap-2">
              <input
                id={`rc-${code}`}
                type="checkbox"
                checked={value.includes(code)}
                disabled={disabled}
                className="mt-1 h-4 w-4 rounded border-forgeGray-300"
                onChange={() => toggle(code)}
              />
              <label htmlFor={`rc-${code}`} className="cursor-pointer font-forgeMono text-forge-xs text-forgeGray-800">
                {code}
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
