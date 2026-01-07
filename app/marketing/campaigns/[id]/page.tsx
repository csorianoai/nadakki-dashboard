"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Play, Pause, Eye, Settings, Users, ChevronRight, Home, Loader2, CheckCircle2, AlertCircle, Clock, Mail, MessageSquare, Bell, Smartphone, Layers, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import { campaignsAPI, type Campaign } from "@/lib/api";

const AUTOSAVE_INTERVAL = 5000;

export default function CampaignEditorPage() {
  const { theme } = useTheme();
  const params = useParams();
  const campaignId = params.id as string;
  const isLight = theme?.isLight;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "audience" | "settings">("content");
  
  const [content, setContent] = useState({ subject: "", body: "", preheader: "", cta_text: "Learn More", cta_url: "" });
  const contentRef = useRef(content);
  const hasChangesRef = useRef(hasChanges);

  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgSecondary = isLight ? "#ffffff" : theme?.colors?.bgSecondary || "#111827";
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const data = await campaignsAPI.get(campaignId);
        setCampaign(data);
        setContent({ subject: data.subject || "", body: data.content?.body || "", preheader: data.content?.preheader || "", cta_text: data.content?.cta_text || "Learn More", cta_url: data.content?.cta_url || "" });
      } catch (err) { setError("Error al cargar"); console.error(err); } 
      finally { setLoading(false); }
    };
    fetchCampaign();
  }, [campaignId]);

  useEffect(() => { contentRef.current = content; hasChangesRef.current = hasChanges; }, [content, hasChanges]);

  useEffect(() => {
    const autosave = async () => {
      if (!hasChangesRef.current || !campaign) return;
      try { setSaving(true); await campaignsAPI.saveDraft(campaignId, contentRef.current); setLastSaved(new Date()); setHasChanges(false); } 
      catch (err) { console.error("Autosave failed:", err); } 
      finally { setSaving(false); }
    };
    const interval = setInterval(autosave, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [campaignId, campaign]);

  const handleContentChange = (field: string, value: string) => { setContent(prev => ({ ...prev, [field]: value })); setHasChanges(true); };
  const handleSave = async () => { if (!campaign) return; setSaving(true); try { await campaignsAPI.update(campaignId, { subject: content.subject, content }); setLastSaved(new Date()); setHasChanges(false); } catch (err) { setError("Error"); } finally { setSaving(false); } };
  const handleActivate = async () => { if (!campaign) return; try { await campaignsAPI.activate(campaignId); setCampaign({ ...campaign, status: "active" }); } catch (err) { console.error(err); } };
  const handlePause = async () => { if (!campaign) return; try { await campaignsAPI.pause(campaignId); setCampaign({ ...campaign, status: "paused" }); } catch (err) { console.error(err); } };

  const typeIcons: Record<string, any> = { email: Mail, sms: MessageSquare, push: Bell, "in-app": Smartphone, whatsapp: MessageSquare, "multi-channel": Layers };
  const TypeIcon = campaign ? typeIcons[campaign.type] || Mail : Mail;

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: bgPrimary }}><Loader2 className="w-12 h-12 animate-spin" style={{ color: accentPrimary }} /></div>;
  if (error || !campaign) return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: bgPrimary }}><div className="text-center"><AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" /><p className="text-red-500 mb-4">{error || "No encontrada"}</p><Link href="/marketing/campaigns" className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: accentPrimary }}>Volver</Link></div></div>;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: bgPrimary }}>
      <Sidebar />
      <main className="flex-1 ml-80">
        <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: bgSecondary + "ee", borderBottom: "1px solid " + borderColor }}>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/" className="flex items-center gap-1 text-sm" style={{ color: textMuted }}><Home className="w-4 h-4" /> Inicio</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <Link href="/marketing/campaigns" className="text-sm" style={{ color: textMuted }}>Campaigns</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: accentPrimary }}>{campaign.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/marketing/campaigns" className="p-2 rounded-lg" style={{ backgroundColor: accentPrimary + "20" }}><ArrowLeft className="w-5 h-5" style={{ color: accentPrimary }} /></Link>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: accentPrimary + "15" }}><TypeIcon className="w-5 h-5" style={{ color: accentPrimary }} /></div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: textPrimary }}>{campaign.name}</h1>
                    <div className="flex items-center gap-2">
                      <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (campaign.status === "active" ? "bg-green-500/20 text-green-500" : campaign.status === "paused" ? "bg-amber-500/20 text-amber-500" : "bg-gray-500/20 text-gray-400")}>{campaign.status}</span>
                      <span className="text-sm" style={{ color: textMuted }}>v{campaign.version}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: textMuted }}>
                  {saving && <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>}
                  {!saving && hasChanges && <><Clock className="w-4 h-4" /> Sin guardar</>}
                  {!saving && !hasChanges && lastSaved && <><CheckCircle2 className="w-4 h-4 text-green-500" /> Guardado</>}
                </div>
                <button onClick={handleSave} disabled={saving || !hasChanges} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor, color: textPrimary }}><Save className="w-4 h-4" /> Guardar</button>
                {campaign.status === "active" ? <button onClick={handlePause} className="px-4 py-2 rounded-lg text-sm text-white flex items-center gap-2 bg-amber-500"><Pause className="w-4 h-4" /> Pausar</button> : <button onClick={handleActivate} className="px-4 py-2 rounded-lg text-sm text-white flex items-center gap-2 bg-green-500"><Play className="w-4 h-4" /> Activar</button>}
              </div>
            </div>
          </div>
          <div className="px-6 flex gap-1">
            {[{ id: "content", label: "Contenido", icon: Mail }, { id: "audience", label: "Audiencia", icon: Users }, { id: "settings", label: "Config", icon: Settings }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2" style={{ color: activeTab === tab.id ? accentPrimary : textMuted, borderColor: activeTab === tab.id ? accentPrimary : "transparent" }}><tab.icon className="w-4 h-4" />{tab.label}</button>
            ))}
          </div>
        </header>
        <div className="p-6">
          {activeTab === "content" && (
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
                <h3 className="font-semibold mb-4" style={{ color: textPrimary }}>Editor</h3>
                {(campaign.type === "email" || campaign.type === "push") && (
                  <div className="mb-4"><label className="block text-sm mb-2" style={{ color: textPrimary }}>Asunto</label><input type="text" value={content.subject} onChange={(e) => handleContentChange("subject", e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }} /></div>
                )}
                <div className="mb-4"><label className="block text-sm mb-2" style={{ color: textPrimary }}>Contenido</label><textarea value={content.body} onChange={(e) => handleContentChange("body", e.target.value)} rows={10} className="w-full px-4 py-3 rounded-lg text-sm resize-none" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-2" style={{ color: textPrimary }}>CTA</label><input type="text" value={content.cta_text} onChange={(e) => handleContentChange("cta_text", e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }} /></div>
                  <div><label className="block text-sm mb-2" style={{ color: textPrimary }}>URL</label><input type="text" value={content.cta_url} onChange={(e) => handleContentChange("cta_url", e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor, color: textPrimary }} /></div>
                </div>
                <div className="mt-4 p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: accentPrimary + "10" }}>
                  <Sparkles className="w-6 h-6" style={{ color: accentPrimary }} />
                  <div className="flex-1"><p className="font-medium" style={{ color: textPrimary }}>Generar con IA</p></div>
                  <Link href="/marketing/templates/create" className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: accentPrimary }}><Zap className="w-4 h-4 inline" /> IA</Link>
                </div>
              </div>
              <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}>
                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold" style={{ color: textPrimary }}>Preview</h3><Eye className="w-5 h-5" style={{ color: textMuted }} /></div>
                <div className="rounded-lg p-4" style={{ backgroundColor: bgPrimary, border: "1px solid " + borderColor }}>
                  {content.subject && <div className="mb-4 pb-4" style={{ borderBottom: "1px solid " + borderColor }}><p className="font-medium" style={{ color: textPrimary }}>{content.subject}</p></div>}
                  <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: textPrimary }}>{content.body || "Preview..."}</pre>
                  {content.cta_text && <button className="mt-4 px-6 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: accentPrimary }}>{content.cta_text}</button>}
                </div>
              </div>
            </div>
          )}
          {activeTab === "audience" && <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}><h3 className="font-semibold mb-4" style={{ color: textPrimary }}>Audiencia</h3><div className="flex items-center gap-4"><Users className="w-10 h-10" style={{ color: accentPrimary }} /><div><p className="text-2xl font-bold" style={{ color: textPrimary }}>{campaign.audience_size.toLocaleString()}</p><p className="text-sm" style={{ color: textMuted }}>usuarios</p></div></div></div>}
          {activeTab === "settings" && <div className="p-6 rounded-xl" style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}><h3 className="font-semibold mb-4" style={{ color: textPrimary }}>Config</h3><p className="text-sm" style={{ color: textMuted }}>ID: {campaign.id}</p></div>}
        </div>
      </main>
    </div>
  );
}