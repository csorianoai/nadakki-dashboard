"use client";

import { Grid3x3, LayoutList, Map, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type FilterState, type SearchView } from "@/lib/search-types";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS: { id: SearchView; icon: typeof Grid3x3; label: string }[] = [
  { id: "grid", icon: Grid3x3, label: "Grid" },
  { id: "list", icon: LayoutList, label: "Lista" },
  { id: "map", icon: Map, label: "Mapa" },
];

export function ResultsTopBar({
  state,
  count,
  refineValue,
  onRefineChange,
  onRefineSubmit,
  onViewChange,
  onSortChange,
}: {
  state: FilterState;
  count: number;
  refineValue: string;
  onRefineChange: (value: string) => void;
  onRefineSubmit: () => void;
  onViewChange: (view: SearchView) => void;
  onSortChange: (sort: FilterState["sort"]) => void;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div>
        <h1 className="font-manrope text-[clamp(22px,3vw,28px)] font-extrabold text-nk-fg">
          {count} vehículos
          {state.usePayment ? (
            <span className="text-base font-semibold text-nk-fg-muted">
              {" "}
              · compatibles con tu presupuesto
            </span>
          ) : null}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2">
          <Input
            value={refineValue}
            onChange={(e) => onRefineChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onRefineSubmit()}
            placeholder="Refinar búsqueda..."
            className="h-10"
            aria-label="Refinar búsqueda"
          />
          <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Búsqueda por voz">
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        <div className="inline-flex rounded-r-sm border border-nk-border bg-nk-surface p-0.5">
          {VIEW_OPTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-[9px] transition",
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

        <Select value={state.sort} onValueChange={(v) => onSortChange(v as FilterState["sort"])}>
          <SelectTrigger className="h-10 w-[min(200px,42vw)]">
            <SelectValue />
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
    </div>
  );
}
