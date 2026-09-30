import {
  DEALER_NAV_CAPABILITY_KEYS,
  DEALER_NAV_GROUPS,
  dealerBreadcrumbFor,
  isDealerNavItemActive,
} from "@/components/dealer-management/shell/dealer-nav";

describe("dealer-nav", () => {
  test("capabilities del batch son unicas y excluyen items publicos del shell", () => {
    expect(DEALER_NAV_CAPABILITY_KEYS).toEqual([...new Set(DEALER_NAV_CAPABILITY_KEYS)]);
    expect(DEALER_NAV_CAPABILITY_KEYS).not.toContain(null);
    expect(DEALER_NAV_CAPABILITY_KEYS).toContain("autos.inventory.list");
    expect(DEALER_NAV_CAPABILITY_KEYS).toContain("accounting.ledger.entries");
  });

  test("Inicio solo coincide exacto y los modulos coinciden por subruta", () => {
    expect(isDealerNavItemActive("/autos/dealer", "/autos/dealer")).toBe(true);
    expect(isDealerNavItemActive("/autos/dealer", "/autos/dealer/inventario")).toBe(false);
    expect(
      isDealerNavItemActive("/autos/dealer/inventario", "/autos/dealer/inventario/veh-1"),
    ).toBe(true);
  });

  test("breadcrumbs usan el item mas especifico y siempre parten de Inicio", () => {
    expect(dealerBreadcrumbFor("/autos/dealer")).toEqual([
      { label: "Inicio", href: "/autos/dealer" },
    ]);
    expect(dealerBreadcrumbFor("/autos/dealer/insights/detalle")).toEqual([
      { label: "Inicio", href: "/autos/dealer" },
      { label: "Insights", href: "/autos/dealer/insights" },
    ]);
  });

  test("cada grupo e item tiene identidad estable", () => {
    const groupIds = DEALER_NAV_GROUPS.map((group) => group.id);
    expect(groupIds).toEqual([...new Set(groupIds)]);
    const hrefs = DEALER_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toEqual([...new Set(hrefs)]);
  });
});
