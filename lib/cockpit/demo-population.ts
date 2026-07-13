import {
  CORE_DISPLAY_FALLBACK,
  PLATFORM_CORE_ORDER,
  type PlatformCoreCode,
} from "./core-registry";
import type {
  PopulationActivityResponse,
  PopulationByCoreResponse,
  PopulationByCountryResponse,
  PopulationByEntityTypeResponse,
  PopulationByFamilyResponse,
  PopulationDigitalAgentsResponse,
  PopulationSummaryResponse,
  PopulationTopTenantsResponse,
  PopulationTopUsersResponse,
} from "./types-finance";

export function demoPopulationSummary(): PopulationSummaryResponse {
  return {
    data_source: "demo",
    total_professionals: 1240,
    total_entities_connected: 86,
    total_digital_agents_active: 42,
    tenants_managed: 8,
  };
}

export function demoTopTenants(): PopulationTopTenantsResponse {
  return {
    data_source: "demo",
    items: Array.from({ length: 10 }, (_, i) => ({
      tenant_id: `00000000-0000-4000-8000-0000000000${String(i + 1).padStart(2, "0")}`,
      tenant_name: `Institución ${String(i + 1).padStart(2, "0")}`,
      activity_score: 95 - i * 4,
      country_code: "DO",
    })),
  };
}

export function demoTopUsers(): PopulationTopUsersResponse {
  return {
    data_source: "demo",
    items: Array.from({ length: 10 }, (_, i) => ({
      user_id: `user-${i + 1}`,
      user_name: `Usuario ${String(i + 1).padStart(2, "0")}`,
      tenant_name: `Institución ${String((i % 8) + 1).padStart(2, "0")}`,
      activity_score: 90 - i * 3,
    })),
  };
}

export function demoPopulationByCore(coreCode: string): PopulationByCoreResponse {
  const display = CORE_DISPLAY_FALLBACK[coreCode as PlatformCoreCode] ?? coreCode;
  const hasRoles = coreCode === "legal" || coreCode === "credit_hub" || coreCode === "contable";
  return {
    data_source: "demo",
    core_code: coreCode,
    display_name: display,
    tenants_connected: 5,
    professions: hasRoles
      ? [
          { role_code: "lead", display_name: "Titulares", count: 12 },
          { role_code: "assistant", display_name: "Asistentes", count: 8 },
          { role_code: "analyst", display_name: "Analistas", count: 6 },
        ]
      : [],
  };
}

export function demoAllPopulationByCore(): PopulationByCoreResponse[] {
  return PLATFORM_CORE_ORDER.map((code) => demoPopulationByCore(code));
}

export function demoPopulationByFamily(family: string): PopulationByFamilyResponse {
  return {
    data_source: "demo",
    family,
    total: 48,
    rows: Array.from({ length: 6 }, (_, i) => ({
      tenant_id: `t-${i}`,
      tenant_name: `Institución ${String(i + 1).padStart(2, "0")}`,
      country_code: "DO",
      count: 8 - i,
    })),
  };
}

export function demoPopulationByEntityType(): PopulationByEntityTypeResponse {
  return {
    data_source: "demo",
    types: [
      { entity_code: "bank", display_name: "Bancos", count: 4, tenant_ids: ["t1", "t2"] },
      { entity_code: "coop", display_name: "Cooperativas", count: 3, tenant_ids: ["t3"] },
      { entity_code: "law_firm", display_name: "Firmas legales", count: 6, tenant_ids: [] },
      { entity_code: "dealer", display_name: "Dealers", count: 12, tenant_ids: [] },
    ],
  };
}

export function demoPopulationByCountry(): PopulationByCountryResponse {
  return {
    data_source: "demo",
    countries: [
      { country_code: "DO", country_name: "República Dominicana", tenants_count: 8, users_count: 124 },
      { country_code: "OTHER", country_name: "Otros", tenants_count: 0, users_count: 0 },
    ],
  };
}

export function demoPopulationDigitalAgents(): PopulationDigitalAgentsResponse {
  return {
    data_source: "demo",
    total_active_agents: 42,
    executions_per_day: 1280,
    success_rate_pct: 94.2,
    by_tenant: Array.from({ length: 5 }, (_, i) => ({
      tenant_id: `t-${i}`,
      tenant_name: `Institución ${String(i + 1).padStart(2, "0")}`,
      active_agents: 10 - i,
    })),
  };
}

export function demoPopulationActivity(period: string): PopulationActivityResponse {
  return {
    data_source: "demo",
    period,
    by_core: PLATFORM_CORE_ORDER.map((code, i) => ({
      core_code: code,
      dau: 120 - i * 10,
      wau: 400 - i * 30,
      mau: 900 - i * 50,
    })),
    inactive_tenants: [
      { tenant_id: "t-7", tenant_name: "Institución 07", activity_score: 12, churn_risk: true },
    ],
  };
}

export const DEMO_PROFESSION_FAMILIES = [
  "abogados",
  "contadores",
  "analistas_credito",
  "dealers",
  "community_managers",
  "project_managers",
  "agentes_rpa",
  "oficiales_compliance",
  "oficiales_cobranza",
] as const;
