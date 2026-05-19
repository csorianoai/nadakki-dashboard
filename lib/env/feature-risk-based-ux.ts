/** T6.5 Risk-based dealer UX overlay — toggle with env. */
export function isRiskBasedUxFeatureEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_FEATURE_RISK_BASED_UX ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}
