/** Shared cockpit API types — data_source drives DEMO badge (zero false greens). */

export type DataSource = "live" | "none";

export interface WithDataSource {
  data_source?: DataSource;
}

export interface NetworkHealthResponse extends WithDataSource {
  active_tenants?: number;
  operations_today?: number;
  open_alerts?: number;
  semaphore?: "green" | "yellow" | "red";
  uptime_pct?: number;
}

export interface CoreMetric {
  label: string;
  value: string | number;
}

export interface CoreSummaryItem extends WithDataSource {
  core_code: string;
  display_name: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  color_hex?: string;
  metrics?: CoreMetric[];
  semaphore?: "green" | "yellow" | "red";
  sparkline_7d?: number[];
}

export interface CoresSummaryResponse extends WithDataSource {
  cores: CoreSummaryItem[];
}

export interface ActivityItem {
  id: string;
  core_code: string;
  message: string;
  at: string;
  actor?: string;
}

export interface ActivityResponse extends WithDataSource {
  items: ActivityItem[];
}

export interface AlertItem {
  id: string;
  core_code: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message?: string;
  status: "open" | "acknowledged" | "closed";
  created_at: string;
}

export interface AlertsResponse extends WithDataSource {
  alerts: AlertItem[];
}

export type CockpitLevel = "network" | "credit" | "platform";
