"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { apiFetch } from "@/lib/api/fetch-client";

type WhatsAppConfig = {
  status?: "connected" | "not_configured" | "pending" | string;
  phone_number?: string;
  mode?: "sandbox" | "live" | string;
  whatsapp_phone_number_id?: string;
  whatsapp_live_enabled?: boolean;
};

function detailFromUnknown(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const detail = (json as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

export default function MarketingWhatsAppPage() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);

  const [message, setMessage] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simReply, setSimReply] = useState<string | null>(null);

  const loadConfig = async () => {
    if (!tenantId?.trim()) {
      setConfigError("Selecciona un tenant.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setConfigError(null);
    try {
      const res = await apiFetch("/api/v1/whatsapp/config", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tenantId.trim(),
        },
      });
      const json = (await res.json().catch(() => null)) as WhatsAppConfig | null;
      if (!res.ok) throw new Error(detailFromUnknown(json, `HTTP ${res.status}`));
      setConfig(json ?? {});
    } catch (e) {
      setConfigError((e as Error).message);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const simulate = async () => {
    if (!tenantId?.trim()) {
      setSimError("Selecciona un tenant.");
      return;
    }
    if (!message.trim() || !fromNumber.trim()) {
      setSimError("Completa mensaje y número del cliente.");
      return;
    }
    setSimLoading(true);
    setSimError(null);
    setSimReply(null);
    try {
      const res = await apiFetch("/api/v1/whatsapp/simulate", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId.trim(),
        },
        body: JSON.stringify({
          message: message.trim(),
          from_number: fromNumber.trim(),
        }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(detailFromUnknown(json, `HTTP ${res.status}`));
      const generated = String(json?.response ?? json?.agent_response ?? json?.reply ?? "");
      setSimReply(generated || "No se recibió texto de respuesta.");
    } catch (e) {
      setSimError((e as Error).message);
    } finally {
      setSimLoading(false);
    }
  };

  const status = String(config?.status ?? "not_configured");
  const phoneNumber = String(config?.phone_number ?? config?.whatsapp_phone_number_id ?? "—");
  const mode = String(config?.mode ?? (config?.whatsapp_live_enabled ? "live" : "sandbox"));

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-emerald-400" />
          WhatsApp
        </h1>
        <p className="text-gray-400 mt-1">Canal de ventas conversacional.</p>
      </div>

      <GlassCard className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white m-0">Estado de configuración</h2>
          <button type="button" onClick={() => void loadConfig()} disabled={loading} className="text-sm text-gray-300 inline-flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm m-0 inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando configuración...
          </p>
        ) : configError ? (
          <p className="text-red-400 text-sm m-0">{configError}</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-gray-500 m-0">Status</p>
              <p className="text-sm text-white m-0 mt-1">{status}</p>
            </div>
            {status === "not_configured" && (
              <p className="text-sm text-amber-200 m-0">WhatsApp no configurado aún.</p>
            )}
            {status === "connected" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-500 m-0">Phone Number</p>
                  <p className="text-sm text-white m-0 mt-1">{phoneNumber}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-500 m-0">Mode</p>
                  <p className="text-sm text-white m-0 mt-1">{mode}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Simulador de mensajes</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs text-gray-500">Mensaje del cliente</span>
            <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">Número del cliente</span>
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="+1305..." value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} />
          </label>
          {simError && <p className="text-sm text-red-400 m-0">{simError}</p>}
          <button type="button" onClick={() => void simulate()} disabled={simLoading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
            {simLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Simular respuesta
          </button>
          {simReply && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-200 m-0">Respuesta del agente</p>
              <p className="text-sm text-emerald-100 mt-1 m-0 whitespace-pre-wrap">{simReply}</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
