import {
  normalizePopulationByCore,
  normalizePopulationByFamily,
  normalizePopulationByCountry,
  normalizePopulationSummary,
  normalizeTopTenants,
  nonePopulationActivityEnvelope,
} from "@/lib/cockpit/finance-v3/normalize/population";
import { POPULATION_TAB_IDS, POPULATION_FAMILIES } from "@/lib/cockpit/population-config";

describe("population normalizers", () => {
  test("summary matches production router shape (44 professionals, 18 tenants)", () => {
    const env = normalizePopulationSummary({
      data_source: "live",
      total_professionals: 44,
      total_entities: 20,
      total_digital_agents: 0,
      tenants_managed: 18,
    });
    expect(env.data.total_professionals).toBe(44);
    expect(env.data.tenants_managed).toBe(18);
    expect(env.data_source).toBe("live");
  });

  test("by-core maps user_count to count", () => {
    const env = normalizePopulationByCore({
      data_source: "live",
      core_name: "credit",
      professions: [
        { family: "dealers", role_code: "dealer", display_name: "Dealer", user_count: 5 },
      ],
    });
    expect(env.data.professions[0]?.count).toBe(5);
  });

  test("by-family aggregates total from rows", () => {
    const env = normalizePopulationByFamily({
      data_source: "live",
      family: "dealers",
      tenants: [
        {
          tenant_id: "11111111-1111-4111-8111-111111111111",
          tenant_name: "T1",
          tenant_country: "DO",
          user_count: 3,
        },
        {
          tenant_id: "22222222-2222-4222-8222-222222222222",
          tenant_name: "T2",
          tenant_country: "DO",
          user_count: 2,
        },
      ],
    });
    expect(env.data.total).toBe(5);
    expect(env.data.rows[0]?.country_code).toBe("DO");
  });

  test("by-country maps country field to country_code", () => {
    const env = normalizePopulationByCountry({
      data_source: "live",
      countries: [{ country: "DO", tenant_count: 18, user_count: 44 }],
    });
    expect(env.data.countries[0]?.country_code).toBe("DO");
  });

  test("top tenants normalizes list", () => {
    const env = normalizeTopTenants({
      data_source: "live",
      tenants: [
        {
          tenant_id: "11111111-1111-4111-8111-111111111111",
          tenant_name: "Acme",
          activity_score: 9.5,
        },
      ],
    });
    expect(env.data.items).toHaveLength(1);
  });

  test("activity envelope is honest NONE (H3-7)", () => {
    const env = nonePopulationActivityEnvelope();
    expect(env.data_source).toBe("none");
    expect(env.message).toContain("telemetría");
  });

  test("population config has 7 tabs and backend families", () => {
    expect(POPULATION_TAB_IDS).toHaveLength(7);
    expect(POPULATION_FAMILIES.length).toBeGreaterThan(0);
  });
});
