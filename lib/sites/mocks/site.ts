import type { ReadinessReport, Site } from "../types";

/** Datos SINTETICOS (prefijo SYNTH, sin telefonos ni correos reales). Solo se usan con NEXT_PUBLIC_SITES_ALLOW_DEMO="1" y badge DEMO. */
export const SYNTH_SITE: Site = {
  id: "00000000-0000-4000-8000-0000000000d1",
  tenant_id: "00000000-0000-4000-8000-000000000000",
  vertical: "realestate",
  name: { es: "SYNTH Inmobiliaria de ejemplo", en: "SYNTH Sample Realty" },
  status: "in_review",
  content_version: 3,
  published_at: "2026-01-15T12:00:00Z",
  compliance: { last_result: "warn" },
};

export const SYNTH_READINESS: ReadinessReport = {
  site_id: SYNTH_SITE.id,
  ready: false,
  blocking: [{ rule_id: "SYNTH-RULE-1", severity: "block", message: "SYNTH ejemplo", field: "contact" }],
  warnings: [],
  info: [],
  evaluated_at: "2026-01-15T12:00:00Z",
};
