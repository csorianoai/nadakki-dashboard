"use client";

import { useState } from "react";
import { Bell, ChevronRight, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { FilterCategoryModals } from "@/components/search/FilterCategoryModals";
import {
  FILTER_CATEGORIES,
  type FilterCategoryId,
} from "@/components/search/filter-categories";
import {
  clearCategoryFilters,
  getCategoryActiveSummary,
} from "@/components/search/filter-category-summary";
import { HoverTooltip } from "@/components/ui/HoverTooltip";
import { fmtRD } from "@/lib/format";
import { clearAllFilters } from "@/lib/search-filters";
import { AI_SIGNAL_OPTIONS, type AiSignal, type FilterState } from "@/lib/search-types";
import { cn } from "@/lib/utils";

const AI_SIGNAL_TOOLTIPS: Record<AiSignal, string> = {
  "precio-justo": "AI compara precio vs 100+ importaciones similares",
  match85: "Score compuesto de perfil + presupuesto + preferencias",
  historial: "Cross-check chasis DGII + registros oficiales",
  "sin-fraude": "Análisis AI de fotos + dealer reputation + patrones anómalos",
};

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const COMPACT_TOGGLE =
  "h-3.5 w-7 data-[state=checked]:bg-brand [&>span]:h-2.5 [&>span]:w-2.5 [&>span]:data-[state=checked]:translate-x-3.5";

export function FilterPanel({
  state,
  onChange,
  className,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  className?: string;
}) {
  const [openCategory, setOpenCategory] = useState<FilterCategoryId | null>(null);
  const [draft, setDraft] = useState<FilterState>(state);

  const patch = (partial: Partial<FilterState>) => onChange({ ...state, ...partial });

  const openModal = (id: FilterCategoryId) => {
    setDraft(state);
    setOpenCategory(id);
  };

  const applyModal = () => {
    onChange(draft);
    setOpenCategory(null);
  };

  const toggleAi = (signal: AiSignal) => {
    patch({ aiSignals: toggleInList(state.aiSignals, signal) });
  };

  return (
    <>
      <aside
        className={cn(
          "filter-sidebar-panel relative isolate z-40 sticky top-[82px] flex w-[264px] shrink-0 flex-col overflow-hidden rounded-r border border-nk-border bg-nk-surface py-3 shadow-nk-sm",
          className,
        )}
      >
        <header className="mb-2 flex items-center justify-between border-b border-nk-border px-3 pb-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden />
            <h2 className="font-manrope text-[15px] font-bold leading-none text-nk-fg">Filtros</h2>
          </div>
          <button
            type="button"
            onClick={() => onChange(clearAllFilters(state))}
            className="rounded-r-sm px-2 py-1 text-[12px] font-semibold text-brand hover:underline"
          >
            Limpiar todo
          </button>
        </header>

        <div className="filter-sidebar-scroll overflow-x-hidden">
          <div className="relative space-y-2 border-b border-nk-border px-3 pb-3">
            <h3 className="font-manrope text-xs font-bold text-brand">PaymentSearch</h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-nk-fg-muted">Puedo pagar hasta RD$/mes</span>
                <span className="font-bold tabular-nums text-brand">{fmtRD(state.maxMonthly)}</span>
              </div>
              <Slider
                min={12_000}
                max={80_000}
                step={1_000}
                value={[state.maxMonthly]}
                onValueChange={([v]) => patch({ maxMonthly: v ?? state.maxMonthly })}
                className="py-0.5"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-nk-fg-muted">Inicial disponible</span>
                <span className="font-bold tabular-nums text-brand">{fmtRD(state.initial)}</span>
              </div>
              <Slider
                min={0}
                max={1_500_000}
                step={25_000}
                value={[state.initial]}
                onValueChange={([v]) => patch({ initial: v ?? state.initial })}
                className="py-0.5"
              />
            </div>
            <label className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-medium text-nk-fg">Filtrar por presupuesto</span>
              <Toggle
                checked={state.usePayment}
                onCheckedChange={(usePayment) => patch({ usePayment })}
                aria-label="Filtrar por presupuesto"
                className={COMPACT_TOGGLE}
              />
            </label>
          </div>

          <nav className="space-y-0.5 py-1">
            {FILTER_CATEGORIES.map((cat) => {
              const active = getCategoryActiveSummary(state, cat.id);
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className={cn(active && "border-l-[3px] border-l-brand")}
                >
                  <button
                    type="button"
                    onClick={() => openModal(cat.id)}
                    className="group flex min-h-[36px] w-full flex-col items-stretch px-3 py-2 text-left transition duration-150 ease-out hover:bg-brand-soft"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon
                          className="h-4 w-4 shrink-0 text-nk-fg-muted transition duration-150 ease-out group-hover:text-brand"
                          aria-hidden
                        />
                        <span className="truncate text-[13.5px] font-medium leading-tight text-nk-fg">
                          {cat.label}
                        </span>
                      </span>
                      {active ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-brand"
                          aria-label="Filtro activo"
                        />
                      ) : (
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-nk-fg-subtle transition duration-150 ease-out group-hover:text-brand"
                          aria-hidden
                        />
                      )}
                    </span>
                  </button>
                  {active ? (
                    <div className="px-3 pb-1">
                      <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                        <span className="truncate">{active.label}</span>
                        <button
                          type="button"
                          onClick={() => onChange(clearCategoryFilters(state, cat.id))}
                          className="hover:text-nk-danger"
                          aria-label={`Quitar ${cat.label}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="border-l-4 border-l-brand bg-brand-soft/50 px-3 py-2.5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 animate-nkSparkle text-brand" aria-hidden />
              <h3 className="font-manrope text-xs font-bold text-brand">Señales AI de Nadakki</h3>
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--on-brand)]">
                Exclusivo
              </span>
            </div>
            {AI_SIGNAL_OPTIONS.map((signal) => (
              <HoverTooltip key={signal.id} text={AI_SIGNAL_TOOLTIPS[signal.id]} className="mb-1.5 block w-full">
                <label className="flex w-full cursor-help items-center justify-between gap-2 text-[12.5px] leading-tight">
                  <span className="text-nk-fg-muted">{signal.label}</span>
                  <Toggle
                    checked={state.aiSignals.includes(signal.id)}
                    onCheckedChange={() => toggleAi(signal.id)}
                    aria-label={signal.label}
                    className={COMPACT_TOGGLE}
                  />
                </label>
              </HoverTooltip>
            ))}
          </div>

          <div className="border-t border-nk-border px-3 pt-2.5">
            <button
              type="button"
              onClick={() =>
                toast.success("Alerta creada. Te avisamos cuando aparezca un vehículo compatible.")
              }
              className="flex w-full items-center justify-center gap-1.5 rounded-r border border-dashed border-brand bg-transparent px-3 py-2 text-[12.5px] font-semibold text-brand transition hover:bg-brand-soft"
            >
              <Bell className="h-3.5 w-3.5" aria-hidden />
              Crear alerta AI
            </button>
          </div>
        </div>
      </aside>

      <FilterCategoryModals
        openCategory={openCategory}
        draft={draft}
        onDraftChange={setDraft}
        onClose={() => setOpenCategory(null)}
        onApply={applyModal}
      />
    </>
  );
}
