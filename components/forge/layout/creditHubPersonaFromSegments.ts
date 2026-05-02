import type { ForgePersona } from "@/lib/credit-hub/design/persona";

/**
 * Resolves Forge persona for Credit Hub from Next layout segments **below**
 * `app/(forge)/credit-hub/` (e.g. `bank`, `dealer`). Preview and hub root default to `bank`.
 * Phase 8 may replace this with tenant- or role-driven persona from context.
 */
export function creditHubPersonaFromLayoutSegments(segments: readonly string[]): ForgePersona {
  const head = segments[0];
  if (head === "dealer") return "dealer";
  if (head === "bank") return "bank";
  return "bank";
}
