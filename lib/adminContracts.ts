export type NormalizedStatus = "READY" | "PARTIAL" | "NOT_READY";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export function normalizeReadinessStatus(value: unknown): NormalizedStatus {
  const status = String(value ?? "").toUpperCase();
  if (status === "READY" || status === "ACTIVE_READY") return "READY";
  if (status.includes("PARTIAL")) return "PARTIAL";
  return "NOT_READY";
}

export function getActivationGaps(payload: Record<string, unknown> | null | undefined): string[] {
  if (!payload) return [];
  return toStringArray(payload.activation_gaps ?? payload.gaps);
}

export function getNextActions(payload: Record<string, unknown> | null | undefined): string[] {
  if (!payload) return [];
  return toStringArray(payload.next_actions ?? payload.next_steps);
}
