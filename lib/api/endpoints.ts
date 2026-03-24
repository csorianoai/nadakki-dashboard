const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** Same-origin paths; proxied to backend via next.config.js rewrites (browser-safe). */
const marketingPath = "/marketing";

export const AME_ENDPOINTS = {
  HEALTH: apiBase ? `${apiBase}/api/v1/ame/health` : "",
  STATUS: apiBase ? `${apiBase}/api/v1/ame/status` : "",
  RUNS: apiBase ? `${apiBase}/api/v1/ame/runs` : "",
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
  CORES: apiBase ? `${apiBase}/cores` : "",
  HEALTH: apiBase ? `${apiBase}/health` : "",
};

export const ADVERTISING_ENDPOINTS = {
  HEALTH: apiBase ? `${apiBase}/api/v1/advertising/health` : "",
  PLATFORMS: apiBase ? `${apiBase}/api/v1/advertising/platforms` : "",
  DASHBOARD: apiBase ? `${apiBase}/api/v1/advertising/dashboard` : "",
  TENANTS: apiBase ? `${apiBase}/api/v1/advertising/tenants` : "",
};
