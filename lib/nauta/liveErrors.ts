/** Map backend `detail` strings to UI banners — NAUTA_FASE_C_LIVE_REPORTE.md §2 */

export type NautaLiveBannerKind = "protected_tenant" | "cloud_upgrade" | "generic";

export interface NautaLiveBanner {
  kind: NautaLiveBannerKind;
  message: string;
}

export function resolveLiveRun403Banner(detail: string): NautaLiveBanner {
  const d = detail.toLowerCase();
  if (d.includes("protected_tenant")) {
    return {
      kind: "protected_tenant",
      message: "Su institución no permite ejecución live",
    };
  }
  if (d.includes("cloud_engine_requires_upgrade")) {
    return {
      kind: "cloud_upgrade",
      message:
        "El motor cloud requiere plan Professional o Enterprise. Actualice su suscripción Nauta para ver el navegador en vivo.",
    };
  }
  return { kind: "generic", message: detail || "Ejecución live no permitida" };
}
