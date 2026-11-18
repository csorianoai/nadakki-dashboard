"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/fetch-client";
import { normalizarEstado, urlGoogleAuth, type EstadoGoogleAds } from "@/components/google-ads/ConectarGoogleAds";

export type EstadoGoogle = { estado: EstadoGoogleAds | "loading"; email: string | null };

/** Etiquetas de la tabla de estados (misma que ConectarGoogleAds): una sola fuente para las pantallas. */
export const TEXTO_ESTADO_GOOGLE: Record<EstadoGoogleAds, string> = {
  connected: "Conectado",
  expired: "La conexión venció",
  not_connected: "No conectado",
  unknown: "No pudimos comprobar la conexión",
};

/**
 * Estado de Google leído de GET /auth/google/status/{tenant} → connection_status (probado contra Google).
 * Nunca usa needs_refresh (caducidad del access token, que se renueva solo). Tenant: el de la sesión.
 */
export function useEstadoGoogle(tenantId: string | null | undefined, recargar = 0): EstadoGoogle {
  const [res, setRes] = useState<EstadoGoogle>({ estado: "loading", email: null });

  useEffect(() => {
    if (!tenantId) {
      setRes({ estado: "unknown", email: null });
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const r = await apiFetch(urlGoogleAuth("status", tenantId), {
          credentials: "omit",
          headers: { Accept: "application/json" },
        });
        const body = r.ok ? await r.json().catch(() => null) : null;
        const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
        const mail = [b.user_email, b.email].find((v) => typeof v === "string" && v) as string | undefined;
        if (vivo) setRes({ estado: normalizarEstado(body), email: mail ?? null });
      } catch {
        if (vivo) setRes({ estado: "unknown", email: null });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [tenantId, recargar]);

  return res;
}
