import { z } from "zod";

export const COCKPIT_WARNING_CODES = [
  "RATE_LIMIT_APPROACHING",
  "STALE_CACHE",
  "PARTIAL_DATA",
  "RECONCILIATION_MISMATCH",
  "DEPRECATED_FIELD",
  "DEGRADED_ACCURACY",
] as const;

export type CockpitWarningCode = (typeof COCKPIT_WARNING_CODES)[number];

export const cockpitStructuredWarningSchema = z.object({
  code: z.enum(COCKPIT_WARNING_CODES),
  severity: z.enum(["info", "warn", "error"]),
  message: z.string(),
});

export type CockpitStructuredWarning = z.infer<typeof cockpitStructuredWarningSchema>;

const SEVERITY_STYLES: Record<CockpitStructuredWarning["severity"], string> = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  error: "border-red-500/30 bg-red-500/10 text-red-200",
};

export function parseRegistryWarnings(raw: unknown): CockpitStructuredWarning[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((w) => {
      const parsed = cockpitStructuredWarningSchema.safeParse(w);
      return parsed.success ? parsed.data : null;
    })
    .filter((w): w is CockpitStructuredWarning => w !== null);
}

export function warningBannerClass(severity: CockpitStructuredWarning["severity"]): string {
  return SEVERITY_STYLES[severity];
}
