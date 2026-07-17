/** Vehicle filtering, sorting, and active-filter helpers */

import { cuota, isEligible, priceStatus } from "@/lib/finance";
import { DEFAULT_FILTER_STATE, type FilterState } from "@/lib/search-types";
import type { Vehicle, VehicleType } from "@/lib/vehicles";

const FEAT_MAP: Record<string, string> = {
  Cuero: "CUERO",
  "Cámara 360°": "CÁMARA 360",
  "Cámara reversa": "CÁMARA REVERSA",
  Sunroof: "SUNROOF",
  "Techo panorámico": "TECHO PANORÁMICO",
  Bluetooth: "BLUETOOTH",
  CarPlay: "CARPLAY",
  "Android Auto": "ANDROID AUTO",
  "Navegación GPS": "NAVEGACIÓN",
  Navegación: "NAVEGACIÓN",
  "Aire acondicionado": "AIRE",
  "Sensor de parqueo": "SENSOR",
  "Control crucero": "CRUCERO",
  "Control crucero adaptivo": "ADAPTIVO",
  "Asientos calefactables": "CALEFACTABLE",
  Alarma: "ALARMA",
  "Rines de aleación": "ALEACIÓN",
  "Faros LED": "LED",
};

const BODY_TYPE_MAP: Record<string, VehicleType[]> = {
  "Yipeta / SUV": ["SUV", "SUV Premium"],
  Sedán: ["Sedán"],
  "Camioneta / Pickup": ["SUV"],
  "Guagua / Minivan": ["SUV"],
  Deportivo: ["Premium"],
  Compacto: ["Sedán"],
  Convertible: ["Premium"],
  Lujo: ["Premium", "SUV Premium"],
  SUV: ["SUV", "SUV Premium"],
  Premium: ["Premium", "SUV Premium"],
};

function matchesType(vehicle: Vehicle, types: string[]): boolean {
  if (!types.length) return true;
  return types.some((t) => {
    const mapped = BODY_TYPE_MAP[t];
    if (mapped) return mapped.includes(vehicle.type);
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
    if (c === "Nuevo") return vehicle.year >= 2023 && vehicle.km < 5_000;
    if (c === "Usado") return true;
    if (c === "Certificado") {
      return vehicle.year >= 2023 || vehicle.badge.includes("Certificado");
    }
    if (c === "Con daños reportados") return false;
    if (c === "Certificado Nadakki") {
      return vehicle.year >= 2023 || vehicle.badge.includes("Certificado");
    }
    return true;
  });
}

function matchesSeller(state: FilterState, vehicle: Vehicle): boolean {
  if (state.sellerType === "Dealer verificado") {
    return vehicle.verified && vehicle.dealerName !== "Nadakki Particular";
  }
  if (state.sellerType === "Nadakki Particular Verificado") {
    return !vehicle.verified || vehicle.dealerName === "Nadakki Particular";
  }
  if (!state.vendedor.length) return true;
  return state.vendedor.some((v) => {
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

function matchesYearRange(vehicle: Vehicle, state: FilterState): boolean {
  if (state.years.length && !state.years.includes(vehicle.year)) return false;
  if (state.yearMin != null && vehicle.year < state.yearMin) return false;
  if (state.yearMax != null && vehicle.year > state.yearMax) return false;
  return true;
}

function matchesPriceBadges(vehicle: Vehicle, badges: string[]): boolean {
  if (!badges.length) return true;
  return badges.some((b) => vehicle.badge.toLowerCase().includes(b.toLowerCase().slice(0, 6)));
}

function matchesPublished(vehicle: Vehicle, publishedSince: string): boolean {
  if (publishedSince === "any") return true;
  if (publishedSince === "24h") return vehicle.id === 3 || vehicle.id === 7;
  if (publishedSince === "7d") return vehicle.id <= 7;
  if (publishedSince === "30d") return true;
  return true;
}

function matchesKeyword(vehicle: Vehicle, keyword: string): boolean {
  const k = keyword.trim().toLowerCase();
  if (!k) return true;
  const haystack = `${vehicle.featuresLine} ${vehicle.make} ${vehicle.model}`.toLowerCase();
  return haystack.includes(k);
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
    if (state.model && !v.model.toLowerCase().includes(state.model.toLowerCase())) return false;
    if (state.trim && !v.featuresLine.toLowerCase().includes(state.trim.toLowerCase())) return false;
    if (!matchesType(v, state.types)) return false;
    if (!matchesProvince(v, state.provinces)) return false;
    if (!matchesYearRange(v, state)) return false;
    if (state.fuels.length && !state.fuels.includes(v.fuel)) return false;
    if (state.trans.length && !state.trans.includes(v.trans)) return false;
    if (!matchesCondicion(v, state.condicion)) return false;
    if (!matchesSeller(state, v)) return false;
    if (!matchesFeatures(v, state.feats)) return false;
    if (!matchesAiSignals(v, state.aiSignals)) return false;
    if (!matchesPriceBadges(v, state.priceBadges)) return false;
    if (!matchesPublished(v, state.publishedSince)) return false;
    if (!matchesKeyword(v, state.keyword)) return false;

    if (state.maxPrice != null && v.price > state.maxPrice) return false;
    if (state.minPrice != null && v.price < state.minPrice) return false;
    if (state.kmMin != null && v.km < state.kmMin) return false;
    if (state.kmMax != null && v.km > state.kmMax) return false;
    if (state.kmVerifiedOnly && !v.verified) return false;

    if (state.drivetrain.length) {
      const line = v.featuresLine.toUpperCase();
      const ok = state.drivetrain.some((d) => {
        if (d.includes("4x4")) return line.includes("4X4");
        if (d === "AWD") return line.includes("AWD");
        return true;
      });
      if (!ok && state.drivetrain.some((d) => d.includes("4x4") || d === "AWD")) return false;
    }

    if (state.engines.length) {
      const line = v.featuresLine.toUpperCase();
      if (!state.engines.some((e) => line.includes(e.replace(/\s/g, "").toUpperCase().slice(0, 3)))) {
        return false;
      }
    }

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
    case "km_asc":
      return list.sort((a, b) => a.km - b.km);
    case "km_desc":
      return list.sort((a, b) => b.km - a.km);
    case "year_desc":
      return list.sort((a, b) => b.year - a.year);
    case "year_asc":
      return list.sort((a, b) => a.year - b.year);
    case "relevance":
    default:
      return list.sort((a, b) => b.match - a.match || a.price - b.price);
  }
}

export function countActiveFilters(state: FilterState): number {
  let n = 0;
  if (state.query.trim()) n += 1;
  if (state.keyword.trim()) n += 1;
  n += state.brands.length;
  if (state.model) n += 1;
  if (state.trim) n += 1;
  n += state.types.length;
  n += state.provinces.length;
  if (state.locationRadius !== DEFAULT_FILTER_STATE.locationRadius && state.provinces.length) n += 1;
  n += state.years.length;
  if (state.yearMin != null || state.yearMax != null) n += 1;
  n += state.fuels.length;
  n += state.trans.length;
  n += state.condicion.length;
  if (state.sellerType !== "Todos") n += 1;
  n += state.vendedor.length;
  n += state.feats.length;
  n += state.aiSignals.length;
  n += state.colors.length;
  n += state.drivetrain.length;
  n += state.engines.length;
  if (state.seats != null || state.doors != null) n += 1;
  if (state.publishedSince !== "any") n += 1;
  n += state.priceBadges.length;
  if (state.priceReduced) n += 1;
  if (state.kmMin != null || state.kmMax != null || state.kmVerifiedOnly) n += 1;
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
    pageSize: state.pageSize,
  };
}
