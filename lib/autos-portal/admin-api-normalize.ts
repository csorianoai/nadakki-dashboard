import {
  AUTOS_FEATURE_FLAG_KEYS,
  DEFAULT_AUTOS_FEATURE_FLAGS,
  type AutosFeatureFlags,
} from "./admin-types";

export function normalizeFlags(raw: unknown): AutosFeatureFlags {
  const base = { ...DEFAULT_AUTOS_FEATURE_FLAGS };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  if (o.flags && typeof o.flags === "object") {
    for (const key of AUTOS_FEATURE_FLAG_KEYS) {
      const v = (o.flags as Record<string, unknown>)[key];
      if (typeof v === "boolean") base[key] = v;
    }
    return base;
  }
  for (const key of AUTOS_FEATURE_FLAG_KEYS) {
    if (typeof o[key] === "boolean") base[key] = o[key] as boolean;
  }
  return base;
}
