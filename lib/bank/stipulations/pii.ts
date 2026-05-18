import type { StipulationsApiRole } from "@/lib/api/stipulations-types";

/** Mask cédula-like tokens for analysts; TENANT_ADMIN sees raw audit strings. */
export function maskAuditDetail(text: string | undefined, role: StipulationsApiRole): string {
  const s = text?.trim() ?? "";
  if (!s) return "—";
  if (role === "TENANT_ADMIN") return s;
  return s
    .replace(/\b\d{3}-\d{7}-\d{1}\b/g, "***-*******-*")
    .replace(/\b\d{3}\s?\d{7}\s?\d{1}\b/g, "*** ******* *")
    .replace(/\b\d{11}\b/g, "***********");
}
