/** Normalize tenant status from legacy uppercase or new lowercase. */
export function normalizeStatus(raw: string | null | undefined): "active" | "suspended" | "pending" {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "active" || s === "suspended" || s === "pending") return s;
  if (s === "inactive") return "suspended";
  return "pending";
}

/** API may return `code` or `core_code` — canonical key is `code`. */
export function coreCode(item: { code?: string; core_code?: string }): string {
  return (item.code ?? item.core_code ?? "").trim();
}
