const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const AME_ENDPOINTS = {
  HEALTH: apiBase ? `${apiBase}/api/v1/ame/health` : "",
  STATUS: apiBase ? `${apiBase}/api/v1/ame/status` : "",
  RUNS: apiBase ? `${apiBase}/api/v1/ame/runs` : "",
};

export const MARKETING_ENDPOINTS = {
  AGENTS: apiBase ? `${apiBase}/marketing/agents` : "",
  AGENT_BY_ID: (id: string) => (apiBase ? `${apiBase}/marketing/agents/${encodeURIComponent(id)}` : ""),
  AGENT_EXEC: (id: string) => (apiBase ? `${apiBase}/marketing/agents/${encodeURIComponent(id)}/execute` : ""),
  CAMPAIGNS: apiBase ? `${apiBase}/marketing/campaigns` : "",
  CAMPAIGN_BY_ID: (id: string) => (apiBase ? `${apiBase}/marketing/campaigns/${encodeURIComponent(id)}` : ""),
  SEGMENTS: apiBase ? `${apiBase}/marketing/segments` : "",
  JOURNEYS: apiBase ? `${apiBase}/marketing/journeys` : "",
  TEMPLATES: apiBase ? `${apiBase}/marketing/templates` : "",
  INTEGRATIONS: apiBase ? `${apiBase}/marketing/integrations` : "",
  CORES: apiBase ? `${apiBase}/cores` : "",
  HEALTH: apiBase ? `${apiBase}/health` : "",
};
