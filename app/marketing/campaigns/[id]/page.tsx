"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Mail, Eye, Send } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import { campaignsAPI } from "@/lib/api";
import type { Campaign } from "@/lib/api";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme?.isLight;
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const data = await campaignsAPI.getById(campaignId);
        setCampaign(data);
      } catch (err) {
        setError("Error al cargar campaña");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (campaignId) fetchCampaign();
  }, [campaignId]);

  const handleSave = async () => {
    if (!campaign) return;
    setSaving(true);
    try {
      await campaignsAPI.update(campaignId, campaign);
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
          <p style={{ color: textPrimary }}>{error || "Campaña no encontrada"}</p>
          <Link href="/marketing/campaigns" className="mt-4 inline-block" style={{ color: accentPrimary }}>Volver</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: bgPrimary }}>
      <Sidebar />
      <main className="flex-1 ml-80 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/marketing/campaigns" className="p-2 rounded-lg" style={{ backgroundColor: bgCard }}>
              <ArrowLeft className="w-5 h-5" style={{ color: textMuted }} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>{campaign.name}</h1>
              <p className="text-sm" style={{ color: textMuted }}>ID: {campaign.id}</p>
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
              <h2 className="font-semibold mb-4" style={{ color: textPrimary }}>Información</h2>
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
                  <label className="block text-sm mb-1" style={{ color: textMuted }}>Descripción</label>
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
                <h2 className="font-semibold mb-4" style={{ color: textPrimary }}>Estadísticas</h2>
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