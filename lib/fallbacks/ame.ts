export const FALLBACK_AME_STATUS = {
  status: "ok",
  ame: {
    overall_status: "unknown",
    mode: "unknown",
    tenant: "unknown",
    environment: "unknown",
    meta_live_enabled: false,
  },
  last_run: null,
  gates: { source: "fallback", gates: {} as Record<string, unknown> },
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

export const FALLBACK_AME_RUNS = {
  status: "ok",
  total: 0,
  runs: [] as unknown[],
  actions_feed: [] as unknown[],
  data_source: "fallback",
};
