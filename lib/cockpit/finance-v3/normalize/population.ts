import type { CockpitDataSource, CockpitEnvelope } from "../envelope";
import type { z } from "zod";
import {
  rawPopulationSummarySchema,
  populationSummaryEnvelopeSchema,
  type PopulationSummaryEnvelope,
} from "../contracts/population";
import { parseContract } from "../parse";

function coerceDataSource(raw: string): CockpitDataSource {
  if (
    raw === "live" ||
    raw === "derived" ||
    raw === "estimated" ||
    raw === "demo" ||
    raw === "none"
  ) {
    return raw;
  }
  return "none";
}

function envelopeMeta(
  dataSource: CockpitDataSource,
  overrides?: Partial<Pick<CockpitEnvelope<unknown>, "is_estimated" | "warnings">>,
): Pick<CockpitEnvelope<unknown>, "data_source" | "as_of" | "is_estimated" | "warnings"> {
  return {
    data_source: dataSource,
    as_of: new Date().toISOString(),
    is_estimated: dataSource === "estimated" || dataSource === "derived",
    warnings: overrides?.warnings,
  };
}

/** Maps production flat response → v3.1 envelope. */
export function normalizePopulationSummary(raw: unknown): PopulationSummaryEnvelope {
  const parsed = parseContract(rawPopulationSummarySchema, raw, "rawPopulationSummary");
  const source = coerceDataSource(parsed.data_source);
  const envelope = {
    data: {
      total_professionals: parsed.total_professionals,
      total_entities_connected: parsed.total_entities,
      total_digital_agents_active: parsed.total_digital_agents,
      tenants_managed: parsed.tenants_managed,
    },
    ...envelopeMeta(source),
  };
  return parseContract(populationSummaryEnvelopeSchema, envelope, "populationSummaryEnvelope");
}
