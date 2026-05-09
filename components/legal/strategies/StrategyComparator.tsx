"use client";

import React, { useState, useMemo } from "react";
import { useStrategyComparison } from "@/hooks/legal/useStrategyComparison";
import type { StrategyComparisonEntry } from "@/lib/legal/cases/legal-cases-api";

interface StrategyComparatorProps {
  tenantId: string | undefined;
  initialCaseIds?: string[];
}

function strengthColor(val: string): string {
  const n = parseFloat(val);
  if (Number.isNaN(n)) return "text-gray-500";
  if (n >= 0.7) return "text-green-600";
  if (n >= 0.4) return "text-yellow-600";
  return "text-red-600";
}

function strengthLabel(val: string): string {
  const n = parseFloat(val);
  if (Number.isNaN(n)) return val;
  return `${Math.round(n * 100)}%`;
}

export function StrategyComparator({ tenantId, initialCaseIds = [] }: StrategyComparatorProps) {
  const [caseIdInput, setCaseIdInput] = useState("");
  const [caseIds, setCaseIds] = useState<string[]>(initialCaseIds);

  const { comparisons, caseCount, strategyTypes, isLoading, isError, error } =
    useStrategyComparison(tenantId, caseIds);

  const handleAdd = () => {
    const trimmed = caseIdInput.trim();
    if (!trimmed || caseIds.includes(trimmed)) return;
    if (caseIds.length >= 5) return;
    setCaseIds([...caseIds, trimmed]);
    setCaseIdInput("");
  };

  const handleRemove = (id: string) => {
    setCaseIds(caseIds.filter((c) => c !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const allStrategyTypes = useMemo(() => strategyTypes ?? [], [strategyTypes]);

  return (
    <div data-testid="strategy-comparator" className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Comparador de Estrategias</h2>
        <p className="text-sm text-gray-500">
          Compare estrategias legales entre 2-5 expedientes.
        </p>
      </div>

      {/* Case ID input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="case-id-input" className="block text-sm font-medium text-gray-700 mb-1">
            ID del Expediente
          </label>
          <input
            id="case-id-input"
            data-testid="case-id-input"
            type="text"
            value={caseIdInput}
            onChange={(e) => setCaseIdInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: case-001"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled={caseIds.length >= 5}
          />
        </div>
        <button
          data-testid="add-case-btn"
          type="button"
          onClick={handleAdd}
          disabled={!caseIdInput.trim() || caseIds.length >= 5}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Agregar
        </button>
      </div>

      {/* Selected case chips */}
      {caseIds.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="case-chips">
          {caseIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {id}
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="ml-1 text-blue-600 hover:text-blue-900"
                aria-label={`Quitar ${id}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Status messages */}
      {caseIds.length < 2 && (
        <p className="text-sm text-gray-400" data-testid="min-cases-msg">
          Agregue al menos 2 expedientes para comparar.
        </p>
      )}

      {isLoading && caseIds.length >= 2 && (
        <div data-testid="loading-indicator" className="text-sm text-gray-500">
          Cargando comparación...
        </div>
      )}

      {isError && (
        <div data-testid="error-msg" className="text-sm text-red-600">
          Error: {(error as Error)?.message ?? "Error desconocido"}
        </div>
      )}

      {/* Strategy types summary */}
      {allStrategyTypes.length > 0 && (
        <div className="text-xs text-gray-500">
          Tipos de estrategia encontrados: {allStrategyTypes.join(", ")} ({caseCount} expedientes)
        </div>
      )}

      {/* Comparison columns */}
      {(comparisons ?? []).length > 0 && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${comparisons.length}, minmax(0, 1fr))` }}
          data-testid="comparison-grid"
        >
          {(comparisons ?? []).map((comp: StrategyComparisonEntry) => (
            <div key={comp.case_id} className="rounded-lg border p-4 space-y-3">
              <div>
                <h3 className="font-medium text-sm truncate" title={comp.case_title ?? comp.case_id}>
                  {comp.case_title ?? comp.case_id}
                </h3>
                <p className="text-xs text-gray-400">
                  {comp.case_type ?? "—"} · {comp.state ?? "—"}
                </p>
              </div>

              {comp.error && (
                <p className="text-xs text-red-500" data-testid={`error-${comp.case_id}`}>
                  {comp.error}
                </p>
              )}

              {(comp.strategies ?? []).length === 0 && !comp.error && (
                <p className="text-xs text-gray-400">Sin estrategias</p>
              )}

              {(comp.strategies ?? []).map((s) => (
                <div
                  key={s.strategy_id}
                  className={`rounded border p-2 text-xs space-y-1 ${
                    s.selected ? "border-green-400 bg-green-50" : "border-gray-200"
                  }`}
                  data-testid={`strategy-card-${s.strategy_id}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{s.title || s.strategy_type}</span>
                    {s.selected && (
                      <span className="text-green-700 text-[10px] font-semibold uppercase">
                        Seleccionada
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-gray-500">
                    <span className={strengthColor(s.expected_strength)}>
                      Fuerza: {strengthLabel(s.expected_strength)}
                    </span>
                    <span>Duración: {s.expected_duration_days ?? 0}d</span>
                  </div>
                  {(s.risks ?? []).length > 0 && (
                    <div className="text-gray-400">
                      Riesgos: {(s.risks ?? []).join(", ")}
                    </div>
                  )}
                </div>
              ))}

              <div className="text-xs text-gray-400 pt-1 border-t">
                {comp.strategy_count ?? 0} estrategia(s)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
