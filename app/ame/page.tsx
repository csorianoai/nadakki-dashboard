"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { RefreshCw, Gauge } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useAMEStatus } from "@/hooks/useAMEStatus";
import { useAMERuns } from "@/hooks/useAMERuns";

const colors = {
  bg: "#0f172a",
  card: "rgba(30, 41, 59, 0.85)",
  border: "rgba(51, 65, 85, 0.6)",
  text: "#f8fafc",
  muted: "#94a3b8",
};

function DataSourceBadge({ live }: { live: boolean }) {
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: "999px",
        backgroundColor: live ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.2)",
        color: live ? "#4ade80" : colors.muted,
        border: `1px solid ${live ? "rgba(34,197,94,0.45)" : "rgba(148,163,184,0.35)"}`,
      }}
    >
      {live ? "Live" : "Reference"}
    </span>
  );
}

function Chip({ label, tone }: { label: string; tone: "gray" | "green" | "red" | "yellow" | "blue" }) {
  const map = {
    gray: { bg: "rgba(148,163,184,0.15)", fg: "#cbd5e1", bd: "rgba(148,163,184,0.35)" },
    green: { bg: "rgba(34,197,94,0.15)", fg: "#4ade80", bd: "rgba(34,197,94,0.4)" },
    red: { bg: "rgba(239,68,68,0.15)", fg: "#f87171", bd: "rgba(239,68,68,0.4)" },
    yellow: { bg: "rgba(234,179,8,0.15)", fg: "#facc15", bd: "rgba(234,179,8,0.4)" },
    blue: { bg: "rgba(59,130,246,0.15)", fg: "#60a5fa", bd: "rgba(59,130,246,0.4)" },
  };
  const t = map[tone];
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: "6px",
        backgroundColor: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
      }}
    >
      {label}
    </span>
  );
}

function modeChip(mode: string | undefined) {
  const m = (mode ?? "unknown").toLowerCase();
  if (m === "dry_run" || m === "dry-run") return <Chip label="Dry Run" tone="gray" />;
  if (m === "live") return <Chip label="Live" tone="green" />;
  return <Chip label="Unknown" tone="yellow" />;
}

function overallChip(overall: string | undefined) {
  const o = (overall ?? "unknown").toLowerCase();
  if (o === "running") return <Chip label="Running" tone="blue" />;
  if (o === "idle") return <Chip label="Idle" tone="gray" />;
  if (o === "degraded") return <Chip label="Degraded" tone="red" />;
  return <Chip label="Unknown" tone="yellow" />;
}

function resultChip(result: string | undefined) {
  const r = (result ?? "unknown").toLowerCase();
  if (["success", "completed", "ok", "succeeded"].includes(r)) return <Chip label={result ?? "ok"} tone="green" />;
  if (["failed", "error", "failure"].includes(r)) return <Chip label={result ?? "failed"} tone="red" />;
  if (["blocked", "partial"].includes(r)) return <Chip label={result ?? r} tone="yellow" />;
  return <Chip label={result ?? "—"} tone="yellow" />;
}

function actionStatusChip(status: string | undefined) {
  const s = (status ?? "").toLowerCase();
  if (s === "completed") return <Chip label="completed" tone="green" />;
  if (s === "blocked" || s === "failed") return <Chip label={status ?? "—"} tone="red" />;
  if (s === "skipped") return <Chip label="skipped" tone="yellow" />;
  if (s) return <Chip label={status} tone="yellow" />;
  return <Chip label="—" tone="gray" />;
}

function formatTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function formatDuration(start?: string, end?: string | null): string {
  if (!start) return "—";
  const a = new Date(start).getTime();
  if (Number.isNaN(a)) return "—";
  const b = end ? new Date(end).getTime() : Date.now();
  if (Number.isNaN(b)) return "—";
  const sec = Math.max(0, Math.round((b - a) / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function pickActionRow(raw: unknown, i: number) {
  const o = asRecord(raw);
  const time = formatTime(
    (o.time ?? o.timestamp ?? o.created_at ?? o.at ?? o.executed_at) as string | undefined
  );
  const entity = String(
    o.campaign ?? o.entity ?? o.campaign_name ?? o.campaign_id ?? o.target ?? "—"
  );
  const action = String(o.action ?? o.action_type ?? o.type ?? o.name ?? "—");
  const platform = String(o.platform ?? o.channel ?? "—");
  const status = String(o.status ?? "—");
  const reason = String(o.reason ?? o.message ?? o.detail ?? "—");
  return { key: String(o.id ?? i), time, entity, action, platform, status, reason };
}

function runStartedAt(o: Record<string, unknown>): string | undefined {
  return (o.started_at ?? o.start_time ?? o.created_at ?? o.begin) as string | undefined;
}

function pickRunRow(raw: unknown, i: number) {
  const o = asRecord(raw);
  const id = String(o.id ?? o.run_id ?? o.run_uuid ?? o.uuid ?? i);
  const time = formatTime(runStartedAt(o));
  const mode = String(o.mode ?? o.run_mode ?? "—");
  const result = String(o.result ?? o.status ?? o.outcome ?? "—");
  const phases = o.phase_count ?? o.phases ?? (Array.isArray(o.phase_list) ? o.phase_list.length : undefined);
  const actions = o.action_count ?? o.actions ?? (Array.isArray(o.actions_list) ? o.actions_list.length : undefined);
  return {
    key: id,
    id,
    time,
    mode,
    result,
    phases: phases === undefined || phases === null ? "—" : String(phases),
    actions: actions === undefined || actions === null ? "—" : String(actions),
  };
}

function gateLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function GateRow({ gateKey, value }: { gateKey: string; value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <span style={{ color: colors.muted, minWidth: "160px", fontSize: "12px" }}>{gateLabel(gateKey)}</span>
        <Chip label="unknown" tone="yellow" />
      </div>
    );
  }
  if (typeof value === "boolean") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <span style={{ color: colors.muted, minWidth: "160px", fontSize: "12px" }}>{gateLabel(gateKey)}</span>
        <Chip label={value ? "enabled" : "disabled"} tone={value ? "green" : "red"} />
      </div>
    );
  }
  if (typeof value === "number" || typeof value === "string") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
        <span style={{ color: colors.muted, minWidth: "160px", fontSize: "12px" }}>{gateLabel(gateKey)}</span>
        <Chip label={String(value)} tone="gray" />
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div style={{ marginBottom: "10px" }}>
        <div style={{ color: colors.muted, fontSize: "12px", marginBottom: "4px" }}>{gateLabel(gateKey)}</div>
        <div style={{ fontSize: "11px", color: colors.text, opacity: 0.9 }}>{value.join(", ")}</div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: "8px", fontSize: "11px", color: colors.muted }}>
      <strong style={{ color: colors.text }}>{gateLabel(gateKey)}:</strong> {JSON.stringify(value)}
    </div>
  );
}

type TenantOpt = { slug: string; name?: string; display_name?: string };

export default function AMEPage() {
  const { tenantId } = useTenant();
  const [refreshKey, setRefreshKey] = useState(0);
  const [pickedTenant, setPickedTenant] = useState("");
  const [tenants, setTenants] = useState<TenantOpt[]>([]);

  /** Manual tenant override, else TenantContext — passed to AME hooks as X-Tenant-ID. */
  const effectiveTenantId = useMemo(() => {
    const p = pickedTenant.trim();
    if (p) return p;
    if (tenantId && tenantId.trim()) return tenantId.trim();
    return undefined;
  }, [pickedTenant, tenantId]);

  const { data: status, source: statusSource, loading: statusLoading, error: statusErr } = useAMEStatus(
    effectiveTenantId,
    refreshKey
  );
  const { data: runs, source: runsSource, loading: runsLoading, error: runsErr } = useAMERuns(
    effectiveTenantId,
    refreshKey
  );

  const loading = statusLoading || runsLoading;
  const dataLive = statusSource === "live" && runsSource === "live";

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/tenants", { cache: "no-store" });
        const text = await res.text().catch(() => "");
        if (!res.ok || !text) return;
        const json = JSON.parse(text) as Record<string, unknown>;
        const list = (json?.data as Record<string, unknown>)?.tenants ?? json?.tenants ?? json?.data ?? json;
        const arr = (Array.isArray(list) ? list : []) as Record<string, unknown>[];
        const normalized: TenantOpt[] = arr
          .map((t) => ({
            slug: String(t.slug ?? t.tenant_id ?? t.id ?? t.name ?? "").trim(),
            name: t.name as string | undefined,
            display_name: t.display_name as string | undefined,
          }))
          .filter((t) => t.slug);
        if (!alive) return;
        setTenants(normalized);
      } catch {
        if (alive) setTenants([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ame = status.ame ?? {};
  const kpis = status.kpis ?? {};
  const lastRun = status.last_run && typeof status.last_run === "object" ? asRecord(status.last_run) : null;
  const gatesObj = status.gates?.gates ?? {};
  const gateKeys = Object.keys(gatesObj);
  const scheduler = status.scheduler ?? {};

  const runsList = Array.isArray(runs.runs) ? [...runs.runs] : [];
  runsList.sort((a, b) => {
    const ta = new Date(runStartedAt(asRecord(a)) ?? 0).getTime();
    const tb = new Date(runStartedAt(asRecord(b)) ?? 0).getTime();
    return tb - ta;
  });
  const runsDisplay = runsList.slice(0, 10).map((r, i) => pickRunRow(r, i));

  const actionsFeed = Array.isArray(runs.actions_feed) ? runs.actions_feed : [];
  const actionsDisplay = actionsFeed.slice(0, 15).map((a, i) => pickActionRow(a, i));

  const kpiVal = (n: number | undefined | null) =>
    n === undefined || n === null || Number.isNaN(Number(n)) ? "—" : String(n);

  const section = (title: string, children: ReactNode) => (
    <section
      style={{
        marginBottom: "24px",
        padding: "20px",
        borderRadius: "12px",
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <h2 style={{ fontSize: "14px", fontWeight: 700, color: colors.text, margin: "0 0 16px", letterSpacing: "0.02em" }}>
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", color: colors.text }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Gauge size={22} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Autopilot (AME)</h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: colors.muted }}>
            Read-only operational view
            {(statusErr || runsErr) && (
              <span style={{ color: "#f87171", marginLeft: "8px" }}>
                {[statusErr, runsErr].filter(Boolean).join(" · ")}
              </span>
            )}
          </p>
        </div>
        <DataSourceBadge live={dataLive} />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            background: "rgba(99,102,241,0.2)",
            color: "#c4b5fd",
            fontWeight: 600,
            fontSize: "13px",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        {tenants.length > 1 ? (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: colors.muted }}>
            <span>Tenant (X-Tenant-ID)</span>
            <select
              value={pickedTenant}
              onChange={(e) => setPickedTenant(e.target.value)}
              style={{
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "8px 12px",
                minWidth: "200px",
              }}
            >
              <option value="">Dashboard tenant / unscoped</option>
              {tenants.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.display_name || t.name || t.slug}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: colors.muted }}>
            <span>Optional tenant override</span>
            <input
              value={pickedTenant}
              onChange={(e) => setPickedTenant(e.target.value)}
              placeholder={tenantId ? `Default: ${tenantId}` : "X-Tenant-ID"}
              style={{
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "8px 12px",
                minWidth: "220px",
              }}
            />
          </label>
        )}
      </div>

      {section(
        "Header / Operational identity",
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ fontSize: "13px", color: colors.muted }}>
            Tenant: <span style={{ color: colors.text }}>{String(ame.tenant ?? "—")}</span>
          </div>
          <div style={{ fontSize: "13px", color: colors.muted }}>
            Environment: <span style={{ color: colors.text }}>{String(ame.environment ?? "—")}</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: colors.muted }}>Mode</span>
            {modeChip(String(ame.mode ?? ""))}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: colors.muted }}>Overall</span>
            {overallChip(String(ame.overall_status ?? ""))}
          </div>
        </div>
      )}

      {section(
        "KPI strip",
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            { label: "Last Run", value: lastRun ? formatTime(runStartedAt(lastRun)) : "No runs yet" },
            { label: "Runs Total", value: kpiVal(runs.total) },
            { label: "Actions", value: kpiVal(kpis.actions_executed as number | undefined) },
            { label: "Blocked", value: kpiVal(kpis.actions_blocked as number | undefined) },
            { label: "Phases OK", value: kpiVal(kpis.phases_ok as number | undefined) },
            {
              label: "Phases Fail",
              value: kpiVal(kpis.phases_fail as number | undefined),
              danger: Number(kpis.phases_fail) > 0,
            },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(15,23,42,0.6)",
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: "10px", color: colors.muted, textTransform: "uppercase", marginBottom: "6px" }}>
                {c.label}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: (c as { danger?: boolean }).danger ? "#f87171" : colors.text,
                }}
              >
                {c.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {section(
        "Last run summary",
        !lastRun ? (
          <p style={{ color: colors.muted, margin: 0, fontSize: "13px" }}>
            No runs recorded yet. Run the pilot to see data here.
          </p>
        ) : (
          <div style={{ fontSize: "13px", display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <span style={{ color: colors.muted }}>Run ID</span>
              <span>{String(lastRun.id ?? lastRun.run_id ?? "—")}</span>
              {resultChip(String(lastRun.result ?? lastRun.status ?? lastRun.outcome))}
            </div>
            <div>
              <span style={{ color: colors.muted }}>Started:</span> {formatTime(runStartedAt(lastRun))} ·{" "}
              <span style={{ color: colors.muted }}>Ended:</span>{" "}
              {lastRun.ended_at ? formatTime(String(lastRun.ended_at)) : "In progress"}
            </div>
            <div>
              <span style={{ color: colors.muted }}>Duration:</span>{" "}
              {formatDuration(
                runStartedAt(lastRun),
                lastRun.ended_at ? String(lastRun.ended_at) : null
              )}
            </div>
            <div>
              <span style={{ color: colors.muted }}>Mode:</span> {String(lastRun.mode ?? "—")} ·{" "}
              <span style={{ color: colors.muted }}>Tenant:</span> {String(lastRun.tenant ?? ame.tenant ?? "—")}
            </div>
            <div>
              <span style={{ color: colors.muted }}>Phase count:</span>{" "}
              {lastRun.phase_count != null
                ? String(lastRun.phase_count)
                : Array.isArray(lastRun.phases)
                  ? String(lastRun.phases.length)
                  : "—"}{" "}
              · <span style={{ color: colors.muted }}>Action count:</span>{" "}
              {lastRun.action_count != null
                ? String(lastRun.action_count)
                : Array.isArray(lastRun.actions)
                  ? String(lastRun.actions.length)
                  : "—"}
            </div>
          </div>
        )
      )}

      {section(
        "Actions feed",
        actionsDisplay.length === 0 ? (
          <p style={{ color: colors.muted, margin: 0, fontSize: "13px" }}>No actions recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ color: colors.muted, textAlign: "left" }}>
                  {["Time", "Campaign / Entity", "Action", "Platform", "Status", "Reason"].map((h) => (
                    <th key={h} style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actionsDisplay.map((row) => (
                  <tr key={row.key}>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.time}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.entity}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.action}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.platform}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>
                      {actionStatusChip(row.status)}
                    </td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}`, color: colors.muted }}>
                      {row.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {section(
        "Gates status",
        gateKeys.length === 0 ? (
          <p style={{ color: colors.muted, margin: 0, fontSize: "13px" }}>
            Gates state unavailable — showing reference.
          </p>
        ) : (
          <div>
            {gateKeys.map((k) => (
              <GateRow key={k} gateKey={k} value={gatesObj[k]} />
            ))}
          </div>
        )
      )}

      {section(
        "Scheduler status",
        !scheduler || Object.keys(scheduler).length === 0 ? (
          <p style={{ color: colors.muted, margin: 0, fontSize: "13px" }}>
            Scheduler state not available.
          </p>
        ) : (
          <div style={{ fontSize: "13px", display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: colors.muted }}>Enabled</span>
              <Chip
                label={scheduler.enabled ? "YES" : "NO"}
                tone={scheduler.enabled ? "green" : "gray"}
              />
            </div>
            <div>
              <span style={{ color: colors.muted }}>Source:</span> {String(scheduler.source ?? "—")}
            </div>
            {Object.entries(scheduler)
              .filter(([k]) => k !== "enabled" && k !== "source")
              .map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: colors.muted }}>{gateLabel(k)}:</span>{" "}
                  <span style={{ color: colors.text }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
          </div>
        )
      )}

      {section(
        "Recent runs table",
        runsDisplay.length === 0 ? (
          <p style={{ color: colors.muted, margin: 0, fontSize: "13px" }}>No run history available.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ color: colors.muted, textAlign: "left" }}>
                  {["Run ID", "Time", "Mode", "Result", "Phases", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runsDisplay.map((row) => (
                  <tr key={row.key}>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.id}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.time}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.mode}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>
                      {resultChip(row.result)}
                    </td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.phases}</td>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{row.actions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
