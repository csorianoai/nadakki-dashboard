/**
 * Minimal Prometheus text exposition parser (instant vectors + histogram buckets + summary quantiles).
 */

export interface PrometheusSample {
  name: string;
  labels: Record<string, string>;
  value: number;
}

const LINE_RE =
  /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{([^}]*)\})?\s+(-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:\s+(\d+))?$/;

function parseLabelPairs(raw: string): Record<string, string> {
  const labels: Record<string, string> = {};
  if (!raw.trim()) return labels;
  for (const part of raw.split(",")) {
    const kv = part.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"(.*?)"\s*$/);
    if (kv) {
      const v = kv[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      labels[kv[1]] = v;
    }
  }
  return labels;
}

export function parsePrometheusText(body: string): PrometheusSample[] {
  const samples: PrometheusSample[] = [];
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.startsWith("#")) continue;
    const m = line.match(LINE_RE);
    if (!m) continue;
    const name = m[1];
    const labelStr = m[3] ?? "";
    const value = Number(m[4]);
    if (!Number.isFinite(value)) continue;
    samples.push({ name, labels: parseLabelPairs(labelStr), value });
  }
  return samples;
}

function parseLe(le: string): number {
  if (le === "+Inf" || le === "inf") return Number.POSITIVE_INFINITY;
  const n = Number(le);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function labelKey(labels: Record<string, string>, omit: Set<string>): string {
  return Object.keys(labels)
    .filter((k) => !omit.has(k))
    .sort()
    .map((k) => `${k}=${labels[k]}`)
    .join("|");
}

function toMilliseconds(name: string, v: number): number {
  if (name.includes("seconds")) return v * 1000;
  return v;
}

export interface EndpointLatencyStats {
  endpoint: string;
  p50: number;
  p95: number;
  p99: number;
}

/** Group labels used to name an "endpoint" in charts */
const ROUTE_LABELS = ["handler", "route", "path", "endpoint", "uri"];

function endpointLabelFrom(labels: Record<string, string>): string {
  for (const k of ROUTE_LABELS) {
    const v = labels[k];
    if (v && v.trim()) return v.trim();
  }
  return "aggregated";
}

export function buildEndpointLatencyStats(samples: PrometheusSample[]): EndpointLatencyStats[] {
  const merged = new Map<
    string,
    { metric: string; endpoint: string; buckets: Map<number, number> }
  >();
  for (const s of samples) {
    if (!s.name.endsWith("_bucket")) continue;
    const leStr = s.labels.le;
    if (leStr == null) continue;
    const endpoint = endpointLabelFrom(s.labels);
    const key = `${s.name}|${labelKey(s.labels, new Set(["le"]))}`;
    if (!merged.has(key)) {
      merged.set(key, { metric: s.name, endpoint, buckets: new Map() });
    }
    merged.get(key)!.buckets.set(parseLe(leStr), s.value);
  }

  const out: EndpointLatencyStats[] = [];
  for (const { metric, endpoint, buckets } of merged.values()) {
    const entries = [...buckets.entries()].filter(([le]) => Number.isFinite(le));
    entries.sort((a, b) => a[0] - b[0]);
    if (!entries.length) continue;
    const inf = buckets.get(Number.POSITIVE_INFINITY);
    const total =
      inf ??
      entries.reduce((max, [, c]) => {
        const n = Number(c);
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0);
    if (total <= 0) continue;

    const q = (p: number) => {
      const target = p * total;
      for (const [le, cum] of entries) {
        if (cum >= target) return toMilliseconds(metric, le);
      }
      const lastLe = entries[entries.length - 1]?.[0] ?? 0;
      return toMilliseconds(metric, lastLe);
    };

    out.push({
      endpoint,
      p50: q(0.5),
      p95: q(0.95),
      p99: q(0.99),
    });
  }

  // Summary quantiles (alternative exposition)
  const summaryGroups = new Map<
    string,
    { endpoint: string; metric: string; quantiles: Map<string, number> }
  >();
  for (const s of samples) {
    const q = s.labels.quantile;
    if (q == null) continue;
    const endpoint = endpointLabelFrom(s.labels);
    const omit = new Set(["quantile"]);
    const sig = `${s.name}|${labelKey(s.labels, omit)}`;
    if (!summaryGroups.has(sig)) {
      summaryGroups.set(sig, { endpoint, metric: s.name, quantiles: new Map() });
    }
    summaryGroups.get(sig)!.quantiles.set(q, s.value);
  }

  for (const { endpoint, metric, quantiles } of summaryGroups.values()) {
    const g = (k: string) => {
      const v = quantiles.get(k);
      return v != null && Number.isFinite(v) ? toMilliseconds(metric, v) : null;
    };
    const p50 = g("0.5") ?? g("0.50");
    const p95 = g("0.95");
    const p99 = g("0.99");
    if (p50 != null && p95 != null && p99 != null) {
      out.push({ endpoint, p50, p95, p99 });
    }
  }

  const dedup = new Map<string, EndpointLatencyStats>();
  for (const row of out) {
    dedup.set(row.endpoint, row);
  }
  return [...dedup.values()].sort((a, b) => a.endpoint.localeCompare(b.endpoint));
}

export interface TenantErrorSlice {
  tenant: string;
  errors: number;
  total: number;
}

function tenantKey(labels: Record<string, string>): string {
  return (
    labels.tenant ??
    labels.tenant_id ??
    labels.tenantId ??
    labels.org ??
    labels.client ??
    "default"
  );
}

export function buildTenantErrorSlices(samples: PrometheusSample[]): TenantErrorSlice[] {
  const counters = new Map<string, { errors: number; total: number }>();

  for (const s of samples) {
    const ln = s.name.toLowerCase();
    if (!ln.includes("request") && !ln.includes("http") && !ln.includes("response")) continue;
    if (!ln.includes("total") && !ln.includes("count")) continue;

    const tenant = tenantKey(s.labels);
    const st = (s.labels.status ?? s.labels.code ?? "").trim();
    const isErr = /^5\d\d$/.test(st) || st === "5xx" || st === "error";

    if (!counters.has(tenant)) counters.set(tenant, { errors: 0, total: 0 });
    const c = counters.get(tenant)!;
    c.total += s.value;
    if (isErr) c.errors += s.value;
  }

  if (counters.size === 0) {
    for (const s of samples) {
      if (!s.name.toLowerCase().includes("error")) continue;
      const tenant = tenantKey(s.labels);
      if (!counters.has(tenant)) counters.set(tenant, { errors: 0, total: 0 });
      counters.get(tenant)!.errors += s.value;
    }
    for (const s of samples) {
      const ln = s.name.toLowerCase();
      if (!ln.includes("request") || !ln.includes("total")) continue;
      const tenant = tenantKey(s.labels);
      if (!counters.has(tenant)) counters.set(tenant, { errors: 0, total: 0 });
      counters.get(tenant)!.total += s.value;
    }
  }

  return [...counters.entries()]
    .map(([tenant, v]) => ({ tenant, errors: v.errors, total: Math.max(v.total, v.errors) }))
    .filter((x) => x.total > 0);
}

/** Single scalar error rate % for the active tenant (or global). */
export function computeErrorRatePercent(slices: TenantErrorSlice[], tenantId?: string): number | null {
  if (!slices.length) return null;
  const tid = tenantId?.trim().toLowerCase();
  const slice =
    tid != null && tid.length > 0
      ? slices.find((s) => s.tenant.toLowerCase() === tid) ?? slices[0]
      : slices[0];
  if (slice.total <= 0) return null;
  return Math.min(100, Math.max(0, (slice.errors / slice.total) * 100));
}
