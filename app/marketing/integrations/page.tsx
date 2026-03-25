"use client";

/**
 * Integraciones — hub honesto (solo lectura).
 * Estado: GET /api/social/status/{tenant} + GET /api/v1/tenants/{tenant}/config
 * Gestión real: /marketing/social-connections y /admin/config
 */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plug,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { fetchSocialStatus } from "@/lib/api/marketing";

type ConnState = "connected" | "disconnected" | "error" | "unknown";
type SendgridState = "configured" | "not_configured" | "unknown";

type SocialRow = {
  platform: string;
  connected?: boolean;
  needs_refresh?: boolean;
  [k: string]: unknown;
};

function getPlatformKey(platform: string): string {
  const lower = platform.toLowerCase();
  if (lower === "facebook" || lower === "instagram") return "meta";
  return lower;
}

function normalizePlatformsFromPayload(data: Record<string, unknown> | null): SocialRow[] {
  if (!data || typeof data !== "object") return [];
  const anyData = data as Record<string, unknown>;
  const platformsValue = anyData.platforms;

  if (Array.isArray(platformsValue)) {
    return platformsValue as SocialRow[];
  }
  if (platformsValue && typeof platformsValue === "object") {
    return Object.entries(platformsValue as Record<string, unknown>).map(([platform, info]) => ({
      platform,
      ...(typeof info === "object" && info ? (info as Record<string, unknown>) : {}),
      connected: (info as Record<string, unknown>)?.connected === true,
    }));
  }
  if (Array.isArray(anyData.connections)) {
    return anyData.connections as SocialRow[];
  }
  return Object.entries(anyData)
    .filter(([key]) => key !== "tenant_id")
    .map(([platform, info]) => ({
      platform,
      ...(typeof info === "object" && info ? (info as Record<string, unknown>) : {}),
      connected: (info as Record<string, unknown>)?.connected === true,
    }));
}

function deriveConnState(rows: SocialRow[], key: "meta" | "google", statusError: boolean): ConnState {
  if (statusError) return "unknown";
  const map = new Map(rows.map((p) => [getPlatformKey(p.platform), p]));
  const p = map.get(key);
  if (!p) return "unknown";
  if (p.connected && p.needs_refresh) return "error";
  if (p.connected) return "connected";
  return "disconnected";
}

async function fetchSendgridState(tenantId: string): Promise<SendgridState> {
  try {
    const r = await fetch(`/api/v1/tenants/${encodeURIComponent(tenantId)}/config`, {
      method: "GET",
      headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
    });
    if (r.status === 404) return "not_configured";
    if (!r.ok) return "unknown";
    const j = (await r.json()) as { data?: { sendgrid_live_enabled?: boolean } };
    const d = j?.data;
    if (d?.sendgrid_live_enabled === true) return "configured";
    if (d?.sendgrid_live_enabled === false) return "not_configured";
    return "unknown";
  } catch {
    return "unknown";
  }
}

function StateBadge({ label, variant }: { label: string; variant: "ok" | "off" | "warn" | "muted" }) {
  const cls =
    variant === "ok"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : variant === "off"
        ? "bg-white/10 text-gray-400 border-white/15"
        : variant === "warn"
          ? "bg-amber-500/15 text-amber-200 border-amber-500/35"
          : "bg-white/5 text-gray-500 border-white/10";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cls}`}>
      {variant === "ok" ? <CheckCircle2 className="w-3 h-3" /> : null}
      {variant === "off" ? <XCircle className="w-3 h-3" /> : null}
      {variant === "warn" ? <AlertCircle className="w-3 h-3" /> : null}
      {variant === "muted" ? <HelpCircle className="w-3 h-3" /> : null}
      {label}
    </span>
  );
}

function connBadge(state: ConnState) {
  switch (state) {
    case "connected":
      return <StateBadge variant="ok" label="Conectado" />;
    case "disconnected":
      return <StateBadge variant="off" label="Desconectado" />;
    case "error":
      return <StateBadge variant="warn" label="Error / revisar token" />;
    default:
      return <StateBadge variant="muted" label="Desconocido" />;
  }
}

function sendgridBadge(state: SendgridState) {
  switch (state) {
    case "configured":
      return <StateBadge variant="ok" label="Configurado" />;
    case "not_configured":
      return <StateBadge variant="off" label="No configurado" />;
    default:
      return <StateBadge variant="muted" label="Desconocido" />;
  }
}

export default function IntegrationsPage() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socialErr, setSocialErr] = useState<string | null>(null);
  const [metaState, setMetaState] = useState<ConnState>("unknown");
  const [googleState, setGoogleState] = useState<ConnState>("unknown");
  const [sendgridState, setSendgridState] = useState<SendgridState>("unknown");

  const load = useCallback(async () => {
    if (!tenantId) {
      setSocialErr("Selecciona un tenant.");
      setMetaState("unknown");
      setGoogleState("unknown");
      setSendgridState("unknown");
      setLoading(false);
      return;
    }
    setSocialErr(null);

    const social = await fetchSocialStatus(tenantId);
    const statusError = Boolean(social.error);
    if (statusError) {
      setSocialErr(social.error ?? "No se pudo leer el estado social.");
    }
    const payload =
      social.data && typeof social.data === "object"
        ? (social.data as Record<string, unknown>)
        : null;
    const rows = normalizePlatformsFromPayload(payload);
    setMetaState(deriveConnState(rows, "meta", statusError));
    setGoogleState(deriveConnState(rows, "google", statusError));

    setSendgridState(await fetchSendgridState(tenantId));
    setLoading(false);
    setRefreshing(false);
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <div className="ndk-page ndk-fade-in min-h-screen text-white p-6">
      <NavigationBar backHref="/marketing">
        <span className="text-sm text-gray-400">Integraciones</span>
      </NavigationBar>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 shrink-0">
            <Plug className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0">Integraciones</h1>
            <p className="text-gray-400 mt-1 m-0 max-w-xl">
              Estado real de conexiones activas y configuración disponible. La conexión OAuth y envío en vivo se gestionan
              en las páginas enlazadas — esta vista no modifica integraciones.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing || !tenantId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-gray-200 disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar estado
        </button>
      </div>

      {socialErr ? (
        <GlassCard className="p-4 mb-6 border-amber-500/25 bg-amber-500/5">
          <p className="text-amber-100/90 text-sm m-0 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {socialErr} Los indicadores OAuth pueden mostrar &quot;Desconocido&quot; hasta que el API responda.
          </p>
        </GlassCard>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-white mb-3">Integraciones activas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <GlassCard className="p-5 border-white/10">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-white font-semibold m-0">Meta</h3>
                  <p className="text-sm text-gray-500 m-0 mt-1">
                    Facebook e Instagram (OAuth). Estado según el mismo endpoint que Conexiones sociales.
                  </p>
                </div>
                {connBadge(metaState)}
              </div>
              <Link
                href="/marketing/social-connections"
                className="mt-4 inline-flex items-center gap-2 text-sm text-teal-300 hover:text-teal-200"
              >
                Administrar en Conexiones sociales
                <ArrowRight className="w-4 h-4" />
              </Link>
            </GlassCard>

            <GlassCard className="p-5 border-white/10">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-white font-semibold m-0">Google</h3>
                  <p className="text-sm text-gray-500 m-0 mt-1">
                    Google (Ads, Analytics, YouTube) vía OAuth. Estado según respuesta del backend.
                  </p>
                </div>
                {connBadge(googleState)}
              </div>
              <Link
                href="/marketing/social-connections"
                className="mt-4 inline-flex items-center gap-2 text-sm text-teal-300 hover:text-teal-200"
              >
                Administrar en Conexiones sociales
                <ArrowRight className="w-4 h-4" />
              </Link>
            </GlassCard>
          </div>

          <h2 className="text-lg font-semibold text-white mb-3">Envío de email</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <GlassCard className="p-5 border-white/10">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-white font-semibold m-0">SendGrid</h3>
                  <p className="text-sm text-gray-500 m-0 mt-1">
                    Flag <code className="text-gray-400">sendgrid_live_enabled</code> del tenant (entorno y políticas del
                    backend). No se muestran secretos.
                  </p>
                </div>
                {sendgridBadge(sendgridState)}
              </div>
              <Link
                href="/admin/config"
                className="mt-4 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200"
              >
                Configurar en Administración
                <ArrowRight className="w-4 h-4" />
              </Link>
            </GlassCard>
          </div>

          <h2 className="text-lg font-semibold text-white mb-3">Próximamente</h2>
          <p className="text-sm text-gray-500 mb-4 m-0">
            Sin conexión simulada ni botones de OAuth. Integraciones planificadas:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["TikTok", "LinkedIn", "X", "Pinterest"] as const).map((name) => (
              <GlassCard key={name} className="p-4 border-white/10 opacity-80">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white text-sm font-medium">{name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 border border-white/10">
                    Próximamente
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
