/** Feature flags for Fase 8 AI agent — flip to live when backend ready. */

function envFlag(name: string): boolean {
  return process.env[name] === "true" || process.env[name] === "1";
}

export const FEATURE_PERSONAL_SHOPPER_BACKEND = envFlag(
  "NEXT_PUBLIC_FEATURE_PERSONAL_SHOPPER_BACKEND",
);
export const FEATURE_PUBLISH_1CLICK_BACKEND = envFlag(
  "NEXT_PUBLIC_FEATURE_PUBLISH_1CLICK_BACKEND",
);
export const FEATURE_VEHICLE_CHAT_BACKEND = envFlag("NEXT_PUBLIC_FEATURE_VEHICLE_CHAT_BACKEND");
export const FEATURE_LEAD_SCORING_BACKEND = envFlag("NEXT_PUBLIC_FEATURE_LEAD_SCORING_BACKEND");
export const FEATURE_INSIGHTS_BACKEND = envFlag("NEXT_PUBLIC_FEATURE_INSIGHTS_BACKEND");
