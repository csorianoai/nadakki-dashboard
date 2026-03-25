"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Pause, Play, Save, Trash2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchMarketingJourneyById,
  updateMarketingJourney,
  activateMarketingJourney,
  pauseMarketingJourney,
  deleteMarketingJourney,
  fetchMarketingSegments,
  fetchMarketingTemplates,
  fetchMarketingCampaigns,
} from "@/lib/api/marketing";

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id as string;
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [objective, setObjective] = useState("convert");
  const [channel, setChannel] = useState("email");
  const [triggerType, setTriggerType] = useState("manual");
  const [segmentId, setSegmentId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [stepsJson, setStepsJson] = useState("[]");
  const [segments, setSegments] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [journeyMissing, setJourneyMissing] = useState(false);

  const loadRefs = useCallback(async () => {
    if (!tenantId) {
      setRefsLoading(false);
      return;
    }
    setRefsLoading(true);
    const [seg, tpl, cmp] = await Promise.all([
      fetchMarketingSegments(tenantId),
      fetchMarketingTemplates(tenantId),
      fetchMarketingCampaigns(tenantId),
    ]);
    setSegments(seg.segments);
    setTemplates(tpl.templates);
    setCampaigns(cmp.campaigns);
    setRefsLoading(false);
  }, [tenantId]);

  const loadJourney = useCallback(async () => {
    if (!tenantId || !journeyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setJourneyMissing(false);
    const r = await fetchMarketingJourneyById(tenantId, journeyId);
    if (!r.data) {
      setJourneyMissing(true);
      setError(r.error ?? "Journey no encontrado");
      setLoading(false);
      return;
    }
    const j = r.data;
    setName(String(j.name ?? ""));
    setDescription(String(j.description ?? ""));
    setStatus(String(j.status ?? "draft"));
    setObjective(String(j.objective ?? "convert"));
    setChannel(String(j.channel ?? "email"));
    setTriggerType(String(j.trigger_type ?? "manual"));
    setSegmentId(j.segment_id != null ? String(j.segment_id) : "");
    setTemplateId(j.template_id != null ? String(j.template_id) : "");
    setCampaignId(j.campaign_id != null ? String(j.campaign_id) : "");
    const steps = j.steps;
    setStepsJson(JSON.stringify(Array.isArray(steps) ? steps : [], null, 2));
    setLoading(false);
  }, [tenantId, journeyId]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void loadJourney();
  }, [loadJourney]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    let steps: unknown[];
    try {
      steps = JSON.parse(stepsJson) as unknown[];
      if (!Array.isArray(steps)) throw new Error("steps debe ser un array");
    } catch (err) {
      setError(`JSON de pasos inválido: ${(err as Error).message}`);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      status,
      objective,
      channel,
      trigger_type: triggerType,
      steps,
      segment_id: segmentId.trim() || null,
      template_id: templateId.trim() || null,
      campaign_id: campaignId.trim() || null,
    };
    const r = await updateMarketingJourney(tenantId, journeyId, body);
    setSaving(false);
    if (!r.ok) {
      setError(r.error ?? "Error al guardar");
      return;
    }
    setMessage("Guardado.");
    void loadJourney();
  };

  const onActivate = async () => {
    if (!tenantId) return;
    setMessage(null);
    const r = await activateMarketingJourney(tenantId, journeyId);
    if (!r.ok) {
      setError(r.error ?? "No se activó");
      return;
    }
    setMessage("Activado.");
    void loadJourney();
  };

  const onPause = async () => {
    if (!tenantId) return;
    setMessage(null);
    const r = await pauseMarketingJourney(tenantId, journeyId);
    if (!r.ok) {
      setError(r.error ?? "No se pausó");
      return;
    }
    setMessage("Pausado.");
    void loadJourney();
  };

  const onArchive = async () => {
    if (!tenantId || !confirm("¿Archivar este journey?")) return;
    const r = await deleteMarketingJourney(tenantId, journeyId);
    if (!r.ok) {
      setError(r.error ?? "No se archivó");
      return;
    }
    router.push("/marketing/journeys");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
      </div>
    );
  }

  if (journeyMissing) {
    return (
      <div className="ndk-page p-6 text-white">
        <p className="text-red-400">{error}</p>
        <Link href="/marketing/journeys" className="text-purple-400 mt-4 inline-block">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="ndk-page ndk-fade-in min-h-screen text-white p-6">
      <NavigationBar backHref="/marketing/journeys">
        <span className="text-sm text-gray-400 font-mono truncate max-w-[200px]">{journeyId}</span>
      </NavigationBar>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/marketing/journeys"
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 inline-flex shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold m-0 truncate">{name || "Journey"}</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 shrink-0">{status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "active" ? (
            <button
              type="button"
              onClick={() => void onPause()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-200"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>
          ) : status !== "archived" ? (
            <button
              type="button"
              onClick={() => void onActivate()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-200"
            >
              <Play className="w-4 h-4" />
              Activar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void onArchive()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-300"
          >
            <Trash2 className="w-4 h-4" />
            Archivar
          </button>
        </div>
      </div>

      {(error || message) && (
        <div className="mb-4 space-y-1">
          {error ? <p className="text-red-400 text-sm m-0">{error}</p> : null}
          {message ? <p className="text-emerald-400 text-sm m-0">{message}</p> : null}
        </div>
      )}

      <form onSubmit={(e) => void handleSave(e)}>
        <GlassCard className="p-6 space-y-4 border-white/10 max-w-3xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre</label>
            <input
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
          <div>
            <label className="block text-sm text-gray-400 mb-1">Estado (edición)</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={status === "archived"}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50"
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
            </select>
            <p className="text-xs text-gray-500 m-0 mt-1">
              Usa Activar/Pausar para transiciones válidas; aquí puedes volver a borrador si lo permite el backend.
            </p>
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

          {refsLoading ? (
            <p className="text-gray-500 text-sm">Cargando referencias…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Segmento</label>
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
                <label className="block text-sm text-gray-400 mb-1">Plantilla</label>
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
                <label className="block text-sm text-gray-400 mb-1">Campaña</label>
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
              rows={12}
              className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-gray-200 font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving || status === "archived"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar cambios
          </button>
        </GlassCard>
      </form>
    </div>
  );
}
