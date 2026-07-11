/**
 * DEMO-only fallbacks when platform endpoints return 404/501 or data_source:"none".
 * Never presented without DemoPanelBadge.
 */
import type {
  ActivityResponse,
  AlertsResponse,
  CoresSummaryResponse,
  CoreSummaryItem,
  NetworkHealthResponse,
} from "./types";
import {
  CORE_COLOR_FALLBACK,
  CORE_DISPLAY_FALLBACK,
  type PlatformCoreCode,
} from "./core-registry";

export const DEMO_LABEL = "DEMO — datos de ejemplo";

function demoCore(code: PlatformCoreCode): CoreSummaryItem {
  return {
    core_code: code,
    display_name: CORE_DISPLAY_FALLBACK[code],
    status: code === "credit_hub" ? "healthy" : "unknown",
    color_hex: CORE_COLOR_FALLBACK[code],
    semaphore: code === "credit_hub" ? "green" : "yellow",
    metrics: [{ label: "Actividad", value: "—" }],
    sparkline_7d: [3, 5, 4, 6, 5, 7, 6],
    data_source: "none",
  };
}

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
  const codes: PlatformCoreCode[] = [
    "credit_hub",
    "legal",
    "marketing",
    "sic",
    "nauta",
    "contable",
  ];
  return {
    data_source: "none",
    cores: codes.map((code) => {
      const base = demoCore(code);
      if (code === "credit_hub") {
        return {
          ...base,
          metrics: [
            { label: "Solicitudes hoy", value: 42 },
            { label: "Tasa aprobación", value: "68%" },
          ],
          sparkline_7d: [12, 18, 15, 22, 19, 25, 28],
        };
      }
      if (code === "legal") {
        return { ...base, status: "degraded", metrics: [{ label: "Expedientes", value: 17 }] };
      }
      return base;
    }),
  };
}

/** Single core DEMO stub when merging API partial response. */
export function demoCoreByCode(code: PlatformCoreCode): CoreSummaryItem {
  return demoCore(code);
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
