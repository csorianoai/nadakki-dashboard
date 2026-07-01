export type FmAccent = "green" | "blue" | "violet" | "amber" | "sub" | "red";

export type MarginStatus = "ok" | "warn" | "bad";

export type AlertSeverity = "bad" | "warn";

export function accentClass(accent: FmAccent): string {
  return `fm-ui-accent-${accent}`;
}

export function textAccentClass(accent: FmAccent): string {
  return `fm-ui-text-${accent}`;
}

export function tenantInitialClass(accent: FmAccent): string {
  if (accent === "sub" || accent === "red") return "fm-ui-tenant-initial--green";
  return `fm-ui-tenant-initial--${accent}`;
}
