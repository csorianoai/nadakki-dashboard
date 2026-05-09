"use client";

import React from "react";
import { useJurisdictions } from "@/hooks/legal/useJurisdictions";
import { JurisdictionStatusBadge } from "@/components/legal/JurisdictionStatusBadge";
import type { Jurisdiction } from "@/lib/legal/cases/legal-cases-api";

interface JurisdictionSelectorProps {
  tenantId: string | undefined;
  value?: string;
  onChange?: (code: string) => void;
}

export function JurisdictionSelector({ tenantId, value, onChange }: JurisdictionSelectorProps) {
  const { jurisdictions, isLoading, isError, error } = useJurisdictions(tenantId);

  if (isLoading) {
    return (
      <div data-testid="jurisdiction-loading" className="text-sm text-gray-400">
        Cargando jurisdicciones...
      </div>
    );
  }

  if (isError) {
    return (
      <div data-testid="jurisdiction-error" className="text-sm text-red-600">
        Error: {(error as Error)?.message ?? "Error desconocido"}
      </div>
    );
  }

  if ((jurisdictions ?? []).length === 0) {
    return (
      <div data-testid="jurisdiction-empty" className="text-sm text-gray-400">
        No hay jurisdicciones disponibles.
      </div>
    );
  }

  return (
    <div data-testid="jurisdiction-selector" className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Jurisdicción
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {(jurisdictions ?? []).map((j: Jurisdiction) => {
          const isSelected = value === j.code;
          return (
            <button
              key={j.code}
              type="button"
              onClick={() => onChange?.(j.code)}
              data-testid={`jurisdiction-option-${j.code}`}
              className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{j.name}</span>
                  <JurisdictionStatusBadge status={j.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {j.description} · v{j.version}
                </p>
              </div>
              <span className="text-xs uppercase text-gray-400 font-mono">{j.code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
