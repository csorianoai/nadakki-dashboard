"use client";

import { Input } from "@/components/forge";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusOptions?: { value: string; label: string }[];
  selectedStatuses?: string[];
  onToggleStatus?: (status: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (v: string) => void;
  onDateToChange?: (v: string) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  statusOptions,
  selectedStatuses = [],
  onToggleStatus,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="min-w-[200px] flex-1">
        <Input
          label="Buscar"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Número, contratista…"
        />
      </div>
      {onDateFromChange ? (
        <Input label="Desde" type="date" value={dateFrom ?? ""} onChange={(e) => onDateFromChange(e.target.value)} />
      ) : null}
      {onDateToChange ? (
        <Input label="Hasta" type="date" value={dateTo ?? ""} onChange={(e) => onDateToChange(e.target.value)} />
      ) : null}
      {statusOptions?.length && onToggleStatus ? (
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-[10px] font-bold uppercase tracking-wider text-zinc-500">Estado</span>
          {statusOptions.map((opt) => {
            const active = selectedStatuses.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggleStatus(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-amber-400/50 bg-amber-500/20 text-amber-100"
                    : "border-white/10 text-zinc-400 hover:border-white/20"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
