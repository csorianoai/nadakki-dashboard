"use client";

import { useEffect, useRef, useState } from "react";
import { Grid3x3, Heart, LayoutList, Map } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveSearchAlertModal } from "@/components/search/SaveSearchAlertModal";
import { buildGranularChips } from "@/lib/active-filter-chips";
import { clearAllFilters } from "@/lib/search-filters";
import {
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
  type FilterState,
  type SearchView,
} from "@/lib/search-types";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS: { id: SearchView; icon: typeof Grid3x3; label: string }[] = [
  { id: "grid", icon: Grid3x3, label: "Grid" },
  { id: "list", icon: LayoutList, label: "Lista" },
  { id: "map", icon: Map, label: "Mapa" },
];

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="chip inline-flex items-center gap-1.5 rounded-full border border-nk-border bg-nk-surface-2 px-3 py-1.5 text-[13px] text-nk-fg">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="chip-remove inline-flex h-5 w-5 items-center justify-center rounded-full border-0 bg-transparent p-0.5 text-nk-fg-muted transition duration-150 hover:bg-nk-danger/10 hover:text-nk-danger"
        aria-label={`Quitar filtro ${label}`}
      >
        ✕
      </button>
    </span>
  );
}

export function ActiveChipsBar({
  state,
  count,
  onChange,
  onViewChange,
  onSortChange,
  onPageSizeChange,
}: {
  state: FilterState;
  count: number;
  onChange: (next: FilterState) => void;
  onViewChange: (view: SearchView) => void;
  onSortChange: (sort: FilterState["sort"]) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const chips = buildGranularChips(state);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry!.isIntersecting),
      { threshold: 1, rootMargin: "-63px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />

      <div
        className={cn(
          "active-chips-bar sticky top-[63px] z-20 mb-4 border-b border-nk-border bg-nk-surface py-3 transition-shadow duration-200",
          isStuck && "shadow-nk-md",
        )}
      >
        <div className="active-chips-bar-row1 mb-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => onChange(chip.remove(state))}
            />
          ))}

          {chips.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange(clearAllFilters(state))}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Limpiar todo
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setAlertOpen(true)}
            className="save-search-btn ml-auto inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-manrope text-sm font-semibold text-[var(--on-brand)] transition hover:brightness-110"
          >
            <Heart className="h-4 w-4" aria-hidden />
            Guardar búsqueda
          </button>
        </div>

        <div className="active-chips-bar-row2 flex flex-wrap items-center gap-3 text-sm text-nk-fg-muted md:gap-4">
          <span className="font-semibold tabular-nums text-nk-fg">
            {count.toLocaleString("en-US")} vehículos
          </span>

          <span className="hidden text-nk-border sm:inline" aria-hidden>
            |
          </span>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Sort:</span>
            <Select value={state.sort} onValueChange={(v) => onSortChange(v as FilterState["sort"])}>
              <SelectTrigger className="h-9 min-w-[140px] border border-nk-border bg-nk-surface-2 px-2 shadow-none">
                <SelectValue placeholder="Más relevantes" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="hidden text-nk-border sm:inline" aria-hidden>
            |
          </span>

          <Select
            value={String(state.pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-9 w-[130px] border border-nk-border bg-nk-surface-2 px-2 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto inline-flex rounded-r-sm border border-nk-border bg-nk-surface p-0.5">
            {VIEW_OPTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onViewChange(id)}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[9px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                  state.view === id
                    ? "bg-brand-soft text-brand"
                    : "text-nk-fg-muted hover:bg-nk-surface-2",
                )}
                aria-label={label}
                aria-pressed={state.view === id}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <SaveSearchAlertModal open={alertOpen} onOpenChange={setAlertOpen} state={state} />
    </>
  );
}
