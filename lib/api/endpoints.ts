/** Same-origin paths; proxied via next.config.js rewrites and app/api/v1/[[...path]]. */
const marketingPath = "/api/marketing";

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
  SEGMENT_BY_ID: (id: string) => `${marketingPath}/segments/${encodeURIComponent(id)}`,
  SEGMENT_DUPLICATE: (id: string) =>
    `${marketingPath}/segments/${encodeURIComponent(id)}/duplicate`,
  JOURNEYS: `${marketingPath}/journeys`,
  TEMPLATES: `${marketingPath}/templates`,
  TEMPLATE_BY_ID: (id: string) => `${marketingPath}/templates/${encodeURIComponent(id)}`,
  /** POST JSON body — same-origin, proxied to backend */
  TEMPLATES_GENERATE: `${marketingPath}/templates/generate`,
  /** Proxied to backend POST /marketing/campaigns/launch-pilot */
  CAMPAIGN_LAUNCH_PILOT: `${marketingPath}/campaigns/launch-pilot`,
  INTEGRATIONS: `${marketingPath}/integrations`,
  CORES: "/cores",
  HEALTH: "/health",
};

/** Same-origin; proxied to backend router prefix /campaigns */
export const CAMPAIGNS_API = {
  ACTIVATE: (id: string) =>
    `/api/campaigns/${encodeURIComponent(id)}/activate`,
};

export const ADVERTISING_ENDPOINTS = {
  HEALTH: "/api/v1/advertising/health",
  PLATFORMS: "/api/v1/advertising/platforms",
  DASHBOARD: "/api/v1/advertising/dashboard",
  TENANTS: "/api/v1/advertising/tenants",
};
