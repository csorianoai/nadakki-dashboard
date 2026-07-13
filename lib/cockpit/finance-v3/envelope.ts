import { z } from "zod";

/** Canonical v3.5 data provenance — all finance cockpit panels (7 states). */
export const cockpitDataSourceSchema = z.enum([
  "live",
  "derived",
  "partial",
  "demo",
  "none",
  "stale",
  "error",
]);

export type CockpitDataSource = z.infer<typeof cockpitDataSourceSchema>;

export const cockpitCurrencySchema = z.enum(["DOP", "USD"]);

export const cockpitPeriodSchema = z.object({
  start: z.string().datetime({ offset: true }).or(z.string().min(1)),
  end: z.string().datetime({ offset: true }).or(z.string().min(1)),
});

/** Shared metadata envelope — wraps domain `data` for UI consumption. */
export function cockpitEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    data_source: cockpitDataSourceSchema,
    as_of: z.string().datetime({ offset: true }).or(z.string().min(1)),
    freshness_seconds: z.number().nonnegative().optional(),
    is_estimated: z.boolean(),
    currency: cockpitCurrencySchema.optional(),
    period: cockpitPeriodSchema.optional(),
    warnings: z.array(z.string()).optional(),
  });
}

export type CockpitEnvelope<T> = {
  data: T;
  data_source: CockpitDataSource;
  as_of: string;
  freshness_seconds?: number;
  is_estimated: boolean;
  currency?: "DOP" | "USD";
  period?: { start: string; end: string };
  warnings?: string[];
};
