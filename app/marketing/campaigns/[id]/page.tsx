"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Rocket, Check } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useTenant } from "@/contexts/TenantContext";
import type { Campaign } from "@/lib/api";
import {
  fetchMarketingCampaignById,
  fetchMarketingTemplates,
  fetchMarketingSegments,
  fetchMarketingJourneys,
  postMarketingLaunchPilot,
  updateMarketingCampaign,
} from "@/lib/api/marketing";
import { mapApiRecordToCampaign } from "@/lib/api/mapMarketingCampaign";
import {
  buildMarketingCampaignUpdatePayload,
  validateMarketingCampaignForSave,
} from "@/lib/api/campaignUpdatePayload";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import type { FetchSource } from "@/lib/api/client";
import {
  rowTemplateId,
  rowSegmentId,
  templateOriginLabel,
  segmentOriginLabel,
  buildSegmentSnapshot,
  buildTemplateSnapshot,
  patchCampaignSettings,
} from "@/lib/marketing/campaignAssets";

const OBJECTIVES = [
  { id: "convert", label: "Convert" },
  { id: "engage", label: "Engage" },
  { id: "retain", label: "Retain" },
  { id: "awareness", label: "Awareness" },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const { tenantId } = useTenant();
  const { theme } = useTheme();
  const isLight = theme?.isLight;
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [pilotLoading, setPilotLoading] = useState(false);
  const [pilotMessage, setPilotMessage] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<FetchSource>("fallback");
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [segments, setSegments] = useState<Record<string, unknown>[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [linkedJourneys, setLinkedJourneys] = useState<Record<string, unknown>[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);
  const [journeysError, setJourneysError] = useState<string | null>(null);

  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  useEffect(() => {
    if (!campaignId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const r = await fetchMarketingCampaignById(campaignId, tenantId);
      if (!alive) return;
      setDataSource(r.source);
      if (r.data) {
        setCampaign(mapApiRecordToCampaign(campaignId, r.data));
        setError(null);
      } else {
        setCampaign(null);
        setError(r.error ?? "Campaña no disponible desde el API");
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [campaignId, tenantId]);

  useEffect(() => {
    if (!tenantId) {
      setAssetsLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setAssetsLoading(true);
      setAssetsError(null);
      const [t, s] = await Promise.all([fetchMarketingTemplates(tenantId), fetchMarketingSegments(tenantId)]);
      if (!alive) return;
      setTemplates(t.templates);
      setSegments(s.segments);
      const parts = [t.error, s.error].filter(Boolean);
      setAssetsError(parts.length ? parts.join(" ") : null);
      setAssetsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || !campaignId) {
      setLinkedJourneys([]);
      setJourneysLoading(false);
      setJourneysError(null);
      return;
    }
    let alive = true;
    (async () => {
      setJourneysLoading(true);
      setJourneysError(null);
      const r = await fetchMarketingJourneys(tenantId);
      if (!alive) return;
      if (r.error) {
        setLinkedJourneys([]);
        setJourneysError(r.error);
        setJourneysLoading(false);
        return;
      }
      const matches = r.journeys.filter((j) => String(j.campaign_id ?? "").trim() === campaignId);
      setLinkedJourneys(matches);
      setJourneysLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [tenantId, campaignId]);

  const handleSave = async () => {
    if (!campaign || !tenantId) return;
    const v = validateMarketingCampaignForSave(campaign);
    if (v) {
      setSaveError(v);
      setSaveOk(null);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      const c =
        typeof campaign.settings?.marketing_objective === "string"
          ? campaign
          : patchCampaignSettings(campaign, { marketing_objective: "convert" });
      const payload = buildMarketingCampaignUpdatePayload(c);
      const res = await updateMarketingCampaign(tenantId, campaignId, payload);
      if (!res.ok) {
        setSaveError(res.error || `HTTP ${res.status}`);
        return;
      }
      setSaveOk("Guardado.");
      if (res.data && typeof res.data === "object") {
        setCampaign(mapApiRecordToCampaign(campaignId, res.data));
      }
    } catch (err) {
      console.error(err);
      setSaveError((err as Error)?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handlePilotDryRun = async () => {
    if (!tenantId || !campaign) return;
    const v = validateMarketingCampaignForSave(campaign);
    if (v) {
      setPilotMessage(v);
      return;
    }
    setPilotMessage(null);
    setPilotLoading(true);
    const r = await postMarketingLaunchPilot(tenantId, {
      product_name: campaign.name || "Campaign",
      target_audience: String(campaign.settings?.segment_snapshot && typeof campaign.settings.segment_snapshot === "object" && campaign.settings.segment_snapshot !== null && "name" in (campaign.settings.segment_snapshot as object)
        ? String((campaign.settings.segment_snapshot as { name?: string }).name)
        : campaign.name),
      dry_run: true,
      campaign_id: campaignId,
    });
    setPilotLoading(false);
    if (!r.ok) {
      setPilotMessage(r.error || "Pilot failed");
      return;
    }
    const linked = r.data?.marketing_campaign_id;
    setPilotMessage(
      r.data?.success === true
        ? `Pilot dry run OK.${linked ? ` Linked: ${String(linked)}.` : ""}`
        : `Pilot success=${String(r.data?.success)}`
    );
  };

  const selectedTemplateId =
    typeof campaign?.settings?.template_id === "string" ? campaign.settings.template_id.trim() : "";
  const selectedSegmentId =
    String(campaign?.audience_id ?? "").trim() ||
    (typeof campaign?.settings?.segment_id === "string" ? campaign.settings.segment_id.trim() : "");

  const applyTemplate = (tpl: Record<string, unknown> | null) => {
    if (!campaign) return;
    if (!tpl) {
      setCampaign(patchCampaignSettings(campaign, { template_id: "" }));
      return;
    }
    const tid = rowTemplateId(tpl);
    let next = patchCampaignSettings(campaign, {
      template_id: tid,
      template_snapshot: buildTemplateSnapshot(tpl),
    });
    const subj = tpl.subject;
    if (typeof subj === "string" && subj.trim() && !(campaign.subject && campaign.subject.trim())) {
      next = { ...next, subject: subj };
    }
    setCampaign(next);
  };

  const applySegment = (seg: Record<string, unknown> | null) => {
    if (!campaign) return;
    if (!seg) {
      setCampaign(
        patchCampaignSettings({ ...campaign, audience_id: undefined }, { segment_id: "", segment_snapshot: undefined })
      );
      return;
    }
    const sid = rowSegmentId(seg);
    setCampaign({
      ...patchCampaignSettings(campaign, {
        segment_id: sid,
        segment_snapshot: buildSegmentSnapshot(seg),
      }),
      audience_id: sid,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: bgPrimary }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentPrimary }} />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: bgPrimary }}>
        <div className="text-center">
          <p style={{ color: textPrimary }}>{error || "Campana no encontrada"}</p>
          <Link href="/marketing/campaigns" className="mt-4 inline-block" style={{ color: accentPrimary }}>Volver</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgPrimary }}>
<main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/marketing/campaigns" className="p-2 rounded-lg" style={{ backgroundColor: bgCard }}>
              <ArrowLeft className="w-5 h-5" style={{ color: textMuted }} />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold m-0" style={{ color: textPrimary }}>{campaign.name}</h1>
                <DataSourceBadge source={dataSource} error={error} />
              </div>
              <p className="text-sm m-0 mt-1" style={{ color: textMuted }}>ID: {campaign.id}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handlePilotDryRun()}
              disabled={pilotLoading || !!assetsError || assetsLoading}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-2 border border-white/20"
              style={{ backgroundColor: bgCard }}
            >
              {pilotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              Pilot (dry run)
            </button>
            <button onClick={() => void handleSave()} disabled={saving || !!assetsError || assetsLoading} className="px-4 py-2 rounded-lg text-white flex items-center gap-2" style={{ backgroundColor: accentPrimary }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {(saveError || saveOk || pilotMessage) && (
          <div className="mb-4 text-sm space-y-1">
            {saveError ? <p className="text-red-400 m-0">{saveError}</p> : null}
            {saveOk ? <p className="text-emerald-400 m-0">{saveOk}</p> : null}
            {pilotMessage ? <p className="text-gray-400 m-0">{pilotMessage}</p> : null}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
              <h2 className="font-semibold mb-4" style={{ color: textPrimary }}>Informacion</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1" style={{ color: textMuted }}>Nombre</label>
                  <input type="text" value={campaign.name} onChange={(e) => setCampaign({ ...campaign, name: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: textMuted }}>Asunto</label>
                  <input type="text" value={campaign.subject || ""} onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: textMuted }}>Descripcion</label>
                  <textarea value={campaign.description || ""} onChange={(e) => setCampaign({ ...campaign, description: e.target.value })} rows={3} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }} />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
              <h2 className="font-semibold mb-2" style={{ color: textPrimary }}>Objetivo y activos (API)</h2>
              <p className="text-sm m-0 mb-4" style={{ color: textMuted }}>
                Plantillas y segmentos vía same-origin <code style={{ fontSize: "0.85em" }}>/api/marketing/templates</code> y{" "}
                <code style={{ fontSize: "0.85em" }}>/api/marketing/segments</code>. La etiqueta de origen refleja sistema vs tenant
                cuando el backend la envía.
              </p>
              {assetsError ? (
                <p className="text-sm m-0 mb-4 text-red-400">{assetsError}</p>
              ) : null}
              <div className="mb-4">
                <label className="block text-sm mb-1" style={{ color: textMuted }}>Objetivo de marketing</label>
                <select
                  value={typeof campaign.settings?.marketing_objective === "string" ? campaign.settings.marketing_objective : "convert"}
                  onChange={(e) =>
                    setCampaign(
                      patchCampaignSettings(campaign, { marketing_objective: e.target.value })
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }}
                >
                  {OBJECTIVES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {assetsLoading ? (
                <div className="flex items-center gap-2 py-8" style={{ color: textMuted }}>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentPrimary }} />
                  Cargando plantillas y segmentos…
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 m-0" style={{ color: textPrimary }}>Plantilla</h3>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {templates.length === 0 ? (
                        <p className="text-sm m-0" style={{ color: textMuted }}>Sin plantillas en la respuesta.</p>
                      ) : (
                        templates.map((t) => {
                          const tid = rowTemplateId(t);
                          if (!tid) return null;
                          const sel = selectedTemplateId === tid;
                          return (
                            <button
                              type="button"
                              key={tid}
                              onClick={() => applyTemplate(t)}
                              className="w-full p-3 rounded-lg border text-left flex items-start gap-2 transition-colors"
                              style={{
                                borderColor: sel ? accentPrimary : borderColor,
                                backgroundColor: sel ? (isLight ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.12)") : bgPrimary,
                              }}
                            >
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium truncate" style={{ color: textPrimary }}>
                                  {String(t.name ?? tid)}
                                </span>
                                <span className="text-xs" style={{ color: textMuted }}>
                                  {String(t.type ?? "")} · {templateOriginLabel(t)}
                                </span>
                              </span>
                              {sel ? <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentPrimary }} /> : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2 m-0" style={{ color: textPrimary }}>Segmento</h3>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {segments.length === 0 ? (
                        <p className="text-sm m-0" style={{ color: textMuted }}>Sin segmentos en la respuesta.</p>
                      ) : (
                        segments.map((s) => {
                          const sid = rowSegmentId(s);
                          if (!sid) return null;
                          const zone = typeof s.size === "number" ? s.size : 0;
                          const sel = selectedSegmentId === sid;
                          return (
                            <button
                              type="button"
                              key={sid}
                              onClick={() => applySegment(s)}
                              className="w-full p-3 rounded-lg border text-left transition-colors"
                              style={{
                                borderColor: sel ? accentPrimary : borderColor,
                                backgroundColor: sel ? (isLight ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.12)") : bgPrimary,
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                                  {String(s.name ?? sid)}
                                </span>
                                {sel ? <Check className="w-4 h-4 shrink-0" style={{ color: accentPrimary }} /> : null}
                              </div>
                              <div className="text-xs mt-1" style={{ color: textMuted }}>
                                {segmentOriginLabel(s)} · {zone.toLocaleString()} audiencia
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
              <h2 className="font-semibold mb-4" style={{ color: textPrimary }}>Estado</h2>
              <select value={campaign.status} onChange={(e) => setCampaign({ ...campaign, status: e.target.value as Campaign["status"] })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }}>
                <option value="draft">Borrador</option>
                <option value="scheduled">Programada</option>
                <option value="active">Activa</option>
                <option value="paused">Pausada</option>
                <option value="completed">Completada</option>
                <option value="archived">Archivada</option>
              </select>
            </div>

            {campaign.stats && (
              <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
                <h2 className="font-semibold mb-4" style={{ color: textPrimary }}>Estadisticas</h2>
                <div className="space-y-3">
                  <div className="flex justify-between"><span style={{ color: textMuted }}>Enviados</span><span style={{ color: textPrimary }}>{campaign.stats.sent.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: textMuted }}>Abiertos</span><span style={{ color: textPrimary }}>{campaign.stats.opened.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: textMuted }}>Clicks</span><span style={{ color: textPrimary }}>{campaign.stats.clicked.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: textMuted }}>Conversiones</span><span style={{ color: textPrimary }}>{campaign.stats.conversions.toLocaleString()}</span></div>
                </div>
              </div>
            )}

            <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
              <h2 className="font-semibold mb-2" style={{ color: textPrimary }}>Journeys vinculados</h2>
              <p className="text-sm m-0 mb-3" style={{ color: textMuted }}>
                Relación real por <code style={{ fontSize: "0.85em" }}>journey.campaign_id === {campaign.id}</code>.
              </p>
              {journeysLoading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: textMuted }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: accentPrimary }} />
                  Cargando journeys…
                </div>
              ) : journeysError ? (
                <p className="text-sm m-0 text-red-400">
                  No se pudo cargar la relación campaña↔journey: {journeysError}
                </p>
              ) : linkedJourneys.length === 0 ? (
                <p className="text-sm m-0" style={{ color: textMuted }}>
                  Esta campaña no está vinculada a journeys.
                </p>
              ) : (
                <div className="space-y-2">
                  {linkedJourneys.map((j) => {
                    const id = String(j.id ?? "").trim();
                    if (!id) return null;
                    return (
                      <Link
                        key={id}
                        href={`/marketing/journeys/${encodeURIComponent(id)}`}
                        className="block p-3 rounded-lg border hover:border-violet-500/40"
                        style={{ borderColor, backgroundColor: bgPrimary, color: textPrimary }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{String(j.name ?? id)}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/10" style={{ color: textMuted }}>
                            {String(j.status ?? "draft")}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


