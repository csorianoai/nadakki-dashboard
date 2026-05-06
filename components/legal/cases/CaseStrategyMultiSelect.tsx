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
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-forgeInk-600">{m.strategy.multi_select_hint}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {strategies.map((s) => (
          <div key={s.strategy_id} className="relative">
            <label className="flex cursor-pointer gap-2 rounded-forge-md border border-forgeInk-200 p-2 has-[:checked]:border-forgeBrand-500 has-[:checked]:ring-1 has-[:checked]:ring-forgeBrand-400">
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
      <button
        type="button"
        disabled={busy || selectedIds.length === 0}
        className="rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeInk-50 hover:bg-forgeBrand-700 disabled:opacity-50"
        onClick={onSubmit}
      >
        {m.strategy.select_multiple.replace("{count}", String(selectedIds.length))}
      </button>
    </div>
  );
}
