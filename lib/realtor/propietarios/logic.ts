import type { OwnerFilters, OwnerRow } from "./types";

export function applyFilters(list: readonly OwnerRow[], f: OwnerFilters): OwnerRow[] {
  return list.filter((o) => (f.role === "todos" || o.role === f.role) && (f.agreement === "todos" || o.agreement === f.agreement));
}

/** Los alquileres se muestran por mes; las ventas, el total. */
export function formatPrice(o: Pick<OwnerRow, "role" | "priceUsd">, lang: "es" | "en"): string {
  const n = o.priceUsd.toLocaleString(lang === "es" ? "es-US" : "en-US");
  return `USD ${n}${o.role === "arrendador" ? (lang === "es" ? "/mes" : "/mo") : ""}`;
}

export function countByRole(list: readonly OwnerRow[]): Record<OwnerRow["role"], number> {
  const out = { arrendador: 0, vendedor: 0 };
  for (const o of list) out[o.role] += 1;
  return out;
}
