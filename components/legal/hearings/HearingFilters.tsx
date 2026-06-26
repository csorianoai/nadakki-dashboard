"use client";

import type { HearingListFilters } from "@/lib/legal/hearings/hearings-types";
import { humanizeToken } from "@/lib/legal/hearings/hearings-format";

/**
 * Filter bar. Param names match the OpenAPI exactly: from, to, case_id, status,
 * hearing_type. Enum option values come from /config (statuses / hearing_types),
 * never hardcoded.
 */
type Props = {
  filters: HearingListFilters;
  statuses: string[];
  hearingTypes: string[];
  onChange: (next: HearingListFilters) => void;
  disabled?: boolean;
};

const inputCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

export function HearingFilters({ filters, statuses, hearingTypes, onChange, disabled }: Props) {
  const set = (patch: Partial<HearingListFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-800/70 bg-zinc-900/30 p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Desde
        <input
          type="date"
          className={inputCls}
          value={filters.from ?? ""}
          disabled={disabled}
          aria-label="Filtrar desde"
          onChange={(e) => set({ from: e.target.value || undefined })}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Hasta
        <input
          type="date"
          className={inputCls}
          value={filters.to ?? ""}
          disabled={disabled}
          aria-label="Filtrar hasta"
          onChange={(e) => set({ to: e.target.value || undefined })}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Estado
        <select
          className={inputCls}
          value={filters.status ?? ""}
          disabled={disabled}
          aria-label="Filtrar por estado"
          onChange={(e) => set({ status: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {humanizeToken(s)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Tipo
        <select
          className={inputCls}
          value={filters.hearing_type ?? ""}
          disabled={disabled}
          aria-label="Filtrar por tipo"
          onChange={(e) => set({ hearing_type: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          {hearingTypes.map((t) => (
            <option key={t} value={t}>
              {humanizeToken(t)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Expediente (case_id)
        <input
          type="text"
          className={inputCls}
          value={filters.case_id ?? ""}
          disabled={disabled}
          placeholder="ID de expediente"
          aria-label="Filtrar por expediente"
          onChange={(e) => set({ case_id: e.target.value || undefined })}
        />
      </label>
    </div>
  );
}
