/** Decode JWT ``tid`` claim (same semantics as middleware — signature verified upstream). */
export function decodeJwtTid(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as Record<string, unknown>;
    const tid = payload.tid;
    return typeof tid === "string" ? tid : null;
  } catch {
    return null;
  }
}
