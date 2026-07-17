/** Granular active-filter chips for ActiveChipsBar (AutoTrader-style). */

import { DEFAULT_FILTER_STATE, type FilterState } from "@/lib/search-types";
import { fmtKm, fmtRD } from "@/lib/format";

export type ActiveFilterChip = {
  key: string;
  label: string;
  remove: (state: FilterState) => FilterState;
};

function fmtPriceCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

export function buildGranularChips(state: FilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  const push = (key: string, label: string, remove: (s: FilterState) => FilterState) => {
    chips.push({ key, label, remove });
  };

  state.brands.forEach((brand) =>
    push(`brand-${brand}`, brand, (s) => ({ ...s, brands: s.brands.filter((b) => b !== brand) })),
  );

  if (state.model) {
    push(`model-${state.model}`, state.model, (s) => ({ ...s, model: "" }));
  }
  if (state.trim) {
    push(`trim-${state.trim}`, state.trim, (s) => ({ ...s, trim: "" }));
  }

  state.types.forEach((type) =>
    push(`type-${type}`, type, (s) => ({ ...s, types: s.types.filter((t) => t !== type) })),
  );

  state.provinces.forEach((province) =>
    push(`province-${province}`, province, (s) => ({
      ...s,
      provinces: s.provinces.filter((p) => p !== province),
    })),
  );

  state.years.forEach((year) =>
    push(`year-${year}`, String(year), (s) => ({
      ...s,
      years: s.years.filter((y) => y !== year),
    })),
  );

  if (state.yearMin != null || state.yearMax != null) {
    const label =
      state.yearMin != null && state.yearMax != null
        ? `Año: ${state.yearMin}–${state.yearMax}`
        : state.yearMin != null
          ? `Año: desde ${state.yearMin}`
          : `Año: hasta ${state.yearMax}`;
    push("year-range", label, (s) => ({ ...s, yearMin: undefined, yearMax: undefined }));
  }

  state.fuels.forEach((fuel) =>
    push(`fuel-${fuel}`, fuel, (s) => ({ ...s, fuels: s.fuels.filter((f) => f !== fuel) })),
  );

  state.trans.forEach((trans) =>
    push(`trans-${trans}`, trans, (s) => ({ ...s, trans: s.trans.filter((t) => t !== trans) })),
  );

  state.condicion.forEach((cond) =>
    push(`cond-${cond}`, cond, (s) => ({
      ...s,
      condicion: s.condicion.filter((c) => c !== cond),
    })),
  );

  if (state.sellerType !== "Todos") {
    push(`seller-${state.sellerType}`, state.sellerType, (s) => ({
      ...s,
      sellerType: "Todos",
      vendedor: [],
    }));
  }

  state.vendedor.forEach((v) =>
    push(`vend-${v}`, v, (s) => ({ ...s, vendedor: s.vendedor.filter((x) => x !== v) })),
  );

  state.feats.forEach((feat) =>
    push(`feat-${feat}`, feat, (s) => ({ ...s, feats: s.feats.filter((f) => f !== feat) })),
  );

  state.colors.forEach((color) =>
    push(`color-${color}`, color, (s) => ({ ...s, colors: s.colors.filter((c) => c !== color) })),
  );

  state.drivetrain.forEach((d) =>
    push(`drive-${d}`, d, (s) => ({ ...s, drivetrain: s.drivetrain.filter((x) => x !== d) })),
  );

  state.engines.forEach((e) =>
    push(`engine-${e}`, e, (s) => ({ ...s, engines: s.engines.filter((x) => x !== e) })),
  );

  state.priceBadges.forEach((badge) =>
    push(`pb-${badge}`, badge, (s) => ({
      ...s,
      priceBadges: s.priceBadges.filter((b) => b !== badge),
    })),
  );

  if (state.priceReduced) {
    push("price-reduced", "Precio reducido", (s) => ({ ...s, priceReduced: false }));
  }

  if (state.minPrice != null || state.maxPrice != null) {
    const parts: string[] = [];
    if (state.minPrice != null) parts.push(`RD$ ${fmtPriceCompact(state.minPrice)}`);
    if (state.maxPrice != null) parts.push(`RD$ ${fmtPriceCompact(state.maxPrice)}`);
    push("price-range", `Precio: ${parts.join(" – ")}`, (s) => ({
      ...s,
      minPrice: undefined,
      maxPrice: undefined,
    }));
  }

  if (state.kmMin != null || state.kmMax != null) {
    const label =
      state.kmMin != null && state.kmMax != null
        ? `Km: ${fmtKm(state.kmMin)} – ${fmtKm(state.kmMax)}`
        : state.kmMax != null
          ? `Km: hasta ${fmtKm(state.kmMax)}`
          : `Km: desde ${fmtKm(state.kmMin!)}`;
    push("km-range", label, (s) => ({ ...s, kmMin: undefined, kmMax: undefined }));
  }

  if (state.kmVerifiedOnly) {
    push("km-verified", "Km verificado AI", (s) => ({ ...s, kmVerifiedOnly: false }));
  }

  if (state.seats != null) {
    push("seats", `${state.seats} asientos`, (s) => ({ ...s, seats: undefined }));
  }
  if (state.doors != null) {
    push("doors", `${state.doors} puertas`, (s) => ({ ...s, doors: undefined }));
  }

  if (state.publishedSince !== "any") {
    const labels: Record<string, string> = {
      "24h": "Recién publicado",
      "7d": "Últimos 7 días",
      "30d": "Últimos 30 días",
    };
    push(
      "published",
      labels[state.publishedSince] ?? state.publishedSince,
      (s) => ({ ...s, publishedSince: "any" }),
    );
  }

  if (state.keyword.trim()) {
    push(`keyword-${state.keyword}`, `"${state.keyword.trim()}"`, (s) => ({ ...s, keyword: "" }));
  }

  if (state.usePayment) {
    push(
      "payment-monthly",
      `Cuota: hasta ${fmtRD(state.maxMonthly)}/mes`,
      (s) => ({
        ...s,
        usePayment: false,
        maxMonthly: DEFAULT_FILTER_STATE.maxMonthly,
      }),
    );
    if (state.initial !== DEFAULT_FILTER_STATE.initial) {
      push(
        "payment-initial",
        `Inicial: ${fmtRD(state.initial)}`,
        (s) => ({ ...s, initial: DEFAULT_FILTER_STATE.initial }),
      );
    }
  } else if (state.maxMonthly !== DEFAULT_FILTER_STATE.maxMonthly) {
    push(
      "payment-monthly",
      `Cuota: hasta ${fmtRD(state.maxMonthly)}/mes`,
      (s) => ({ ...s, maxMonthly: DEFAULT_FILTER_STATE.maxMonthly }),
    );
  }

  if (!state.usePayment && state.initial !== DEFAULT_FILTER_STATE.initial) {
    push(
      "payment-initial",
      `Inicial: ${fmtRD(state.initial)}`,
      (s) => ({ ...s, initial: DEFAULT_FILTER_STATE.initial }),
    );
  }

  const aiLabels: Record<string, string> = {
    "precio-justo": "Precio Justo ✓",
    match85: "Match >85% ✓",
    historial: "Historial verificado ✓",
    "sin-fraude": "Sin fraude ✓",
  };
  state.aiSignals.forEach((signal) =>
    push(`ai-${signal}`, aiLabels[signal] ?? signal, (s) => ({
      ...s,
      aiSignals: s.aiSignals.filter((x) => x !== signal),
    })),
  );

  if (state.query.trim()) {
    push(`query-${state.query}`, `"${state.query.trim()}"`, (s) => ({ ...s, query: "" }));
  }

  return chips;
}

export function getFilterPreviewLabels(state: FilterState): string[] {
  const chips = buildGranularChips(state);
  if (chips.length) return chips.map((c) => c.label);
  return ["Todos los vehículos disponibles"];
}
