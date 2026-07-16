/** Vehicle filtering, sorting, and active-filter helpers */

import { cuota, isEligible, priceStatus } from "@/lib/finance";
import { DEFAULT_FILTER_STATE, type FilterState } from "@/lib/search-types";
import type { Vehicle } from "@/lib/vehicles";

const FEAT_MAP: Record<string, string> = {
  Cuero: "CUERO",
  "Cámara 360°": "CÁMARA 360",
  Sunroof: "SUNROOF",
  Bluetooth: "BLUETOOTH",
  CarPlay: "CARPLAY",
  Navegación: "NAVEGACIÓN",
};

function matchesType(vehicle: Vehicle, types: string[]): boolean {
  if (!types.length) return true;
  return types.some((t) => {
    if (t === "Premium") return vehicle.type === "Premium" || vehicle.type === "SUV Premium";
    if (t === "SUV") return vehicle.type === "SUV";
    return vehicle.type === t;
  });
}

function matchesProvince(vehicle: Vehicle, provinces: string[]): boolean {
  if (!provinces.length) return true;
  return provinces.some((p) => {
    if (p === "Santo Domingo") {
      return (
        vehicle.loc.includes("Santo Domingo") ||
        vehicle.loc === "Distrito Nacional"
      );
    }
    return vehicle.loc === p || vehicle.loc.includes(p);
  });
}

function matchesCondicion(vehicle: Vehicle, condicion: string[]): boolean {
  if (!condicion.length) return true;
  return condicion.some((c) => {
    if (c === "Certificado Nadakki") {
      return vehicle.year >= 2023 || vehicle.badge.includes("Certificado");
    }
    return true;
  });
}

function matchesVendedor(vehicle: Vehicle, vendedor: string[]): boolean {
  if (!vendedor.length) return true;
  return vendedor.some((v) => {
    if (v === "Dealer verificado") return vehicle.verified && vehicle.dealerName !== "Nadakki Particular";
    if (v === "Nadakki Particular Verificado") {
      return !vehicle.verified || vehicle.dealerName === "Nadakki Particular";
    }
    return true;
  });
}

function matchesFeatures(vehicle: Vehicle, feats: string[]): boolean {
  if (!feats.length) return true;
  const line = vehicle.featuresLine.toUpperCase();
  return feats.every((f) => line.includes((FEAT_MAP[f] ?? f).toUpperCase()));
}

function matchesAiSignals(vehicle: Vehicle, signals: FilterState["aiSignals"]): boolean {
  if (!signals.length) return true;
  const status = priceStatus(vehicle.badge, vehicle.match);
  return signals.every((s) => {
    if (s === "precio-justo") return status !== "sobre";
    if (s === "match85") return vehicle.match >= 85;
    if (s === "historial" || s === "sin-fraude") return vehicle.verified;
    return true;
  });
}

export function filterVehicles(vehicles: Vehicle[], state: FilterState): Vehicle[] {
  const q = state.query.trim().toLowerCase();

  return vehicles.filter((v) => {
    if (q) {
      const haystack = `${v.make} ${v.model} ${v.type} ${v.loc} ${v.featuresLine}`.toLowerCase();
      if (!haystack.includes(q) && !q.split(/\s+/).every((token) => haystack.includes(token))) {
        return false;
      }
    }

    if (state.brands.length && !state.brands.includes(v.make)) return false;
    if (!matchesType(v, state.types)) return false;
    if (!matchesProvince(v, state.provinces)) return false;
    if (state.years.length && !state.years.includes(v.year)) return false;
    if (state.fuels.length && !state.fuels.includes(v.fuel)) return false;
    if (state.trans.length && !state.trans.includes(v.trans)) return false;
    if (!matchesCondicion(v, state.condicion)) return false;
    if (!matchesVendedor(v, state.vendedor)) return false;
    if (!matchesFeatures(v, state.feats)) return false;
    if (!matchesAiSignals(v, state.aiSignals)) return false;

    if (state.maxPrice != null && v.price > state.maxPrice) return false;
    if (state.minPrice != null && v.price < state.minPrice) return false;

    if (state.usePayment) {
      if (!isEligible(v.price, state.initial, state.maxMonthly, 60)) return false;
    }

    return true;
  });
}

export function sortVehicles(vehicles: Vehicle[], sort: FilterState["sort"]): Vehicle[] {
  const list = [...vehicles];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "payment_asc":
      return list.sort(
        (a, b) => cuota(a.price, 20, 60) - cuota(b.price, 20, 60),
      );
    case "match":
      return list.sort((a, b) => b.match - a.match);
    case "relevance":
    default:
      return list.sort((a, b) => b.match - a.match || a.price - b.price);
  }
}

export function countActiveFilters(state: FilterState): number {
  let n = 0;
  if (state.query.trim()) n += 1;
  n += state.brands.length;
  n += state.types.length;
  n += state.provinces.length;
  n += state.years.length;
  n += state.fuels.length;
  n += state.trans.length;
  n += state.condicion.length;
  n += state.vendedor.length;
  n += state.feats.length;
  n += state.aiSignals.length;
  if (state.usePayment) n += 1;
  if (state.maxPrice != null) n += 1;
  if (state.minPrice != null) n += 1;
  if (state.maxMonthly !== DEFAULT_FILTER_STATE.maxMonthly) n += 1;
  if (state.initial !== DEFAULT_FILTER_STATE.initial) n += 1;
  return n;
}

export function hasActiveChips(state: FilterState): boolean {
  return countActiveFilters(state) > 0;
}

export function clearFilterSection(
  state: FilterState,
  section:
    | "brands"
    | "types"
    | "provinces"
    | "years"
    | "fuels"
    | "trans"
    | "condicion"
    | "vendedor"
    | "feats"
    | "aiSignals"
    | "payment",
): FilterState {
  if (section === "payment") {
    return {
      ...state,
      usePayment: false,
      maxMonthly: DEFAULT_FILTER_STATE.maxMonthly,
      initial: DEFAULT_FILTER_STATE.initial,
      maxPrice: undefined,
      minPrice: undefined,
    };
  }
  return { ...state, [section]: [] };
}

export function clearAllFilters(state: FilterState): FilterState {
  return {
    ...DEFAULT_FILTER_STATE,
    view: state.view,
    sort: state.sort,
  };
}
