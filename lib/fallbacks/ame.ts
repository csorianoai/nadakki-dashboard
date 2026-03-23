export type AMEStatusData = {
  status?: string;
  ame?: {
    overall_status?: string;
    mode?: string;
    tenant?: string;
    environment?: string;
    meta_live_enabled?: boolean;
    [k: string]: unknown;
  };
  last_run?: Record<string, unknown> | null;
  gates?: { source?: string; gates?: Record<string, unknown> };
  scheduler?: Record<string, unknown>;
  kpis?: {
    runs_available?: number;
    actions_executed?: number;
    actions_blocked?: number;
    phases_ok?: number;
    phases_fail?: number;
    [k: string]: unknown;
  };
  data_sources?: Record<string, string>;
};

export const FALLBACK_AME_STATUS: AMEStatusData = {
  status: "ok",
  ame: {
    overall_status: "unknown",
    mode: "unknown",
    tenant: "unknown",
    environment: "unknown",
    meta_live_enabled: false,
  },
  last_run: null,
  gates: { source: "fallback", gates: {} },
  scheduler: { enabled: false, source: "fallback" },
  kpis: {
    runs_available: 0,
    actions_executed: 0,
    actions_blocked: 0,
    phases_ok: 0,
    phases_fail: 0,
  },
  data_sources: {
    pilot_log: "fallback",
    gates: "fallback",
    scheduler: "fallback",
  },
};

export type AMERunsData = {
  status?: string;
  total?: number;
  runs?: unknown[];
  actions_feed?: unknown[];
  data_source?: string;
  logs_dir?: string;
  [k: string]: unknown;
};

export const FALLBACK_AME_RUNS: AMERunsData = {
  status: "ok",
  total: 0,
  runs: [],
  actions_feed: [],
  data_source: "fallback",
};
