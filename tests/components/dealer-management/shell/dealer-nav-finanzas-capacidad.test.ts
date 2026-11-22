/**
 * F4A-8-NAV (F-25): "Finanzas por vehiculo" aparecia en el menu para un plan sin
 * la capacidad contable y luego la pantalla se bloqueaba (vehicle-costs.ts exige
 * autos.inventory.list Y accounting.ledger.entries). El menu pide lo mismo que la pantalla.
 */
import {
  DEALER_NAV_CAPABILITY_KEYS,
  visibleDealerNavGroups,
} from "@/components/dealer-management/shell/dealer-nav";
import { COSTS_CAPABILITY_KEYS } from "@/lib/dealer-management/vehicle-costs";

const HREF = "/autos/dealer/finanzas";

function visible(granted: string[]): boolean {
  const groups = visibleDealerNavGroups((cap) => cap === null || granted.includes(cap));
  return groups.some((g) => g.items.some((i) => i.href === HREF));
}

describe("Finanzas por vehiculo respeta la capacidad contable", () => {
  it("se oculta con inventario pero sin accounting.ledger.entries", () => {
    expect(visible(["autos.inventory.list"])).toBe(false);
  });

  it("se oculta con la capacidad contable pero sin inventario", () => {
    expect(visible(["accounting.ledger.entries"])).toBe(false);
  });

  it("se muestra con ambas, las mismas que exige la pantalla", () => {
    expect(visible([...COSTS_CAPABILITY_KEYS])).toBe(true);
  });

  it("el batch del menu pide todas las claves que exige la pantalla", () => {
    for (const key of COSTS_CAPABILITY_KEYS) expect(DEALER_NAV_CAPABILITY_KEYS).toContain(key);
  });
});
