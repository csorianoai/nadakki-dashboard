import {
  filterSectionsForUser,
  NAV_SECTIONS,
} from "@/components/forge/layout/forge-global-sidebar-nav";
import type { RoleInfo } from "@/lib/api/auth-v2";

const creditSubscriberRoles: RoleInfo[] = [
  { core_name: "credit", role_key: "bank_analyst", display_name: "Bank Analyst" },
];

const marketingOnlyRoles: RoleInfo[] = [
  { core_name: "marketing", role_key: "marketer", display_name: "Marketer" },
];

function marketIntel(sections: ReturnType<typeof filterSectionsForUser>) {
  return sections.find((s) => s.id === "credit-hub")?.children.find((c) => c.id === "market-intel-investigations");
}

// Rediseño de navegación (César, 2026-10-13): Inteligencia de Mercado deja de ser un hub y es una página de
// Crédito, el mismo módulo que la abría.
describe("forge-global-sidebar-nav — Inteligencia de Mercado dentro de Crédito", () => {
  test("es una página de la sección Crédito, sin hub propio", () => {
    expect(NAV_SECTIONS.find((s) => s.id === "market-intel-hub")).toBeUndefined();
    expect(marketIntel(NAV_SECTIONS)).toMatchObject({
      label: "Inteligencia de mercado",
      href: "/market-intel",
      badge: "BETA",
    });
  });

  test("se ve con credit en subscribed_cores", () => {
    const filtered = filterSectionsForUser(NAV_SECTIONS, creditSubscriberRoles, ["credit"], false);
    expect(marketIntel(filtered)).toMatchObject({ href: "/market-intel" });
  });

  test("sin credit no se ve, y la sección Crédito entera tampoco", () => {
    const filtered = filterSectionsForUser(NAV_SECTIONS, marketingOnlyRoles, ["marketing"], false);
    expect(marketIntel(filtered)).toBeUndefined();
    expect(filtered.find((s) => s.id === "credit-hub")).toBeUndefined();
  });
});
