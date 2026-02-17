"use client";

import { motion } from "framer-motion";
import {
  Share2,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useSocialConnections } from "@/hooks/useSocialConnections";

const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    Icon: React.ComponentType<{ className?: string }>;
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
  const { platforms, loading, error, connect, disconnect } = useSocialConnections();

  const platformMap = new Map(
    platforms.map((p) => [getPlatformFromData(p.platform), p])
  );

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Conexiones Sociales" size="lg" />
      </NavigationBar>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <Share2 className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conexiones Sociales</h1>
            <p className="text-gray-400">Conecta tus plataformas para sincronizar datos</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400">{error}</p>
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

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-6 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: config.color + "20" }}
                      >
                        <Icon className="w-6 h-6" style={{ color: config.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{config.name}</h3>
                        {connected ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-sm text-green-400">
                              <CheckCircle2 className="w-4 h-4" />
                              Conectado
                            </span>
                            {platformData?.page_name && (
                              <span className="text-sm text-gray-500">
                                • {platformData.page_name}
                              </span>
                            )}
                            {platformData?.user_email && (
                              <span className="text-sm text-gray-500">
                                • {platformData.user_email}
                              </span>
                            )}
                            {needsRefresh && (
                              <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                                Actualizar
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">
                            {config.enabled
                              ? "No conectado"
                              : "Próximamente"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {connected ? (
                        <button
                          onClick={() => disconnect(key)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Desconectar
                        </button>
                      ) : config.enabled ? (
                        <button
                          onClick={() => connect(key)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                          Conectar {config.name.split(" ")[0]}
                        </button>
                      ) : (
                        <button
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
