/** Same-origin paths; proxied via next.config.js rewrites and app/api/v1/[[...path]]. */
const marketingPath = "/marketing";

export const AME_ENDPOINTS = {
  HEALTH: "/api/v1/ame/health",
  STATUS: "/api/v1/ame/status",
  RUNS: "/api/v1/ame/runs",
};

export const MARKETING_ENDPOINTS = {
  AGENTS: `${marketingPath}/agents`,
  AGENT_BY_ID: (id: string) => `${marketingPath}/agents/${encodeURIComponent(id)}`,
  AGENT_EXEC: (id: string) => `${marketingPath}/agents/${encodeURIComponent(id)}/execute`,
  CAMPAIGNS: `${marketingPath}/campaigns`,
  CAMPAIGN_BY_ID: (id: string) => `${marketingPath}/campaigns/${encodeURIComponent(id)}`,
  SEGMENTS: `${marketingPath}/segments`,
  JOURNEYS: `${marketingPath}/journeys`,
  TEMPLATES: `${marketingPath}/templates`,
  INTEGRATIONS: `${marketingPath}/integrations`,
  CORES: "/cores",
  HEALTH: "/health",
};

export const ADVERTISING_ENDPOINTS = {
  HEALTH: "/api/v1/advertising/health",
  PLATFORMS: "/api/v1/advertising/platforms",
  DASHBOARD: "/api/v1/advertising/dashboard",
  TENANTS: "/api/v1/advertising/tenants",
};
