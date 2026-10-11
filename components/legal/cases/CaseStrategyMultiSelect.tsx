"use client";

import type { CaseStrategy } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseStrategyCard } from "@/components/legal/cases/CaseStrategyCard";

export function CaseStrategyMultiSelect({
  strategies,
  selectedIds,
  onChange,
  onSubmit,
  busy,
}: {
  strategies: CaseStrategy[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onSubmit: () => void;
  busy?: boolean;
}) {
  const m = useLegalCasesMessages();
  // L2b: el backend aplica una sola estrategia (StrategySelectRequest.strategy_id).
  // Se aplica la primera seleccionada y se dice cuál; nada se descarta en silencio.
  const aplicada =
    selectedIds.length > 1 ? strategies.find((s) => s.strategy_id === selectedIds[0]) : undefined;
  // El tipo del panel usa `name`; el backend hoy devuelve `title` (strategy_engine.py).
  const nombreAplicada =
    aplicada?.name ?? (aplicada as { title?: string } | undefined)?.title ?? selectedIds[0];
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-forgeGray-600">{m.strategy.multi_select_hint}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {strategies.map((s) => (
          <div key={s.strategy_id} className="relative">
            <label className="flex cursor-pointer gap-2 rounded-forge-md border border-forgeGray-200 p-2 has-[:checked]:border-forgeBrand-500 has-[:checked]:ring-1 has-[:checked]:ring-forgeBrand-400">
              <input
                type="checkbox"
                className="mt-1"
                checked={selectedIds.includes(s.strategy_id)}
                onChange={() => toggle(s.strategy_id)}
              />
              <CaseStrategyCard strategy={s} />
            </label>
          </div>
        ))}
      </div>
      {selectedIds.length > 1 ? (
        <p role="status" data-testid="strategy-single-notice" className="rounded-forge-sm border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Por ahora se aplica una sola estrategia: «{nombreAplicada}». Las demás
          seleccionadas no se guardarán.
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy || selectedIds.length === 0}
        className="rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeGray-50 hover:bg-forgeBrand-700 disabled:opacity-50"
        onClick={onSubmit}
      >
        {m.strategy.select_multiple.replace("{count}", String(selectedIds.length))}
      </button>
    </div>
  );
}
