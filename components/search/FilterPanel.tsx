"use client";

import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { FacetChip } from "@/components/search/FacetChip";
import { fmtRD } from "@/lib/format";
import {
  AI_SIGNAL_OPTIONS,
  BRAND_OPTIONS,
  CONDICION_OPTIONS,
  FEAT_OPTIONS,
  FUEL_OPTIONS,
  PROVINCE_OPTIONS,
  TRANS_OPTIONS,
  TYPE_OPTIONS,
  VENDEDOR_OPTIONS,
  YEAR_OPTIONS,
  type AiSignal,
  type FilterState,
} from "@/lib/search-types";
import { clearFilterSection } from "@/lib/search-filters";
import { cn } from "@/lib/utils";

function FilterSection({
  title,
  onClear,
  children,
}: {
  title: string;
  onClear?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">{title}</h3>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-brand hover:underline"
          >
            Limpiar
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function toggleInList<T extends string | number>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterPanel({
  state,
  onChange,
  className,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  className?: string;
}) {
  const patch = (partial: Partial<FilterState>) => onChange({ ...state, ...partial });

  const toggleAi = (signal: AiSignal) => {
    patch({
      aiSignals: toggleInList(state.aiSignals, signal),
    });
  };

  return (
    <aside
      className={cn(
        "sticky top-[82px] max-h-[calc(100vh-96px)] flex-[1_1_270px] max-w-[300px] overflow-y-auto rounded-r border border-nk-border bg-nk-surface p-4 shadow-nk-sm",
        className,
      )}
    >
      <div className="space-y-5">
        <div className="space-y-4 rounded-r border border-brand bg-brand-soft p-4">
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
              onValueChange={([v]) => patch({ maxMonthly: v ?? state.maxMonthly })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-nk-fg-muted">Inicial disponible</span>
              <span className="font-bold tabular-nums text-brand">{fmtRD(state.initial)}</span>
            </div>
            <Slider
              min={0}
              max={1_500_000}
              step={25_000}
              value={[state.initial]}
              onValueChange={([v]) => patch({ initial: v ?? state.initial })}
            />
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-nk-fg">Filtrar por presupuesto</span>
            <Toggle
              checked={state.usePayment}
              onCheckedChange={(usePayment) => patch({ usePayment })}
              aria-label="Filtrar por presupuesto"
            />
          </label>
        </div>

        <FilterSection
          title="Marca"
          onClear={
            state.brands.length
              ? () => onChange(clearFilterSection(state, "brands"))
              : undefined
          }
        >
          {BRAND_OPTIONS.map((brand) => (
            <FacetChip
              key={brand}
              label={brand}
              active={state.brands.includes(brand)}
              onClick={() => patch({ brands: toggleInList(state.brands, brand) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Tipo"
          onClear={
            state.types.length ? () => onChange(clearFilterSection(state, "types")) : undefined
          }
        >
          {TYPE_OPTIONS.map((type) => (
            <FacetChip
              key={type}
              label={type}
              active={state.types.includes(type)}
              onClick={() => patch({ types: toggleInList(state.types, type) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Provincia"
          onClear={
            state.provinces.length
              ? () => onChange(clearFilterSection(state, "provinces"))
              : undefined
          }
        >
          {PROVINCE_OPTIONS.map((province) => (
            <FacetChip
              key={province}
              label={province}
              active={state.provinces.includes(province)}
              onClick={() => patch({ provinces: toggleInList(state.provinces, province) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Año"
          onClear={
            state.years.length ? () => onChange(clearFilterSection(state, "years")) : undefined
          }
        >
          {YEAR_OPTIONS.map((year) => (
            <FacetChip
              key={year}
              label={String(year)}
              active={state.years.includes(year)}
              onClick={() => patch({ years: toggleInList(state.years, year) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Combustible"
          onClear={
            state.fuels.length ? () => onChange(clearFilterSection(state, "fuels")) : undefined
          }
        >
          {FUEL_OPTIONS.map((fuel) => (
            <FacetChip
              key={fuel}
              label={fuel}
              active={state.fuels.includes(fuel)}
              onClick={() => patch({ fuels: toggleInList(state.fuels, fuel) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Transmisión"
          onClear={
            state.trans.length ? () => onChange(clearFilterSection(state, "trans")) : undefined
          }
        >
          {TRANS_OPTIONS.map((trans) => (
            <FacetChip
              key={trans}
              label={trans}
              active={state.trans.includes(trans)}
              onClick={() => patch({ trans: toggleInList(state.trans, trans) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Condición"
          onClear={
            state.condicion.length
              ? () => onChange(clearFilterSection(state, "condicion"))
              : undefined
          }
        >
          {CONDICION_OPTIONS.map((cond) => (
            <FacetChip
              key={cond}
              label={cond}
              active={state.condicion.includes(cond)}
              onClick={() => patch({ condicion: toggleInList(state.condicion, cond) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Vendedor"
          onClear={
            state.vendedor.length
              ? () => onChange(clearFilterSection(state, "vendedor"))
              : undefined
          }
        >
          {VENDEDOR_OPTIONS.map((v) => (
            <FacetChip
              key={v}
              label={v}
              active={state.vendedor.includes(v)}
              onClick={() => patch({ vendedor: toggleInList(state.vendedor, v) })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Features"
          onClear={
            state.feats.length ? () => onChange(clearFilterSection(state, "feats")) : undefined
          }
        >
          {FEAT_OPTIONS.map((feat) => (
            <FacetChip
              key={feat}
              label={feat}
              active={state.feats.includes(feat)}
              onClick={() => patch({ feats: toggleInList(state.feats, feat) })}
            />
          ))}
        </FilterSection>

        <div className="space-y-3 rounded-r border border-brand bg-brand-soft/40 p-4">
          <h3 className="font-manrope text-sm font-bold text-brand">Señales AI de Nadakki</h3>
          {AI_SIGNAL_OPTIONS.map((signal) => (
            <label key={signal.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-nk-fg-muted">{signal.label}</span>
              <Toggle
                checked={state.aiSignals.includes(signal.id)}
                onCheckedChange={() => toggleAi(signal.id)}
                aria-label={signal.label}
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            toast.success("Alerta creada. Te avisamos cuando aparezca un vehículo compatible.")
          }
          className="flex w-full items-center justify-center gap-2 rounded-r border border-dashed border-brand bg-transparent px-3 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft"
        >
          <Bell className="h-4 w-4" aria-hidden />
          Crear alerta AI · guardar búsqueda
        </button>
      </div>
    </aside>
  );
}
