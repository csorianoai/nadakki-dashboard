/**
 * T6.4 App Health Score — META MVP 4 dealer detail overlay.
 * Set NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE=0|false|off to hide.
 */
export function isAppHealthScoreFeatureEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}
