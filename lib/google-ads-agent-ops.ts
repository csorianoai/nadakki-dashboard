/**
 * Google Ads Agent operational checks — same-origin `/api/v1/ops/google-ads-agent/checks/*`
 * proxied to Nadakki AI Suite (`next.config.js` rewrites + `app/api/v1/[[...path]]` route).
 *
 * Optional shorter URLs: `/api/ops/*` rewrites to `/api/v1/ops/*` (see next.config.js).
 */

export * from "@/lib/api/googleAdsAgentOps";

export { postGoogleAdsAgentCheckRun as runGoogleAdsAgentCheck } from "@/lib/api/googleAdsAgentOps";
export { getGoogleAdsAgentCheckLatest as getLatestGoogleAdsAgentCheck } from "@/lib/api/googleAdsAgentOps";
export { getGoogleAdsAgentCheckByRunId as getGoogleAdsAgentCheck } from "@/lib/api/googleAdsAgentOps";
