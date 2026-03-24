"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useTenant } from "@/contexts/TenantContext";
import type { Campaign } from "@/lib/api";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import { fetchMarketingCampaignById } from "@/lib/api/marketing";
import { mapApiRecordToCampaign } from "@/lib/api/mapMarketingCampaign";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import type { FetchSource } from "@/lib/api/client";

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
  const [dataSource, setDataSource] = useState<FetchSource>("fallback");

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

  const handleSave = async () => {
    if (!campaign) return;
    setSaving(true);
    try {
      // TODO: migrar a PATCH /marketing/campaigns/{id} cuando el backend confirme el contrato
      const url = MARKETING_ENDPOINTS.CAMPAIGN_BY_ID(campaignId);
      if (!url) throw new Error("Missing campaign endpoint URL");
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
        },
        body: JSON.stringify(campaign),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-white flex items-center gap-2" style={{ backgroundColor: accentPrimary }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

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
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
              <h2 className="font-semibold mb-4" style={{ color: textPrimary }}>Estado</h2>
              <select value={campaign.status} onChange={(e) => setCampaign({ ...campaign, status: e.target.value as Campaign["status"] })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }}>
                <option value="draft">Borrador</option>
                <option value="active">Activa</option>
                <option value="paused">Pausada</option>
                <option value="completed">Completada</option>
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
          </div>
        </div>
      </main>
    </div>
  );
}


