import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1]!, 16), g: parseInt(m[2]!, 16), b: parseInt(m[3]!, 16) };
}

function mixHex(a: string, b: string, weightB: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  const w = Math.min(1, Math.max(0, weightB));
  const r = Math.round(ca.r * (1 - w) + cb.r * w);
  const g = Math.round(ca.g * (1 - w) + cb.g * w);
  const bl = Math.round(ca.b * (1 - w) + cb.b * w);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Derive hover accent from primary. */
export function deriveAccent2(primary: string): string {
  return mixHex(primary, "#000000", 0.22);
}

/** Light tint for --accent-soft backgrounds. */
export function deriveAccentSoft(primary: string, alpha = 0.15): string {
  const rgb = hexToRgb(primary);
  if (!rgb) return "rgba(91,134,242,.14)";
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

/** Border tint for --accent-line. */
export function deriveAccentLine(primary: string, alpha = 0.42): string {
  const rgb = hexToRgb(primary);
  if (!rgb) return "rgba(91,134,242,.4)";
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

/** Text on --accent-soft — replaces fixed #bcd0fb per DESIGN_TOKENS §5. */
export function deriveOnAccentSoft(primary: string): string {
  return mixHex(primary, "#ffffff", 0.62);
}

export interface NautaAccentVars {
  "--accent": string;
  "--accent-2": string;
  "--accent-soft": string;
  "--accent-line": string;
  "--on-accent-soft": string;
}

export function resolveNautaAccentVars(branding: TenantBranding | null | undefined): NautaAccentVars {
  const primary = branding?.accent_color?.trim() || branding?.brand_primary?.trim() || "#5B86F2";
  return {
    "--accent": primary,
    "--accent-2": deriveAccent2(primary),
    "--accent-soft": deriveAccentSoft(primary),
    "--accent-line": deriveAccentLine(primary),
    "--on-accent-soft": deriveOnAccentSoft(primary),
  };
}

export function resolveNautaTenantSlug(
  branding: TenantBranding | null | undefined,
  tenantSlug: string | null | undefined,
): string {
  return branding?.tenant_id?.trim() || tenantSlug?.trim() || "default";
}
