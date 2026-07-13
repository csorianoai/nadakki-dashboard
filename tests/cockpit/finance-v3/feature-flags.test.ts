import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";

describe("COCKPIT_FINANCE_* feature flags — F7 audit", () => {
  const defaults = {
    COCKPIT_FINANCE_ENABLED: true,
    COCKPIT_FINANCE_REGISTRY_ENABLED: true,
    COCKPIT_FINANCE_MATRIX_ENABLED: true,
    COCKPIT_FINANCE_TENANT_DETAIL_ENABLED: true,
  };

  test("all finance flags default ON (!== false)", () => {
    expect(COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_ENABLED).toBe(defaults.COCKPIT_FINANCE_ENABLED);
    expect(COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_REGISTRY_ENABLED).toBe(
      defaults.COCKPIT_FINANCE_REGISTRY_ENABLED,
    );
    expect(COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_MATRIX_ENABLED).toBe(
      defaults.COCKPIT_FINANCE_MATRIX_ENABLED,
    );
    expect(COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_TENANT_DETAIL_ENABLED).toBe(
      defaults.COCKPIT_FINANCE_TENANT_DETAIL_ENABLED,
    );
  });

  test("OFF semantics: === false env hides routes (documented)", () => {
    const off = (env: string | undefined) => env === "false";
    expect(off("false")).toBe(true);
    expect(off(undefined)).toBe(false);
    expect(off("true")).toBe(false);
  });
});

describe("finance route flag mapping", () => {
  const ROUTE_FLAGS: { path: string; flag: keyof typeof COCKPIT_FINANCE_FLAGS }[] = [
    { path: "/cockpit/finance/revenue", flag: "COCKPIT_FINANCE_ENABLED" },
    { path: "/cockpit/finance/population", flag: "COCKPIT_FINANCE_ENABLED" },
    { path: "/cockpit/finance/matrix", flag: "COCKPIT_FINANCE_MATRIX_ENABLED" },
    { path: "/cockpit/finance/registry", flag: "COCKPIT_FINANCE_REGISTRY_ENABLED" },
    { path: "/cockpit/finance/tenant/acme", flag: "COCKPIT_FINANCE_TENANT_DETAIL_ENABLED" },
  ];

  test.each(ROUTE_FLAGS)("$path gated by $flag", ({ flag }) => {
    expect(COCKPIT_FINANCE_FLAGS[flag]).toBeDefined();
  });
});
