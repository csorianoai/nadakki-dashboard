import { z } from "zod";
import { cockpitDataSourceSchema, cockpitEnvelopeSchema } from "../envelope";

// ── Raw backend shapes (production population router, migration 086) ─────────

export const rawPopulationSummarySchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  total_professionals: z.number().int().nonnegative(),
  total_entities: z.number().int().nonnegative(),
  total_digital_agents: z.number().int().nonnegative(),
  tenants_managed: z.number().int().nonnegative(),
});

export const rawPopulationByCoreSchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  core_name: z.string(),
  professions: z.array(
    z.object({
      family: z.string(),
      role_code: z.string(),
      display_name: z.string(),
      user_count: z.number().int().nonnegative(),
    }),
  ),
});

export const rawPopulationByFamilySchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  family: z.string(),
  tenants: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string(),
      tenant_country: z.string(),
      user_count: z.number().int().nonnegative(),
    }),
  ),
});

export const rawPopulationByEntityTypeSchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  entity_types: z.array(
    z.object({
      core_name: z.string(),
      entity_code: z.string(),
      display_name: z.string(),
      tenant_count: z.number().int().nonnegative(),
    }),
  ),
});

export const rawPopulationByCountrySchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  countries: z.array(
    z.object({
      country: z.string(),
      tenant_count: z.number().int().nonnegative(),
      user_count: z.number().int().nonnegative(),
    }),
  ),
});

export const rawDigitalAgentsSchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  agents: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      active_agents: z.number().int().nonnegative(),
      total_runs: z.number().int().nonnegative(),
    }),
  ),
});

export const rawTopTenantsSchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  tenants: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string(),
      activity_score: z.number(),
    }),
  ),
});

export const rawTopUsersSchema = z.object({
  success: z.literal(true).optional(),
  data_source: cockpitDataSourceSchema.or(z.enum(["live", "none"])),
  users: z.array(
    z.object({
      user_id: z.string().uuid(),
      email: z.string(),
      tenant_id: z.string().uuid(),
      activity_score: z.number(),
    }),
  ),
});

// ── Normalized v3.1 envelope payloads ────────────────────────────────────────

export const populationSummaryDataSchema = z.object({
  total_professionals: z.number().int().nonnegative(),
  total_entities_connected: z.number().int().nonnegative(),
  total_digital_agents_active: z.number().int().nonnegative(),
  tenants_managed: z.number().int().nonnegative(),
});

export const populationByCoreDataSchema = z.object({
  core_name: z.string(),
  professions: z.array(
    z.object({
      family: z.string(),
      role_code: z.string(),
      display_name: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const populationByFamilyDataSchema = z.object({
  family: z.string(),
  total: z.number().int().nonnegative(),
  rows: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string(),
      country_code: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const populationByEntityDataSchema = z.object({
  types: z.array(
    z.object({
      core_name: z.string(),
      entity_code: z.string(),
      display_name: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const populationByCountryDataSchema = z.object({
  countries: z.array(
    z.object({
      country_code: z.string(),
      tenant_count: z.number().int().nonnegative(),
      user_count: z.number().int().nonnegative(),
    }),
  ),
});

export const digitalAgentsDataSchema = z.object({
  agents: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      active_agents: z.number().int().nonnegative(),
      total_runs: z.number().int().nonnegative(),
    }),
  ),
});

export const topTenantsDataSchema = z.object({
  items: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string(),
      activity_score: z.number(),
    }),
  ),
});

export const topUsersDataSchema = z.object({
  items: z.array(
    z.object({
      user_id: z.string().uuid(),
      email: z.string(),
      tenant_id: z.string().uuid(),
      activity_score: z.number(),
    }),
  ),
});

export const populationSummaryEnvelopeSchema = cockpitEnvelopeSchema(populationSummaryDataSchema);
export const populationByCoreEnvelopeSchema = cockpitEnvelopeSchema(populationByCoreDataSchema);
export const populationByFamilyEnvelopeSchema = cockpitEnvelopeSchema(populationByFamilyDataSchema);
export const populationByEntityEnvelopeSchema = cockpitEnvelopeSchema(populationByEntityDataSchema);
export const populationByCountryEnvelopeSchema = cockpitEnvelopeSchema(populationByCountryDataSchema);
export const digitalAgentsEnvelopeSchema = cockpitEnvelopeSchema(digitalAgentsDataSchema);
export const topTenantsEnvelopeSchema = cockpitEnvelopeSchema(topTenantsDataSchema);
export const topUsersEnvelopeSchema = cockpitEnvelopeSchema(topUsersDataSchema);

export type PopulationSummaryEnvelope = z.infer<typeof populationSummaryEnvelopeSchema>;
export type PopulationByCoreEnvelope = z.infer<typeof populationByCoreEnvelopeSchema>;
