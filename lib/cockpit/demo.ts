/**
 * DEMO-only fallbacks when platform endpoints return 404/501 or data_source:"none".
 * Never presented without DemoPanelBadge.
 */
import type {
  ActivityResponse,
  AlertsResponse,
  CoresSummaryResponse,
  NetworkHealthResponse,
} from "./types";

export const DEMO_LABEL = "DEMO — datos de ejemplo";

export function demoNetworkHealth(): NetworkHealthResponse {
  return {
    data_source: "none",
    active_tenants: 3,
    operations_today: 128,
    open_alerts: 2,
    semaphore: "yellow",
    uptime_pct: 99.2,
  };
}

export function demoCoresSummary(): CoresSummaryResponse {
  return {
    data_source: "none",
    cores: [
      {
        core_code: "credit_hub",
        display_name: "Credit Hub",
        status: "healthy",
        color_hex: "#2563eb",
        semaphore: "green",
        metrics: [
          { label: "Solicitudes hoy", value: 42 },
          { label: "Tasa aprobación", value: "68%" },
        ],
        sparkline_7d: [12, 18, 15, 22, 19, 25, 28],
        data_source: "none",
      },
      {
        core_code: "legal",
        display_name: "Legal Core",
        status: "degraded",
        color_hex: "#7c3aed",
        semaphore: "yellow",
        metrics: [{ label: "Expedientes", value: 17 }],
        sparkline_7d: [4, 5, 4, 6, 5, 7, 6],
        data_source: "none",
      },
    ],
  };
}

export function demoActivity(): ActivityResponse {
  return {
    data_source: "none",
    items: [
      { id: "d1", core_code: "credit_hub", message: "Nueva solicitud recibida", at: new Date().toISOString(), actor: "sistema" },
      { id: "d2", core_code: "legal", message: "Expediente actualizado", at: new Date().toISOString(), actor: "analista" },
    ],
  };
}

export function demoAlerts(): AlertsResponse {
  return {
    data_source: "none",
    alerts: [
      {
        id: "a1",
        core_code: "credit_hub",
        severity: "medium",
        title: "Latencia elevada en cola",
        status: "open",
        created_at: new Date().toISOString(),
      },
    ],
  };
}

export function isDemoSource(src: string | undefined): boolean {
  return src === "none" || src === undefined;
}
