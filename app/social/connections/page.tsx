"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, CheckCircle, XCircle, RefreshCw, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";
const TENANT_ID = "credicefi";

interface Connection {
  id: string;
  platform: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  account?: string;
  followers?: string;
  lastSync?: string;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", color: "#1877F2", oauthUrl: "https://www.facebook.com/v18.0/dialog/oauth" },
  { id: "instagram", name: "Instagram", icon: "📸", color: "#E1306C", oauthUrl: "https://api.instagram.com/oauth/authorize" },
  { id: "twitter", name: "Twitter/X", icon: "🐦", color: "#1DA1F2", oauthUrl: "https://twitter.com/i/oauth2/authorize" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "#0A66C2", oauthUrl: "https://www.linkedin.com/oauth/v2/authorization" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "#000000", oauthUrl: "https://www.tiktok.com/auth/authorize" },
  { id: "youtube", name: "YouTube", icon: "▶️", color: "#FF0000", oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth" },
];

export default function SocialConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL + "/api/social/connections?tenant_id=" + TENANT_ID);
      if (res.ok) {
        const data = await res.json();
        const merged = PLATFORMS.map(p => {
          const conn = data.connections?.find((c: any) => c.platform === p.id);
          return {
            ...p,
            connected: conn?.connected || false,
            account: conn?.account || null,
            followers: conn?.followers || null,
            lastSync: conn?.lastSync || null
          };
        });
        setConnections(merged);
      } else {
        setConnections(PLATFORMS.map(p => ({ ...p, connected: false })));
      }
    } catch (err) {
      setConnections(PLATFORMS.map(p => ({ ...p, connected: false })));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    try {
      const redirectUri = encodeURIComponent(window.location.origin + "/social/connections");
      const res = await fetch(API_URL + "/api/social/" + platform + "/auth-url?tenant_id=" + TENANT_ID + "&redirect_uri=" + redirectUri);
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
          return;
        }
      }
      alert("Para conectar " + platform + ", necesitas configurar las credenciales OAuth en el backend.\n\nDocumentacion:\n- Facebook/Instagram: developers.facebook.com\n- Twitter: developer.twitter.com\n- LinkedIn: linkedin.com/developers");
    } catch (err) {
      alert("Error conectando con " + platform + ". Verifica la configuracion del backend.");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm("¿Desconectar " + platform + "?")) return;
    try {
      await fetch(API_URL + "/api/social/" + platform + "/disconnect?tenant_id=" + TENANT_ID, { method: "POST" });
      fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  const connectedCount = connections.filter(c => c.connected).length;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social">
        <button onClick={fetchConnections} className="p-2 hover:bg-white/10 rounded-lg">
          <RefreshCw className={"w-5 h-5 text-gray-400 " + (loading ? "animate-spin" : "")} />
        </button>
        <StatusBadge status={connectedCount > 0 ? "active" : "warning"} label={connectedCount + " conectadas"} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Settings className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conexiones Sociales</h1>
            <p className="text-gray-400">Conecta tus cuentas para activar los agentes de IA</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Configuracion OAuth Requerida</p>
            <p className="text-sm text-gray-400 mt-1">
              Para conectar redes sociales, necesitas configurar las credenciales OAuth en el backend. 
              Cada plataforma requiere crear una app de desarrollador y configurar los Client ID y Secret.
            </p>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-gray-400">Cargando conexiones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {connections.map((conn, i) => (
            <motion.div key={conn.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className={"p-6 " + (conn.connected ? "border-green-500/30" : "")}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: conn.color + "20" }}>
                      {conn.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{conn.name}</h3>
                      {conn.connected && conn.account && <p className="text-sm text-gray-400">{conn.account}</p>}
                    </div>
                  </div>
                  {conn.connected ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-gray-500" />
                  )}
                </div>

                {conn.connected ? (
                  <div className="space-y-3">
                    {conn.followers && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Seguidores</span>
                        <span className="text-white font-medium">{conn.followers}</span>
                      </div>
                    )}
                    {conn.lastSync && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Ultima sincronizacion</span>
                        <span className="text-gray-500">{conn.lastSync}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-3 border-t border-white/10">
                      <button onClick={() => handleConnect(conn.id)}
                        className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Reconectar
                      </button>
                      <button onClick={() => handleDisconnect(conn.id)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm text-red-400">
                        Desconectar
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.button 
                    onClick={() => handleConnect(conn.id)}
                    disabled={connecting === conn.id}
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: conn.color + "20", color: conn.color }}>
                    {connecting === conn.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Conectar {conn.name}</>
                    )}
                  </motion.button>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <GlassCard className="p-6 mt-8">
        <h3 className="text-lg font-bold text-white mb-4">Documentacion de Configuracion</h3>
        <div className="grid grid-cols-3 gap-4">
          <a href="https://developers.facebook.com/docs/facebook-login" target="_blank" rel="noopener noreferrer"
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 flex items-center gap-2 transition-colors">
            <ExternalLink className="w-4 h-4" /> Facebook/Instagram OAuth
          </a>
          <a href="https://developer.twitter.com/en/docs/authentication" target="_blank" rel="noopener noreferrer"
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 flex items-center gap-2 transition-colors">
            <ExternalLink className="w-4 h-4" /> Twitter OAuth 2.0
          </a>
          <a href="https://learn.microsoft.com/en-us/linkedin/shared/authentication" target="_blank" rel="noopener noreferrer"
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 flex items-center gap-2 transition-colors">
            <ExternalLink className="w-4 h-4" /> LinkedIn OAuth
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
