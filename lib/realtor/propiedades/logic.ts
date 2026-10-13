import { STAGES, STATUSES, type Currency, type PropFilters, type Property, type Stage, type PropStatus } from "./types";

export function applyFilters(list: readonly Property[], f: PropFilters): Property[] {
  return list.filter((p) =>
    (f.type === "todos" || p.type === f.type) &&
    (f.status === "todos" || p.status === f.status) &&
    (f.stage === "todos" || p.stage === f.stage));
}

function countBy<K extends string>(keys: readonly K[], list: readonly Property[], pick: (p: Property) => K): Record<K, number> {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const p of list) out[pick(p)] += 1;
  return out;
}
export const countByStatus = (list: readonly Property[]): Record<PropStatus, number> => countBy(STATUSES, list, (p) => p.status);
export const countByStage = (list: readonly Property[]): Record<Stage, number> => countBy(STAGES, list, (p) => p.stage);

/** Precio siempre con su moneda explícita (código ISO), nunca un símbolo suelto. */
export function formatPrice(amount: number, currency: Currency, lang: "es" | "en"): string {
  return `${currency} ${amount.toLocaleString(lang === "es" ? "es-US" : "en-US")}`;
}
