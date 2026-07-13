import type { CockpitDataSource, CockpitEnvelope } from "../envelope";
import {
  rawPopulationSummarySchema,
  rawPopulationByCoreSchema,
  rawPopulationByFamilySchema,
  rawPopulationByEntityTypeSchema,
  rawPopulationByCountrySchema,
  rawDigitalAgentsSchema,
  rawTopTenantsSchema,
  rawTopUsersSchema,
  populationSummaryEnvelopeSchema,
  populationByCoreEnvelopeSchema,
  populationByFamilyEnvelopeSchema,
  populationByEntityEnvelopeSchema,
  populationByCountryEnvelopeSchema,
  digitalAgentsEnvelopeSchema,
  topTenantsEnvelopeSchema,
  topUsersEnvelopeSchema,
  type PopulationSummaryEnvelope,
  type PopulationByCoreEnvelope,
  type PopulationByFamilyEnvelope,
  type PopulationByEntityEnvelope,
  type PopulationByCountryEnvelope,
  type DigitalAgentsEnvelope,
  type TopTenantsEnvelope,
  type TopUsersEnvelope,
} from "../contracts/population";
import { parseContract } from "../parse";

const VALID_SOURCES: readonly CockpitDataSource[] = [
  "live",
  "derived",
  "partial",
  "demo",
  "none",
  "stale",
  "error",
];

function coerceDataSource(raw: string): CockpitDataSource {
  if (VALID_SOURCES.includes(raw as CockpitDataSource)) return raw as CockpitDataSource;
  return "none";
}

function envelopeMeta(
  dataSource: CockpitDataSource,
): Pick<CockpitEnvelope<unknown>, "data_source" | "as_of" | "is_estimated" | "warnings"> {
  return {
    data_source: dataSource,
    as_of: new Date().toISOString(),
    is_estimated: dataSource === "derived" || dataSource === "partial",
  };
}

export function normalizePopulationSummary(raw: unknown): PopulationSummaryEnvelope {
  const parsed = parseContract(rawPopulationSummarySchema, raw, "rawPopulationSummary");
  const source = coerceDataSource(parsed.data_source);
  return parseContract(
    populationSummaryEnvelopeSchema,
    {
      data: {
        total_professionals: parsed.total_professionals,
        total_entities_connected: parsed.total_entities,
        total_digital_agents_active: parsed.total_digital_agents,
        tenants_managed: parsed.tenants_managed,
      },
      ...envelopeMeta(source),
    },
    "populationSummaryEnvelope",
  );
}

export function normalizePopulationByCore(raw: unknown): PopulationByCoreEnvelope {
  const parsed = parseContract(rawPopulationByCoreSchema, raw, "rawPopulationByCore");
  const source = coerceDataSource(parsed.data_source);
  return parseContract(
    populationByCoreEnvelopeSchema,
    {
      data: {
        core_name: parsed.core_name,
        professions: parsed.professions.map((p) => ({
          family: p.family,
          role_code: p.role_code,
          display_name: p.display_name,
          count: p.user_count,
        })),
      },
      ...envelopeMeta(source),
    },
    "populationByCoreEnvelope",
  );
}

export function normalizePopulationByFamily(raw: unknown): PopulationByFamilyEnvelope {
  const parsed = parseContract(rawPopulationByFamilySchema, raw, "rawPopulationByFamily");
  const source = coerceDataSource(parsed.data_source);
  const rows = parsed.tenants.map((t) => ({
    tenant_id: t.tenant_id,
    tenant_name: t.tenant_name,
    country_code: t.tenant_country,
    count: t.user_count,
  }));
  return parseContract(
    populationByFamilyEnvelopeSchema,
    {
      data: {
        family: parsed.family,
        total: rows.reduce((s, r) => s + r.count, 0),
        rows,
      },
      ...envelopeMeta(source),
    },
    "populationByFamilyEnvelope",
  );
}

export function normalizePopulationByEntity(raw: unknown): PopulationByEntityEnvelope {
  const parsed = parseContract(rawPopulationByEntityTypeSchema, raw, "rawPopulationByEntity");
  const source = coerceDataSource(parsed.data_source);
  return parseContract(
    populationByEntityEnvelopeSchema,
    {
      data: {
        types: parsed.entity_types.map((e) => ({
          core_name: e.core_name,
          entity_code: e.entity_code,
          display_name: e.display_name,
          count: e.tenant_count,
        })),
      },
      ...envelopeMeta(source),
    },
    "populationByEntityEnvelope",
  );
}

export function normalizePopulationByCountry(raw: unknown): PopulationByCountryEnvelope {
  const parsed = parseContract(rawPopulationByCountrySchema, raw, "rawPopulationByCountry");
  const source = coerceDataSource(parsed.data_source);
  return parseContract(
    populationByCountryEnvelopeSchema,
    {
      data: {
        countries: parsed.countries.map((c) => ({
          country_code: c.country,
          tenant_count: c.tenant_count,
          user_count: c.user_count,
        })),
      },
      ...envelopeMeta(source),
    },
    "populationByCountryEnvelope",
  );
}

export function normalizeDigitalAgents(raw: unknown): DigitalAgentsEnvelope {
  const parsed = parseContract(rawDigitalAgentsSchema, raw, "rawDigitalAgents");
  const source = coerceDataSource(parsed.data_source);
  return parseContract(
    digitalAgentsEnvelopeSchema,
    {
      data: { agents: parsed.agents },
      ...envelopeMeta(source),
    },
    "digitalAgentsEnvelope",
  );
}

export function normalizeTopTenants(raw: unknown): TopTenantsEnvelope {
  const parsed = parseContract(rawTopTenantsSchema, raw, "rawTopTenants");
  const source = coerceDataSource(parsed.data_source);
  return parseContract(
    topTenantsEnvelopeSchema,
    {
      data: { items: parsed.tenants },
      ...envelopeMeta(source),
    },
    "topTenantsEnvelope",
  );
}

export function normalizeTopUsers(raw: unknown): TopUsersEnvelope {
  const parsed = parseContract(rawTopUsersSchema, raw, "rawTopUsers");
  const source = coerceDataSource(parsed.data_source);
  return parseContract(
    topUsersEnvelopeSchema,
    {
      data: { items: parsed.users },
      ...envelopeMeta(source),
    },
    "topUsersEnvelope",
  );
}

/** Activity telemetry absent — honest NONE envelope (H3-7). */
export function nonePopulationActivityEnvelope(): {
  data_source: "none";
  as_of: string;
  is_estimated: false;
  period: string;
  message: string;
} {
  return {
    data_source: "none",
    as_of: new Date().toISOString(),
    is_estimated: false,
    period: "week",
    message: "No disponible — requiere telemetría de presencia",
  };
}
