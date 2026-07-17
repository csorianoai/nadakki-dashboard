"use client";

import { DEFAULT_FILTER_STATE, type AiSignal, type FilterState } from "@/lib/search-types";
import { clearAllFilters } from "@/lib/search-filters";
import { fmtRD } from "@/lib/format";

const AI_CHIP_LABELS: Record<AiSignal, string> = {
  "precio-justo": "Precio Justo",
  match85: "Match >85%",
  historial: "Historial AI",
  "sin-fraude": "Sin fraude",
};

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand transition hover:brightness-95"
    >
      {label}
      <span aria-hidden>✕</span>
    </button>
  );
}

export function ActiveChips({
  state,
  onChange,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [];

  state.brands.forEach((brand) =>
    chips.push({
      key: `brand-${brand}`,
      label: brand,
      remove: () => onChange({ ...state, brands: state.brands.filter((b) => b !== brand) }),
    }),
  );
  state.types.forEach((type) =>
    chips.push({
      key: `type-${type}`,
      label: type,
      remove: () => onChange({ ...state, types: state.types.filter((t) => t !== type) }),
    }),
  );
  state.provinces.forEach((province) =>
    chips.push({
      key: `province-${province}`,
      label: province,
      remove: () =>
        onChange({ ...state, provinces: state.provinces.filter((p) => p !== province) }),
    }),
  );
  state.years.forEach((year) =>
    chips.push({
      key: `year-${year}`,
      label: String(year),
      remove: () => onChange({ ...state, years: state.years.filter((y) => y !== year) }),
    }),
  );
  state.fuels.forEach((fuel) =>
    chips.push({
      key: `fuel-${fuel}`,
      label: fuel,
      remove: () => onChange({ ...state, fuels: state.fuels.filter((f) => f !== fuel) }),
    }),
  );
  state.trans.forEach((trans) =>
    chips.push({
      key: `trans-${trans}`,
      label: trans,
      remove: () => onChange({ ...state, trans: state.trans.filter((t) => t !== trans) }),
    }),
  );
  state.condicion.forEach((cond) =>
    chips.push({
      key: `cond-${cond}`,
      label: cond,
      remove: () =>
        onChange({ ...state, condicion: state.condicion.filter((c) => c !== cond) }),
    }),
  );
  state.vendedor.forEach((v) =>
    chips.push({
      key: `vend-${v}`,
      label: v,
      remove: () => onChange({ ...state, vendedor: state.vendedor.filter((x) => x !== v) }),
    }),
  );
  state.feats.forEach((feat) =>
    chips.push({
      key: `feat-${feat}`,
      label: feat,
      remove: () => onChange({ ...state, feats: state.feats.filter((f) => f !== feat) }),
    }),
  );

  if (state.usePayment || state.maxMonthly !== DEFAULT_FILTER_STATE.maxMonthly) {
    chips.push({
      key: "monthly",
      label: `≤ ${fmtRD(state.maxMonthly)}/mes`,
      remove: () =>
        onChange({
          ...state,
          usePayment: false,
          maxMonthly: DEFAULT_FILTER_STATE.maxMonthly,
        }),
    });
  }

  state.aiSignals.forEach((signal) => {
    chips.push({
      key: `ai-${signal}`,
      label: AI_CHIP_LABELS[signal],
      remove: () =>
        onChange({ ...state, aiSignals: state.aiSignals.filter((s) => s !== signal) }),
    });
  });

  if (state.query.trim()) {
    chips.push({
      key: "query",
      label: `"${state.query.trim()}"`,
      remove: () => onChange({ ...state, query: "" }),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={chip.remove} />
      ))}
      <button
        type="button"
        onClick={() => onChange(clearAllFilters(state))}
        className="ml-auto text-xs font-semibold text-brand hover:underline"
      >
        Limpiar todo
      </button>
    </div>
  );
}
