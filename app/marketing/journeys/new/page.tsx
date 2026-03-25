"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import {
  createMarketingJourney,
  fetchMarketingCampaigns,
  fetchMarketingSegments,
  fetchMarketingTemplates,
} from "@/lib/api/marketing";

const DEFAULT_STEPS_JSON = `[
  { "step_order": 1, "type": "message", "channel": "email", "template_id": "", "delay_hours": 0 },
  { "step_order": 2, "type": "wait", "delay_hours": 48 }
]`;

export default function NewJourneyPage() {
  const { tenantId } = useTenant();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("convert");
  const [channel, setChannel] = useState("email");
  const [triggerType, setTriggerType] = useState("manual");
  const [segmentId, setSegmentId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [stepsJson, setStepsJson] = useState(DEFAULT_STEPS_JSON);
  const [segments, setSegments] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoadingRefs(false);
      return;
    }
    let alive = true;
    (async () => {
      const [seg, tpl, cmp] = await Promise.all([
        fetchMarketingSegments(tenantId),
        fetchMarketingTemplates(tenantId),
        fetchMarketingCampaigns(tenantId),
      ]);
      if (!alive) return;
      setSegments(seg.segments);
      setTemplates(tpl.templates);
      setCampaigns(cmp.campaigns);
      setLoadingRefs(false);
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError("Selecciona un tenant.");
      return;
    }
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    let steps: unknown[];
    try {
      steps = JSON.parse(stepsJson) as unknown[];
      if (!Array.isArray(steps)) throw new Error("steps debe ser un array JSON");
    } catch (err) {
      setError(`JSON de pasos inválido: ${(err as Error).message}`);
      return;
    }
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      status: "draft",
      objective,
      channel,
      trigger_type: triggerType,
      steps,
    };
    if (segmentId.trim()) body.segment_id = segmentId.trim();
    if (templateId.trim()) body.template_id = templateId.trim();
    if (campaignId.trim()) body.campaign_id = campaignId.trim();
    const r = await createMarketingJourney(tenantId, body);
    setSaving(false);
    if (!r.ok || !r.data?.id) {
      setError(r.error ?? "No se pudo crear");
      return;
    }
    router.push(`/marketing/journeys/${encodeURIComponent(String(r.data.id))}`);
  };

  return (
    <div className="ndk-page ndk-fade-in min-h-screen text-white p-6">
      <NavigationBar backHref="/marketing/journeys">
        <span className="text-sm text-gray-400"> Nuevo journey</span>
      </NavigationBar>

      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/marketing/journeys"
          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 inline-flex"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold m-0">Crear journey</h1>
      </div>

      {error ? (
        <GlassCard className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <p className="text-red-300 text-sm m-0">{error}</p>
        </GlassCard>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <GlassCard className="p-6 space-y-4 border-white/10 max-w-3xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Objetivo</label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="convert">convert</option>
                <option value="engage">engage</option>
                <option value="retain">retain</option>
                <option value="awareness">awareness</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Canal</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="email">email</option>
                <option value="sms">sms</option>
                <option value="push">push</option>
                <option value="whatsapp">whatsapp</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Trigger</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="manual">manual</option>
              <option value="segment-entry">segment-entry</option>
              <option value="campaign-linked">campaign-linked</option>
            </select>
          </div>

          {loadingRefs ? (
            <p className="text-gray-500 text-sm">Cargando segmentos y plantillas…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Segmento (opcional)</label>
                <select
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">—</option>
                  {segments.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>
                      {String(s.name ?? s.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Plantilla (opcional)</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">—</option>
                  {templates.map((t) => (
                    <option key={String(t.id)} value={String(t.id)}>
                      {String(t.name ?? t.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Campaña (opcional)</label>
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">—</option>
                  {campaigns.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {String(c.name ?? c.id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Pasos (JSON)</label>
            <textarea
              value={stepsJson}
              onChange={(e) => setStepsJson(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-gray-200 font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !tenantId}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar journey
          </button>
        </GlassCard>
      </form>
    </div>
  );
}
