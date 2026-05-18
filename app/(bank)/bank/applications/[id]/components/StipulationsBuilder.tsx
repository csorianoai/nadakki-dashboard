"use client";

import { useMemo } from "react";
import type { DecideStipulation } from "@/lib/bank-decision/types";

export interface StipulationsBuilderProps {
  value: DecideStipulation[];
  onChange: (rows: DecideStipulation[]) => void;
  disabled?: boolean;
}

export function StipulationsBuilder({ value, onChange, disabled }: StipulationsBuilderProps) {
  const rows = useMemo(() => (value.length ? value : [{ description: "", status: "open" }]), [value]);

  return (
    <fieldset className="space-y-2">
      <legend className="text-forge-sm font-semibold text-forgeGray-900">Estipulaciones (opcional)</legend>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={row.id ?? `row-${i}`} className="flex flex-wrap gap-2">
            <input
              type="text"
              disabled={disabled}
              className="min-w-[12rem] flex-1 rounded-lg border border-forgeGray-300 px-3 py-2 text-forge-sm"
              placeholder="Descripción"
              value={row.description}
              aria-label={`Estipulación ${i + 1}`}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], description: e.target.value };
                onChange(next);
              }}
            />
            <button
              type="button"
              disabled={disabled}
              className="rounded-lg border border-forgeGray-300 px-3 py-2 text-forge-xs text-forgeGray-700 hover:bg-forgeGray-50"
              onClick={() => {
                const next = rows.filter((_, j) => j !== i);
                onChange(next.length ? next : [{ description: "", status: "open" }]);
              }}
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={disabled}
          className="text-forge-sm font-medium text-forgeBrand-700 underline-offset-4 hover:underline"
          onClick={() => onChange([...rows, { description: "", status: "open" }])}
        >
          + Añadir estipulación
        </button>
      </div>
    </fieldset>
  );
}
