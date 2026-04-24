/** Normalized view of GET /api/v1/system/agents/summary (shape may vary). */
export type AgentRegistryCountKind = "executable" | "official";

export type ParsedAgentRegistrySummary = {
  displayCount: number;
  countKind: AgentRegistryCountKind;
  live?: number;
  feature_flagged?: number;
  duplicate?: number;
  hidden?: number;
  broken?: number;
  totalDeclaredSurface?: number;
};
