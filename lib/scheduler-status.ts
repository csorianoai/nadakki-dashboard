/**
 * Live scheduler status from backend GET /api/v1/scheduler/status (read-only).
 */

export type AmeAutopilotStatus = {
  job_id?: string;
  schedule?: string;
  job_running?: boolean;
  last_run_at?: string | null;
  last_error?: string | null;
  last_run_summary?: string | null;
  next_timeslices?: string[];
  dry_run_mode?: boolean;
};

export type SchedulerStatusPayload = {
  enabled?: boolean;
  running?: boolean;
  mode?: string;
  jobs_count?: number;
  tenant_support?: boolean;
  timestamp?: string;
  ame_autopilot?: AmeAutopilotStatus;
};

function statusUrls(): string[] {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (base) {
    return [`${base}/api/v1/scheduler/status`, "/api/v1/scheduler/status"];
  }
  return ["/api/v1/scheduler/status"];
}

export async function fetchSchedulerStatus(): Promise<
  { ok: true; data: SchedulerStatusPayload } | { ok: false; error: string }
> {
  let lastErr = "Sin respuesta";
  for (const url of statusUrls()) {
    try {
      const r = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!r.ok) {
        lastErr = `HTTP ${r.status}`;
        continue;
      }
      const data = (await r.json()) as SchedulerStatusPayload;
      return { ok: true, data };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false, error: lastErr };
}

export function formatBool(v: boolean | undefined): string {
  if (v === undefined) return "—";
  return v ? "Sí" : "No";
}
