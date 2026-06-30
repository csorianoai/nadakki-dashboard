/**
 * Forge Credit Hub — Monetización module (8 screens).
 * Default OFF: set NEXT_PUBLIC_FF_FORGE_MONETIZACION=1|true|on to enable routes + nav.
 */
export function isForgeMonetizacionEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_FF_FORGE_MONETIZACION ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}
