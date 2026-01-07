"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, MoreVertical, Mail, MessageSquare, Bell,
  Smartphone, Play, Pause, Copy, Trash2, Edit, BarChart2, Users,
  Calendar, ChevronRight, Home, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, Clock, Archive, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import { campaignsAPI, type Campaign, type CampaignStatus, type CampaignType, cancelAllRequests } from "@/lib/api";

const statusConfig: Record<CampaignStatus, { label: string; color: string; icon: any }> = {
  draft: { label: "Borrador", color: "#64748b", icon: Edit },
  scheduled: { label: "Programada", color: "#f59e0b", icon: Clock },
  active: { label: "Activa", color: "#10b981", icon: Play },
  paused: { label: "Pausada", color: "#ef4444", icon: Pause },
  completed: { label: "Completada", color: "#6366f1", icon: CheckCircle2 },
  archived: { label: "Archivada", color: "#475569", icon: Archive },
};

const typeConfig: Record<CampaignType, { label: string; icon: any }> = {
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: MessageSquare },
  push: { label: "Push", icon: Bell },
  "in-app": { label: "In-App", icon: Smartphone },
  whatsapp: { label: "WhatsApp", icon: MessageSquare },
  "multi-channel": { label: "Multi-Canal", icon: BarChart2 },
};

function CampaignCard({ campaign, theme, onAction, isLoading }: { campaign: Campaign; theme: any; onAction: (action: string, id: string) => void; isLoading: string | null }) {
  const isLight = theme?.isLight;
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  const status = statusConfig[campaign.status];
  const type = typeConfig[campaign.type];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;
  const [showMenu, setShowMenu] = useState(false);
  const isCardLoading = isLoading === campaign.id;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl relative group"
      style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, opacity: isCardLoading ? 0.7 : 1 }}>
      {isCardLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl z-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentPrimary }} />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}15` }}>
            <TypeIcon className="w-5 h-5" style={{ color: accentPrimary }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: textPrimary }}>{campaign.name}</h3>
            <p className="text-xs" style={{ color: textMuted }}>{type.label} • v{campaign.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
            style={{ backgroundColor: `${status.color}20`, color: status.color }}>
            <StatusIcon className="w-3 h-3" />{status.label}
          </span>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)" }}>
              <MoreVertical className="w-4 h-4" style={{ color: textMuted }} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 w-40 py-1 rounded-lg shadow-xl z-20"
                style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}` }}>
                <Link href={`/marketing/campaigns/${campaign.id}`} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5" style={{ color: textPrimary }}>
                  <Edit className="w-4 h-4" /> Editar
                </Link>
                <button onClick={() => { onAction("duplicate", campaign.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5" style={{ color: textPrimary }}>
                  <Copy className="w-4 h-4" /> Duplicar
                </button>
                {campaign.status === "active" && (
                  <button onClick={() => { onAction("pause", campaign.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5" style={{ color: "#f59e0b" }}>
                    <Pause className="w-4 h-4" /> Pausar
                  </button>
                )}
                {(campaign.status === "draft" || campaign.status === "paused") && (
                  <button onClick={() => { onAction("activate", campaign.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5" style={{ color: "#10b981" }}>
                    <Play className="w-4 h-4" /> Activar
                  </button>
                )}
                <button onClick={() => { onAction("delete", campaign.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5" style={{ color: "#ef4444" }}>
                  <Trash2 className="w-4 h-4" /> Archivar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm mb-4 line-clamp-2" style={{ color: textMuted }}>{campaign.description || "Sin descripción"}</p>
      <div className="grid grid-cols-4 gap-2 p-3 rounded-lg" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: textPrimary }}>{campaign.metrics.sent.toLocaleString()}</div>
          <div className="text-[10px]" style={{ color: textMuted }}>Enviados</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-green-500">{campaign.metrics.opened.toLocaleString()}</div>
          <div className="text-[10px]" style={{ color: textMuted }}>Abiertos</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: accentPrimary }}>{campaign.metrics.clicked.toLocaleString()}</div>
          <div className="text-[10px]" style={{ color: textMuted }}>Clicks</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-cyan-500">{campaign.metrics.converted.toLocaleString()}</div>
          <div className="text-[10px]" style={{ color: textMuted }}>Conv.</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${borderColor}` }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: textMuted }}>
          <Users className="w-3 h-3" /><span>{campaign.audience_size.toLocaleString()} usuarios</span>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: textMuted }}>
          <Calendar className="w-3 h-3" /><span>{new Date(campaign.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function CampaignsListPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const isLight = theme?.isLight;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CampaignType | "all">("all");

  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgSecondary = isLight ? "#ffffff" : theme?.colors?.bgSecondary || "#111827";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textSecondary = isLight ? "#475569" : theme?.colors?.textSecondary || "#94a3b8";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = statusFilter !== "all" ? statusFilter : undefined;
      const type = typeFilter !== "all" ? typeFilter : undefined;
      const data = await campaignsAPI.list("default", status, type);
      setCampaigns(data);
    } catch (err) {
      if (err instanceof Error && err.message === 'Request cancelled') return;
      setError("Error al cargar campañas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchCampaigns();
    return () => cancelAllRequests();
  }, [fetchCampaigns]);

  const handleAction = async (action: string, campaignId: string) => {
    setActionLoading(campaignId);
    try {
      switch (action) {
        case "duplicate":
          const duplicated = await campaignsAPI.duplicate(campaignId);
          router.push(`/marketing/campaigns/${duplicated.id}`);
          break;
        case "activate":
          await campaignsAPI.activate(campaignId);
          break;
        case "pause":
          await campaignsAPI.pause(campaignId);
          break;
        case "delete":
          await campaignsAPI.delete(campaignId);
          break;
      }
      await fetchCampaigns();
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: bgPrimary }}>
      <Sidebar />
      <main className="flex-1 ml-80">
        <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: `${bgSecondary}ee`, borderBottom: `1px solid ${borderColor}` }}>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/" className="flex items-center gap-1 text-sm hover:opacity-80" style={{ color: textMuted }}><Home className="w-4 h-4" /> Inicio</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <Link href="/marketing" className="text-sm hover:opacity-80" style={{ color: textMuted }}>Marketing</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: accentPrimary }}>Campaigns</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/marketing" className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}>
                  <ArrowLeft className="w-5 h-5" style={{ color: accentPrimary }} />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                    <Mail className="w-6 h-6" style={{ color: accentPrimary }} />Campaigns
                  </h1>
                  <p className="text-sm" style={{ color: textSecondary }}>{campaigns.length} campañas • Persistencia real</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchCampaigns} disabled={loading} className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}>
                  <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} style={{ color: accentPrimary }} />
                </button>
                <Link href="/marketing/campaigns/new" className="px-4 py-2 rounded-lg font-medium text-sm text-white flex items-center gap-2" style={{ backgroundColor: accentPrimary }}>
                  <Plus className="w-4 h-4" /> Nueva Campaña
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
              <input type="text" placeholder="Buscar campañas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, color: textPrimary }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, color: textPrimary }}>
              <option value="all">Todos los estados</option>
              {Object.entries(statusConfig).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, color: textPrimary }}>
              <option value="all">Todos los tipos</option>
              {Object.entries(typeConfig).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
            </select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: accentPrimary }} />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={fetchCampaigns} className="px-4 py-2 rounded-lg font-medium text-white" style={{ backgroundColor: accentPrimary }}>Reintentar</button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-2 gap-4">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} theme={theme} onAction={handleAction} isLoading={actionLoading} />
              ))}
            </div>
          )}

          {!loading && !error && filteredCampaigns.length === 0 && (
            <div className="text-center py-20">
              <Mail className="w-16 h-16 mx-auto mb-4" style={{ color: textMuted }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: textPrimary }}>No hay campañas</h3>
              <p className="mb-4" style={{ color: textMuted }}>Crea tu primera campaña para empezar</p>
              <Link href="/marketing/campaigns/new" className="px-6 py-3 rounded-lg font-medium text-white inline-flex items-center gap-2" style={{ backgroundColor: accentPrimary }}>
                <Plus className="w-5 h-5" /> Crear Campaña
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
