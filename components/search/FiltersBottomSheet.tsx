"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { FilterCategoryModals } from "@/components/search/FilterCategoryModals";
import { FILTER_CATEGORIES, type FilterCategoryId } from "@/components/search/filter-categories";
import { getCategoryActiveSummary } from "@/components/search/filter-category-summary";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { countResults } from "@/lib/search-facet-counts";
import { clearAllFilters } from "@/lib/search-filters";
import type { FilterState } from "@/lib/search-types";
import { fmtRD } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FiltersBottomSheet({
  open,
  onOpenChange,
  state,
  onChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: FilterState;
  onChange: (next: FilterState) => void;
  onApply: () => void;
}) {
  const [openCategory, setOpenCategory] = useState<FilterCategoryId | null>(null);
  const [draft, setDraft] = useState<FilterState>(state);
  const resultCount = countResults(state);

  const openModal = (id: FilterCategoryId) => {
    setDraft(state);
    setOpenCategory(id);
  };

  return (
    <>
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

          <div className="max-h-[calc(88vh-140px)] overflow-y-auto">
            <div className="space-y-3 border-b border-nk-border p-4">
              <h3 className="font-manrope text-sm font-bold text-brand">PaymentSearch</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-nk-fg-muted">Puedo pagar hasta RD$/mes</span>
                  <span className="font-bold tabular-nums text-brand">{fmtRD(state.maxMonthly)}</span>
                </div>
                <Slider
                  min={12_000}
                  max={80_000}
                  step={1_000}
                  value={[state.maxMonthly]}
                  onValueChange={([v]) => onChange({ ...state, maxMonthly: v ?? state.maxMonthly })}
                />
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-nk-fg">Filtrar por presupuesto</span>
                <Toggle
                  checked={state.usePayment}
                  onCheckedChange={(usePayment) => onChange({ ...state, usePayment })}
                />
              </label>
            </div>

            <nav className="divide-y divide-nk-border">
              {FILTER_CATEGORIES.map((cat) => {
                const active = getCategoryActiveSummary(state, cat.id);
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => openModal(cat.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-nk-surface-2",
                      active && "border-l-[3px] border-l-brand",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-nk-fg-muted" />
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-medium text-nk-fg">{cat.label}</span>
                        {active ? (
                          <span className="mt-0.5 block truncate text-xs text-brand">{active.label}</span>
                        ) : null}
                      </span>
                    </span>
                    {active ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Filtro activo" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-nk-fg-subtle" />
                    )}
                  </button>
                );
              })}
            </nav>
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
              Aplicar ({resultCount.toLocaleString("en-US")} vehículos)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FilterCategoryModals
        openCategory={openCategory}
        draft={draft}
        onDraftChange={setDraft}
        onClose={() => setOpenCategory(null)}
        onApply={() => {
          onChange(draft);
          setOpenCategory(null);
        }}
      />
    </>
  );
}
