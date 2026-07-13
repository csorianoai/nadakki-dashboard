import type {
  RegistryEntityTypesEnvelope,
  RegistryProfessionsEnvelope,
} from "../contracts/registry";
import { parseRegistryWarnings } from "../warnings";

function envelopeBase(raw: Record<string, unknown>) {
  return {
    data_source: (raw.data_source as RegistryProfessionsEnvelope["data_source"]) ?? "live",
    as_of: typeof raw.as_of === "string" ? raw.as_of : new Date().toISOString(),
    is_estimated: Boolean(raw.is_estimated),
    warnings: parseRegistryWarnings(raw.warnings),
  };
}

export function normalizeRegistryProfessions(raw: unknown): RegistryProfessionsEnvelope {
  const r = raw as Record<string, unknown>;
  const professions = Array.isArray(r.professions) ? r.professions : [];
  const core =
    typeof r.core_name === "string"
      ? r.core_name
      : typeof professions[0]?.core_name === "string"
        ? professions[0].core_name
        : "all";

  return {
    ...envelopeBase(r),
    data: {
      core,
      items: professions.map((p: Record<string, unknown>) => ({
        id: String(p.id),
        core: String(p.core ?? p.core_name ?? core),
        role_code: String(p.role_code),
        display_name: String(p.display_name),
        family: String(p.family),
        description: (p.description as string | null) ?? null,
        sort_order: Number(p.sort_order ?? 0),
        active: p.active !== false,
      })),
    },
  };
}

export function normalizeRegistryEntityTypes(raw: unknown): RegistryEntityTypesEnvelope {
  const r = raw as Record<string, unknown>;
  const entityTypes = Array.isArray(r.entity_types) ? r.entity_types : [];
  const core =
    typeof r.core_name === "string"
      ? r.core_name
      : typeof entityTypes[0]?.core_name === "string"
        ? entityTypes[0].core_name
        : "all";

  return {
    ...envelopeBase(r),
    data: {
      core,
      items: entityTypes.map((p: Record<string, unknown>) => ({
        id: String(p.id),
        core: String(p.core ?? p.core_name ?? core),
        entity_code: String(p.entity_code),
        display_name: String(p.display_name),
        description: (p.description as string | null) ?? null,
        sort_order: Number(p.sort_order ?? 0),
        active: p.active !== false,
      })),
    },
  };
}
