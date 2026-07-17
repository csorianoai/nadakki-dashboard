/** Active filter summaries per sidebar category. */

import type { FilterCategoryId } from "@/components/search/filter-categories";
import type { FilterState } from "@/lib/search-types";
import { fmtRD } from "@/lib/format";

export function getCategoryActiveSummary(
  state: FilterState,
  id: FilterCategoryId,
): { count: number; label: string } | null {
  switch (id) {
    case "location":
      if (!state.provinces.length) return null;
      return {
        count: state.provinces.length,
        label: `${state.provinces[0]}${state.provinces.length > 1 ? ` +${state.provinces.length - 1}` : ""}, ${state.locationRadius} km`,
      };
    case "condition":
      if (!state.condicion.length) return null;
      return { count: state.condicion.length, label: state.condicion.join(", ") };
    case "seller":
      if (state.sellerType === "Todos" && !state.vendedor.length) return null;
      return { count: 1, label: state.sellerType !== "Todos" ? state.sellerType : state.vendedor[0]! };
    case "makeModel": {
      const parts = [...state.brands, state.model, state.trim].filter(Boolean);
      if (!parts.length) return null;
      return { count: parts.length, label: parts.join(" · ") };
    }
    case "year":
      if (state.yearMin || state.yearMax || state.years.length) {
        const label =
          state.yearMin && state.yearMax
            ? `${state.yearMin}–${state.yearMax}`
            : state.years.join(", ") || String(state.yearMin ?? state.yearMax);
        return { count: 1, label };
      }
      return null;
    case "price":
      if (state.minPrice == null && state.maxPrice == null && !state.priceBadges.length && !state.priceReduced)
        return null;
      return {
        count: 1,
        label: [state.minPrice && `Desde ${fmtRD(state.minPrice)}`, state.maxPrice && `Hasta ${fmtRD(state.maxPrice)}`]
          .filter(Boolean)
          .join(" ") || state.priceBadges[0] || "Precio reducido",
      };
    case "bodyType":
      if (!state.types.length) return null;
      return { count: state.types.length, label: state.types.join(", ") };
    case "color":
      if (!state.colors.length) return null;
      return { count: state.colors.length, label: state.colors.join(", ") };
    case "mileage":
      if (state.kmMin == null && state.kmMax == null && !state.kmVerifiedOnly) return null;
      return {
        count: 1,
        label: `${state.kmMin ?? 0}–${state.kmMax ?? 300_000} km`,
      };
    case "drivetrain":
      if (!state.drivetrain.length) return null;
      return { count: state.drivetrain.length, label: state.drivetrain.join(", ") };
    case "fuel":
      if (!state.fuels.length) return null;
      return { count: state.fuels.length, label: state.fuels.join(", ") };
    case "engine":
      if (!state.engines.length) return null;
      return { count: state.engines.length, label: state.engines.join(", ") };
    case "transmission":
      if (!state.trans.length) return null;
      return { count: state.trans.length, label: state.trans.join(", ") };
    case "seatsDoors":
      if (!state.seats && !state.doors) return null;
      return { count: 1, label: `${state.seats ?? "—"} asientos · ${state.doors ?? "—"} puertas` };
    case "equipment":
      if (!state.feats.length) return null;
      return { count: state.feats.length, label: state.feats.slice(0, 2).join(", ") };
    case "published":
      if (state.publishedSince === "any") return null;
      return { count: 1, label: state.publishedSince };
    case "keyword":
      if (!state.keyword.trim()) return null;
      return { count: 1, label: state.keyword };
    default:
      return null;
  }
}

export function clearCategoryFilters(state: FilterState, id: FilterCategoryId): FilterState {
  switch (id) {
    case "location":
      return { ...state, provinces: [], locationRadius: 25 };
    case "condition":
      return { ...state, condicion: [] };
    case "seller":
      return { ...state, sellerType: "Todos", vendedor: [] };
    case "makeModel":
      return { ...state, brands: [], model: "", trim: "" };
    case "year":
      return { ...state, years: [], yearMin: undefined, yearMax: undefined };
    case "price":
      return {
        ...state,
        minPrice: undefined,
        maxPrice: undefined,
        priceBadges: [],
        priceReduced: false,
      };
    case "bodyType":
      return { ...state, types: [] };
    case "color":
      return { ...state, colors: [] };
    case "mileage":
      return { ...state, kmMin: undefined, kmMax: undefined, kmVerifiedOnly: false };
    case "drivetrain":
      return { ...state, drivetrain: [] };
    case "fuel":
      return { ...state, fuels: [] };
    case "engine":
      return { ...state, engines: [] };
    case "transmission":
      return { ...state, trans: [] };
    case "seatsDoors":
      return { ...state, seats: undefined, doors: undefined };
    case "equipment":
      return { ...state, feats: [] };
    case "published":
      return { ...state, publishedSince: "any" };
    case "keyword":
      return { ...state, keyword: "" };
    default:
      return state;
  }
}
