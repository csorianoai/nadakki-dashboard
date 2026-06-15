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

function findMarketIntelSection(sections: ReturnType<typeof filterSectionsForUser>) {
  return sections.find((s) => s.id === "market-intel-hub");
}

describe("forge-global-sidebar-nav — Inteligencia de Mercado", () => {
  test("NAV_SECTIONS registers market-intel hub after Credit Hub", () => {
    const creditIdx = NAV_SECTIONS.findIndex((s) => s.id === "credit-hub");
    const marketIdx = NAV_SECTIONS.findIndex((s) => s.id === "market-intel-hub");
    const legalIdx = NAV_SECTIONS.findIndex((s) => s.id === "legal-hub");

    expect(marketIdx).toBeGreaterThan(creditIdx);
    expect(marketIdx).toBeLessThan(legalIdx);

    const hub = NAV_SECTIONS[marketIdx];
    expect(hub.label).toBe("Inteligencia de Mercado");
    expect(hub.badge).toBe("BETA");
    expect(hub.coreMatchers).toEqual(["credit"]);
    expect(hub.children).toEqual([
      expect.objectContaining({
        id: "market-intel-investigations",
        label: "Investigaciones",
        href: "/market-intel",
      }),
    ]);
  });

  test("filterSectionsForUser exposes Investigaciones when subscribed_cores includes credit", () => {
    const filtered = filterSectionsForUser(
      NAV_SECTIONS,
      creditSubscriberRoles,
      ["credit"],
      false,
    );

    const section = findMarketIntelSection(filtered);
    expect(section).toBeDefined();
    expect(section?.children).toHaveLength(1);
    expect(section?.children[0]).toMatchObject({
      id: "market-intel-investigations",
      label: "Investigaciones",
      href: "/market-intel",
    });
  });

  test("filterSectionsForUser hides Investigaciones when credit is not subscribed", () => {
    const filtered = filterSectionsForUser(
      NAV_SECTIONS,
      marketingOnlyRoles,
      ["marketing"],
      false,
    );

    const section = findMarketIntelSection(filtered);
    expect(section).toBeDefined();
    expect(section?.children).toHaveLength(0);
  });
});
