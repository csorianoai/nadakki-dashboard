"use client";

import { useState } from "react";
import { Facebook, Instagram, Youtube, Music2, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { SocialAccount, SocialPlatform } from "@/types/social-ai";

const PLATFORM_META: Record<SocialPlatform, { label: string; Icon: React.FC<{ className?: string }>; color: string }> = {
  facebook: { label: "Facebook", Icon: Facebook, color: "text-blue-400" },
  instagram: { label: "Instagram", Icon: Instagram, color: "text-pink-400" },
  tiktok: { label: "TikTok", Icon: Music2, color: "text-teal-400" },
  youtube: { label: "YouTube", Icon: Youtube, color: "text-red-400" },
};

interface Props {
  accounts: SocialAccount[];
  isMock: boolean;
  onConnect: (platform: SocialPlatform) => Promise<void>;
  loading?: boolean;
}

export default function SocialAccountsConnect({ accounts, isMock, onConnect, loading }: Props) {
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);

  const accountMap = Object.fromEntries(accounts.map((a) => [a.platform, a]));
  const platforms: SocialPlatform[] = ["facebook", "instagram", "tiktok", "youtube"];

  async function handleConnect(platform: SocialPlatform) {
    setConnecting(platform);
    try {
      await onConnect(platform);
    } finally {
      setConnecting(null);
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Cuentas Conectadas</h2>
        {isMock && (
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
            MODO DEMO
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {platforms.map((platform) => {
          const meta = PLATFORM_META[platform];
          const account = accountMap[platform];
          const isConnected = account?.status === "connected";
          const isConnecting = connecting === platform;

          return (
            <div
              key={platform}
              className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4"
            >
              <div className="flex items-center gap-3">
                <meta.Icon className={`w-5 h-5 ${meta.color}`} />
                <div>
                  <p className="text-sm font-medium text-white">{meta.label}</p>
                  {isConnected && account?.platform_page_name && (
                    <p className="text-xs text-gray-400 truncate max-w-[120px]">{account.platform_page_name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Conectado</span>
                  </>
                ) : account?.status === "error" ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    disabled={isConnecting || loading}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wifi className="w-3 h-3" />
                    )}
                    Conectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isMock && (
        <p className="mt-3 text-xs text-gray-500">
          En modo demo las conexiones son simuladas. Activa FEATURE_SOCIAL_MEDIA_LIVE para OAuth real.
        </p>
      )}
    </div>
  );
}
