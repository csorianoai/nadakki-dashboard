"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { motion } from "@/lib/motion-stub";
import {
  Share2,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useSocialConnections } from "@/hooks/useSocialConnections";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";

const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    Icon: ComponentType<{ className?: string }>;
    color: string;
    enabled: boolean;
  }
> = {
  meta: {
    name: "Meta (Facebook + Instagram)",
    Icon: Facebook,
    color: "#1877F2",
    enabled: true,
  },
  google: {
    name: "Google (Ads + Analytics + YouTube)",
    Icon: Youtube,
    color: "#EA4335",
    enabled: true,
  },
  tiktok: { name: "TikTok", Icon: Share2, color: "#000000", enabled: false },
  linkedin: { name: "LinkedIn", Icon: Linkedin, color: "#0A66C2", enabled: false },
  x: { name: "X (Twitter)", Icon: Twitter, color: "#000000", enabled: false },
  pinterest: { name: "Pinterest", Icon: Share2, color: "#E60023", enabled: false },
};

const PLATFORM_ORDER = ["meta", "google", "tiktok", "linkedin", "x", "pinterest"];

function getPlatformFromData(platform: string): string {
  const lower = platform.toLowerCase();
  if (lower === "facebook" || lower === "instagram") return "meta";
  return lower;
}

export default function SocialConnectionsClient() {
  const { tenantId } = useTenant();
  const { platforms, loading, refreshing, error, connect, disconnect, fetchStatus } =
    useSocialConnections();

  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuKey) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("[data-social-menu]")) return;
      setOpenMenuKey(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openMenuKey]);

  const platformMap = new Map(
    platforms.map((p) => [getPlatformFromData(p.platform), p])
  );

  const onQuietRefresh = () => {
    void fetchStatus(undefined, { quiet: true });
  };

  const onDisconnectPlatform = useCallback(
    async (platformKey: string, platformLabel: string) => {
      if (
        !window.confirm(
          `¿Desconectar ${platformLabel}? Necesitarás volver a autorizar para publicar.`
        )
      ) {
        return;
      }
      setOpenMenuKey(null);
      await disconnect(platformKey);
      void fetchStatus();
    },
    [disconnect, fetchStatus]
  );

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Conexiones Sociales" size="lg" />
      </NavigationBar>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Share2 className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Conexiones Sociales</h1>
              <p className="text-gray-400 m-0">
                OAuth manual cuando conectas o revisas una sesión. Sin pasos automáticos de inicio de sesión.
              </p>
              {tenantId ? (
                <p className="text-sm text-gray-500 mt-2 m-0">
                  Tenant: <span className="text-gray-300 font-mono">{tenantId}</span>
                </p>
              ) : (
                <p className="text-sm text-amber-200/90 mt-2 m-0">
                  Selecciona un tenant para ver el estado real de las integraciones.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/marketing/integrations"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-gray-200"
            >
              Resumen integraciones
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={onQuietRefresh}
              disabled={!tenantId || loading || refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-gray-200 disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Actualizar estado
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400 m-0">{error}</p>
          <button
            type="button"
            onClick={() => void fetchStatus()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-gray-200"
          >
            Reintentar
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLATFORM_ORDER.map((key, i) => {
            const config = PLATFORM_CONFIG[key] ?? {
              name: key,
              Icon: Share2,
              color: "#666",
              enabled: false,
            };
            const Icon = config.Icon;
            const platformData = platformMap.get(key);
            const connected = platformData?.connected ?? false;
            const needsRefresh = platformData?.needs_refresh ?? false;
            const healthyConnected = connected && !needsRefresh;
            const degraded = connected && needsRefresh;

            const cardRing =
              healthyConnected
                ? "ring-1 ring-emerald-500/30 border-emerald-500/25"
                : degraded
                  ? "ring-1 ring-amber-500/30 border-amber-500/25"
                  : "border-white/10";

            return (
              <motion.div
                key={key}
                id={`social-${key}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="scroll-mt-24"
              >
                <GlassCard className={`p-6 hover:border-white/20 transition-all ${cardRing}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="p-3 rounded-xl shrink-0"
                        style={{ backgroundColor: config.color + "20" }}
                      >
                        <span style={{ color: config.color }}>
                          <Icon className="w-6 h-6" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white m-0">{config.name}</h3>
                        {healthyConnected ? (
                          <div className="mt-2 space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              Listo · conectado
                            </span>
                            <p className="text-sm text-gray-500 m-0">
                              No necesitas volver a autorizar mientras el estado se mantenga así.
                            </p>
                            {(platformData?.page_name || platformData?.user_email) && (
                              <p className="text-sm text-gray-500 m-0 truncate">
                                {[platformData?.page_name, platformData?.user_email]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                        ) : degraded ? (
                          <div className="mt-2 space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-sm text-amber-300">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              Requiere atención
                            </span>
                            <p className="text-sm text-gray-500 m-0">
                              El token o permisos pueden estar vencidos. Usa el flujo OAuth real para revisar (tú inicias la
                              sesión en el proveedor).
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2 m-0">
                            {config.enabled ? "No conectado" : "Próximamente"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {healthyConnected ? (
                        <div className="relative" data-social-menu>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuKey((k) => (k === key ? null : key))
                            }
                            disabled={!tenantId}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Administrar
                          </button>
                          {openMenuKey === key ? (
                            <div
                              className="absolute right-0 top-full z-20 mt-1 min-w-[13rem] rounded-lg border border-white/10 bg-zinc-950/95 py-1 shadow-lg backdrop-blur"
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10"
                                onClick={() => {
                                  setOpenMenuKey(null);
                                  connect(key);
                                }}
                              >
                                Actualizar conexión
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-white/10"
                                disabled={!tenantId}
                                onClick={() => void onDisconnectPlatform(key, config.name)}
                              >
                                Desconectar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : degraded && config.enabled ? (
                        <button
                          type="button"
                          onClick={() => connect(key)}
                          disabled={!tenantId}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500/25 hover:bg-amber-500/35 border border-amber-500/40 rounded-lg text-amber-100 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Revisar conexión
                        </button>
                      ) : !connected && config.enabled ? (
                        <button
                          type="button"
                          onClick={() => connect(key)}
                          disabled={!tenantId}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Conectar {config.name.split(" ")[0]}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                        >
                          Próximamente
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
