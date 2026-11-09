"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api/base";
import { tokenStorage } from "@/lib/auth/token-storage";
import { useTenant } from "@/contexts/TenantContext";

export type EstadoGoogleAds = "connected" | "expired" | "not_connected" | "unknown";

/** Cualquier valor fuera de los cuatro exactos (o respuesta rara) es "unknown". */
export function normalizarEstado(body: unknown): EstadoGoogleAds {
  if (!body || typeof body !== "object") return "unknown";
  const s = (body as Record<string, unknown>).status;
  return s === "connected" || s === "expired" || s === "not_connected" ? s : "unknown";
}

function cabeceras(): Record<string, string> {
  const token = tokenStorage.getAccessToken();
  return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function ConectarGoogleAds({
  navegar = (url: string) => window.location.assign(url),
}: {
  /** Abre la URL en la misma pestaña (inyectable para pruebas). */
  navegar?: (url: string) => void;
} = {}) {
  const { tenantId } = useTenant();
  const [estado, setEstado] = useState<EstadoGoogleAds | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      setEstado("unknown");
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/auth/google/status/${encodeURIComponent(tenantId)}`, {
          headers: cabeceras(),
        });
        const body = r.ok ? await r.json().catch(() => null) : null;
        if (vivo) setEstado(normalizarEstado(body));
      } catch {
        if (vivo) setEstado("unknown");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [tenantId]);

  const conectar = useCallback(async () => {
    if (!tenantId) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/auth/google/connect/${encodeURIComponent(tenantId)}`, {
        headers: cabeceras(),
      });
      const body = r.ok ? await r.json().catch(() => null) : null;
      const url = body && typeof body.authorization_url === "string" ? body.authorization_url : "";
      if (!url) throw new Error("sin url");
      navegar(url);
    } catch {
      setError("No pudimos iniciar la conexión con Google Ads. Inténtalo de nuevo en unos minutos.");
    } finally {
      setBusy(false);
    }
  }, [tenantId, navegar]);

  const boton = (texto: string) => (
    <button
      type="button"
      onClick={() => void conectar()}
      disabled={busy || !tenantId}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {texto}
    </button>
  );

  return (
    <section
      data-testid="conectar-google-ads"
      className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2"
    >
      <h2 className="text-lg font-semibold">Conexión con Google Ads</h2>
      {estado === "loading" && <p className="text-sm text-gray-500">Comprobando la conexión…</p>}
      {estado === "connected" && (
        <p className="text-sm">
          <strong>Conectado.</strong> Nadakki solo usa los permisos que autorizaste en Google y puedes
          revocarlos desde tu cuenta de Google.
        </p>
      )}
      {estado === "expired" && (
        <>
          <p className="text-sm">La conexión venció.</p>
          {boton("Reconectar")}
        </>
      )}
      {estado === "not_connected" && boton("Conectar Google Ads")}
      {estado === "unknown" && <p className="text-sm">No pudimos comprobar la conexión ahora.</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
