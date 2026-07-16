/** Bidirectional URL ↔ FilterState sync */

import {
  DEFAULT_FILTER_STATE,
  type AiSignal,
  type FilterState,
  type SearchView,
  type SortOption,
} from "@/lib/search-types";
import { parseNaturalQuery } from "@/lib/search-parser";

const AI_SIGNALS = new Set<AiSignal>(["precio-justo", "match85", "historial", "sin-fraude"]);
const VIEWS = new Set<SearchView>(["grid", "list", "map"]);
const SORTS = new Set<SortOption>([
  "relevance",
  "price_asc",
  "price_desc",
  "payment_asc",
  "match",
]);

function readMulti(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).filter(Boolean);
}

function readMultiBracket(params: URLSearchParams, key: string): string[] {
  return [...readMulti(params, key), ...readMulti(params, `${key}[]`)];
}

function readNumber(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function filterStateFromSearchParams(params: URLSearchParams): FilterState {
  const base: FilterState = { ...DEFAULT_FILTER_STATE };

  const query = params.get("query") ?? params.get("q") ?? "";
  const parsed = query ? parseNaturalQuery(query) : { query: "" };

  const marca = params.get("marca");
  const modelo = params.get("modelo");
  const tipo = params.get("tipo");
  const ciudad = params.get("ciudad");
  const provincia = params.get("provincia");

  const brands = readMultiBracket(params, "brands");
  if (marca) brands.push(marca);

  const types = readMultiBracket(params, "types");
  if (tipo) types.push(tipo);

  const provinces = readMultiBracket(params, "provinces");
  if (ciudad) provinces.push(ciudad);
  if (provincia) provinces.push(provincia);

  let mergedQuery = parsed.query ?? query;
  if (modelo && !mergedQuery.toLowerCase().includes(modelo.toLowerCase())) {
    mergedQuery = mergedQuery ? `${mergedQuery} ${modelo}` : modelo;
  }

  const years = readMultiBracket(params, "years")
    .map(Number)
    .filter((y) => Number.isFinite(y));

  const aiSignals = readMultiBracket(params, "aiSignals").filter((s): s is AiSignal =>
    AI_SIGNALS.has(s as AiSignal),
  );

  const viewRaw = params.get("view");
  const sortRaw = params.get("sort");

  const maxPriceRaw = params.get("precio_max");
  const minPriceRaw = params.get("precio_min");

  return {
    ...base,
    ...parsed,
    query: mergedQuery,
    brands: [...new Set([...brands, ...(parsed.brands ?? [])])],
    types: [...new Set([...types, ...(parsed.types ?? [])])],
    provinces: [...new Set(provinces)],
    years: years.length ? years : (parsed.years ?? []),
    fuels: readMultiBracket(params, "fuels"),
    trans: readMultiBracket(params, "trans"),
    condicion: readMultiBracket(params, "condicion"),
    vendedor: readMultiBracket(params, "vendedor"),
    feats: readMultiBracket(params, "feats"),
    aiSignals,
    maxMonthly: readNumber(params, "maxMonthly", base.maxMonthly),
    initial: readNumber(params, "initial", base.initial),
    usePayment: params.get("usePayment") === "1" || params.get("usePayment") === "true",
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) : parsed.maxPrice,
    minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
    sort: sortRaw && SORTS.has(sortRaw as SortOption) ? (sortRaw as SortOption) : base.sort,
    view: viewRaw && VIEWS.has(viewRaw as SearchView) ? (viewRaw as SearchView) : base.view,
  };
}

export function filterStateToSearchParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.query.trim()) params.set("query", state.query.trim());

  state.brands.forEach((b) => params.append("brands", b));
  state.types.forEach((t) => params.append("types", t));
  state.provinces.forEach((p) => params.append("provinces", p));
  state.years.forEach((y) => params.append("years", String(y)));
  state.fuels.forEach((f) => params.append("fuels", f));
  state.trans.forEach((t) => params.append("trans", t));
  state.condicion.forEach((c) => params.append("condicion", c));
  state.vendedor.forEach((v) => params.append("vendedor", v));
  state.feats.forEach((f) => params.append("feats", f));
  state.aiSignals.forEach((s) => params.append("aiSignals", s));

  if (state.maxMonthly !== DEFAULT_FILTER_STATE.maxMonthly) {
    params.set("maxMonthly", String(state.maxMonthly));
  }
  if (state.initial !== DEFAULT_FILTER_STATE.initial) {
    params.set("initial", String(state.initial));
  }
  if (state.usePayment) params.set("usePayment", "1");
  if (state.maxPrice != null) params.set("precio_max", String(state.maxPrice));
  if (state.minPrice != null) params.set("precio_min", String(state.minPrice));
  if (state.sort !== DEFAULT_FILTER_STATE.sort) params.set("sort", state.sort);
  if (state.view !== DEFAULT_FILTER_STATE.view) params.set("view", state.view);

  return params;
}

export function buildSearchHref(state: FilterState, pathname = "/autos/vehiculos"): string {
  const qs = filterStateToSearchParams(state).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
