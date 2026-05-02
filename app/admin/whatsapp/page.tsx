"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/motion-stub";
import { Loader2, MessageCircle, Save, AlertTriangle, ShieldCheck } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { getWhatsAppConfig, postWhatsAppConfig, suiteFailure } from "@/lib/api/suiteOps";

export default function AdminWhatsAppPage() {
  const { tenantId } = useTenant();
  const [manualTenant, setManualTenant] = useState("");

  const [loadState, setLoadState] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [phoneId, setPhoneId] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [confirmLiveToggle, setConfirmLiveToggle] = useState(false);
  const [initialLiveEnabled, setInitialLiveEnabled] = useState(false);

  const tid = (tenantId || manualTenant).trim();

  const load = async () => {
    if (!tid) {
      setLoadState("error");
      setLoadError("Tenant ID required (context or manual).");
      return;
    }
    setLoadState("loading");
    setLoadError(null);
    setSaveOk(null);
    const r = await getWhatsAppConfig(tid);
    const lf = suiteFailure(r);
    if (lf) {
      setLoadState("error");
      setLoadError(lf.error);
      return;
    }
    if (!r.ok) return;
    setLoadState("ready");
    const d = r.data;
    setServerStatus(String(d["status"] ?? ""));
    setPhoneId(String(d["whatsapp_phone_number_id"] ?? ""));
    const live = Boolean(d["whatsapp_live_enabled"]);
    setLiveEnabled(live);
    setInitialLiveEnabled(live);
    setVerifyToken("");
    setConfirmLiveToggle(false);
  };

  useEffect(() => {
    if (tenantId) {
      void load();
    } else {
      setLoadState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when tenant context appears
  }, [tenantId]);

  const save = async () => {
    if (!tid) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    const r = await postWhatsAppConfig(tid, {
      phone_number_id: phoneId.trim() || undefined,
      verify_token: verifyToken.trim() || undefined,
      live_enabled: liveEnabled,
    });
    setSaving(false);
    const sf = suiteFailure(r);
    if (sf) {
      setSaveError(sf.error);
      return;
    }
    setSaveOk("Configuration saved.");
    setVerifyToken("");
    void load();
  };

  const liveChanged = liveEnabled !== initialLiveEnabled;
  const canSave = Boolean(tid) && (!liveEnabled || !liveChanged || confirmLiveToggle);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin" />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-emerald-400" />
          WhatsApp (tenant)
        </h1>
        <p className="text-gray-400 mt-1 max-w-2xl">
          <code className="text-gray-500">GET/POST /api/v1/whatsapp/config</code> with <code className="text-gray-500">X-Tenant-ID</code>.
          Verify token is write-only on save; not returned on read.
        </p>
      </motion.div>

      {!tenantId && (
        <GlassCard className="p-4 mb-6">
          <label className="block max-w-md">
            <span className="text-xs text-gray-500">Tenant ID</span>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm"
              value={manualTenant}
              onChange={(e) => setManualTenant(e.target.value)}
              placeholder="your-tenant-slug"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 px-4 py-2 rounded-lg bg-white/10 text-sm text-white"
          >
            Load config
          </button>
        </GlassCard>
      )}

      {tenantId && loadState === "loading" && (
        <div className="flex items-center gap-2 text-gray-400 py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" /> Loading WhatsApp config…
        </div>
      )}

      {loadState === "error" && loadError && (
        <GlassCard className="p-4 mb-6 border border-red-500/30">
          <p className="text-red-400 text-sm m-0">{loadError}</p>
          {tid ? (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm text-gray-400 underline"
            >
              Retry
            </button>
          ) : null}
        </GlassCard>
      )}

      {loadState === "ready" && tid && (
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <p className="text-sm text-gray-400 m-0">
              Status: <span className="text-white">{serverStatus || "—"}</span> · Tenant{" "}
              <span className="font-mono text-gray-300">{tid}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-xs text-gray-500">Phone number ID (Meta)</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm"
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-gray-500">Verify token (set once; not shown after save)</span>
              <input
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="••••••••"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 md:col-span-2">
              <input
                type="checkbox"
                checked={liveEnabled}
                onChange={(e) => setLiveEnabled(e.target.checked)}
                className="rounded border-white/20"
              />
              Live enabled (whatsapp_live_enabled)
            </label>
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-100 m-0 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              Safety check: enabling live mode routes real conversations. Confirm before saving.
            </p>
            {liveEnabled && liveChanged && (
              <label className="mt-3 flex items-center gap-2 text-sm text-amber-100/90">
                <input
                  type="checkbox"
                  checked={confirmLiveToggle}
                  onChange={(e) => setConfirmLiveToggle(e.target.checked)}
                  className="rounded border-white/20"
                />
                I confirm this tenant is ready for live WhatsApp traffic.
              </label>
            )}
          </div>
          {!canSave && liveEnabled && liveChanged && (
            <p className="text-amber-300 text-sm mt-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Confirm live-mode readiness to unlock save.
            </p>
          )}
          {saveError && <p className="text-red-400 text-sm mt-4">{saveError}</p>}
          {saveOk && <p className="text-emerald-400 text-sm mt-4">{saveOk}</p>}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !canSave}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save config
            </button>
          </div>
        </GlassCard>
      )}

    </div>
  );
}
