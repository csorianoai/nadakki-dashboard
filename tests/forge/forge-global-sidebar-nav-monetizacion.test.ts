import {
  NAV_SECTIONS,
  filterSectionsForUser,
} from "@/components/forge/layout/forge-global-sidebar-nav";
import type { RoleInfo } from "@/lib/api/auth-v2";

jest.mock("@/lib/env/feature-forge-monetizacion", () => ({
  isForgeMonetizacionEnabled: jest.fn(() => false),
}));

import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";

const mockFlag = isForgeMonetizacionEnabled as jest.MockedFunction<typeof isForgeMonetizacionEnabled>;

const creditRoles: RoleInfo[] = [
  { core_name: "credit", role_key: "bank_analyst", display_name: "Bank Analyst" },
];

function monetizacionNavItem(sections: ReturnType<typeof filterSectionsForUser>) {
  const credit = sections.find((s) => s.id === "credit-hub");
  const group = credit?.children.find((c) => c.id === "credit-monetizacion-group");
  return group?.children?.find((c) => c.id === "credit-monetizacion");
}

describe("forge-global-sidebar-nav — Monetización flag gate", () => {
  beforeEach(() => {
    mockFlag.mockReturnValue(false);
  });

  test("NAV_SECTIONS registers monetización group under Credit Hub", () => {
    const credit = NAV_SECTIONS.find((s) => s.id === "credit-hub");
    const group = credit?.children.find((c) => c.id === "credit-monetizacion-group");
    expect(group).toBeDefined();
    expect(group?.children?.[0]).toMatchObject({
      id: "credit-monetizacion",
      href: "/credit-hub/monetizacion/dashboard",
      featureFlag: "forge-monetizacion",
    });
  });

  test("flag OFF hides monetización nav entry (H1)", () => {
    mockFlag.mockReturnValue(false);
    const filtered = filterSectionsForUser(NAV_SECTIONS, creditRoles, ["credit"], false);
    expect(monetizacionNavItem(filtered)).toBeUndefined();
  });

  test("flag ON exposes monetización nav entry", () => {
    mockFlag.mockReturnValue(true);
    const filtered = filterSectionsForUser(NAV_SECTIONS, creditRoles, ["credit"], false);
    expect(monetizacionNavItem(filtered)).toMatchObject({
      label: "Métricas y facturación",
      href: "/credit-hub/monetizacion/dashboard",
    });
  });
});
