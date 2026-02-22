"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, RefreshCw, Loader2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface ConfigState {
  version?: string;
  live_enabled?: boolean;
  meta_live?: boolean;
  sendgrid_live?: boolean;
}

interface SocialStatus {
  meta?: { connected?: boolean };
  sendgrid?: { connected?: boolean };
}

export default function AdminConfigPage() {
  const { tenantId } = useTenant();
  const [config, setConfig] = useState<ConfigState>({});
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/v1/config`)
        .then((r) => (r.ok ? r.json() : {}))
        .then((d) => setConfig(d))
        .catch(() => setConfig({})),
      fetch(`${API_URL}/api/v1/social/status`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setSocialStatus(d))
        .catch(() => setSocialStatus(null)),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = () => {
    if (!tenantId) return;
    setSaving(true);
    fetch(`${API_URL}/api/v1/tenants/${tenantId}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
      body: JSON.stringify({
        meta_live: config.meta_live,
        sendgrid_live: config.sendgrid_live,
      }),
    })
      .then((r) => (r.ok ? fetchConfig() : Promise.reject()))
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </NavigationBar>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 mt-1">Ajustes de tenant y canales en vivo</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Estado actual</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-gray-400">Version</span>
              <span className="text-white font-mono">{config.version ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-gray-400">live_enabled</span>
              <span className="text-white">{config.live_enabled ? "Sí" : "No"}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">meta_live</span>
              <input
                type="checkbox"
                checked={!!config.meta_live}
                onChange={(e) => setConfig((c) => ({ ...c, meta_live: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-500 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">sendgrid_live</span>
              <input
                type="checkbox"
                checked={!!config.sendgrid_live}
                onChange={(e) => setConfig((c) => ({ ...c, sendgrid_live: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-500 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">Tenant</label>
            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white">
              {tenantId ?? "—"}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !tenantId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar
          </button>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Social Status</h2>
          {socialStatus ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5">
                <span className="text-gray-400">Meta</span>
                <span className={socialStatus?.meta?.connected ? "text-green-400" : "text-amber-400"}>
                  {socialStatus?.meta?.connected ? "Conectado" : "No conectado"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5">
                <span className="text-gray-400">SendGrid</span>
                <span className={socialStatus?.sendgrid?.connected ? "text-green-400" : "text-amber-400"}>
                  {socialStatus?.sendgrid?.connected ? "Conectado" : "No conectado"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No disponible</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
