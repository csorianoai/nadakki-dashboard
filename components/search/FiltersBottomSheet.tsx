"use client";

import { FilterPanel } from "@/components/search/FilterPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { clearAllFilters } from "@/lib/search-filters";
import type { FilterState } from "@/lib/search-types";

export function FiltersBottomSheet({
  open,
  onOpenChange,
  state,
  onChange,
  resultCount,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
  onApply: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showClose={false} className="p-0">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-nk-border" aria-hidden />
        <SheetHeader className="border-b border-nk-border px-4 pb-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>Filtros</SheetTitle>
            <button
              type="button"
              onClick={() => onChange(clearAllFilters(state))}
              className="text-sm font-semibold text-brand hover:underline"
            >
              Limpiar todo
            </button>
          </div>
        </SheetHeader>

        <div className="max-h-[calc(88vh-140px)] overflow-y-auto px-2 py-3">
          <FilterPanel
            state={state}
            onChange={onChange}
            className="static max-h-none max-w-none border-0 bg-transparent p-2 shadow-none"
          />
        </div>

        <SheetFooter className="border-t border-nk-border bg-nk-surface p-4">
          <Button
            variant="brand"
            className="w-full"
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
          >
            Aplicar ({resultCount} vehículos)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
