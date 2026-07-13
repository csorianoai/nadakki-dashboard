import { normalizeRegistryProfessions } from "@/lib/cockpit/finance-v3/normalize/registry";
import { emitRegistryMutated, onRegistryMutated, REGISTRY_MUTATED_EVENT } from "@/lib/cockpit/finance-v3/registry-events";
import { parseRegistryWarnings } from "@/lib/cockpit/finance-v3/warnings";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";

const SYNTH_USER = "22222222-2222-4222-8222-222222222222";

describe("registry normalize", () => {
  test("maps backend professions array to envelope items", () => {
    const raw = {
      success: true,
      data_source: "live",
      as_of: "2026-07-13T12:00:00Z",
      is_estimated: false,
      warnings: [{ code: "STALE_CACHE", severity: "info", message: "cache ok" }],
      professions: [
        {
          id: SYNTH_USER,
          core_name: "credit",
          role_code: "dealer",
          family: "dealers",
          display_name: "Dealer",
          description: null,
          sort_order: 1,
          active: true,
        },
      ],
      total: 1,
    };
    const env = normalizeRegistryProfessions(raw);
    expect(env.data.items).toHaveLength(1);
    expect(env.data.items[0].core).toBe("credit");
    expect(env.warnings?.[0]?.code).toBe("STALE_CACHE");
  });
});

describe("registry warnings", () => {
  test("parses structured warning codes", () => {
    const parsed = parseRegistryWarnings([
      { code: "PARTIAL_DATA", severity: "warn", message: "soft deleted" },
      { code: "BAD", severity: "warn", message: "skip" },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].code).toBe("PARTIAL_DATA");
  });
});

describe("registry events", () => {
  test("emitRegistryMutated dispatches custom event", () => {
    const handler = jest.fn();
    const off = onRegistryMutated(handler);
    emitRegistryMutated();
    expect(handler).toHaveBeenCalled();
    off();
  });

  test("REGISTRY_MUTATED_EVENT constant", () => {
    expect(REGISTRY_MUTATED_EVENT).toBe("cockpit:registry-mutated");
  });
});

describe("registry feature flag", () => {
  test("COCKPIT_FINANCE_REGISTRY_ENABLED defaults true", () => {
    expect(COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_REGISTRY_ENABLED).toBe(true);
  });
});
