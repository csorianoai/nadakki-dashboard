const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const AME_ENDPOINTS = {
  HEALTH: apiBase ? `${apiBase}/api/v1/ame/health` : "",
  STATUS: apiBase ? `${apiBase}/api/v1/ame/status` : "",
  RUNS: apiBase ? `${apiBase}/api/v1/ame/runs` : "",
};
