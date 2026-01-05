"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, Sparkles, Star, Clock, Users, Mail, MessageSquare, Bell,
  Globe, Target, TrendingUp, Play, Eye, Copy, Download, Filter,
  Zap, BarChart3, ArrowRight, Check, Loader2, RefreshCw
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  channels: string[];
  duration: string;
  difficulty: string;
  effectiveness: number;
  users: number;
  starred: boolean;
  metrics: { open_rate: number; click_rate: number; conversion: number };
}

interface Categories {
  all: number;
  onboarding: number;
  nurturing: number;
  promotional: number;
  retention: number;
  winback: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  onboarding: "#22c55e",
  nurturing: "#3b82f6",
  promotional: "#ec4899",
  retention: "#f59e0b",
  winback: "#ef4444",
};

const CHANNEL_ICONS: Record<string, any> = { email: Mail, sms: MessageSquare, push: Bell, webhook: Globe };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Categories>({ all: 0, onboarding: 0, nurturing: 0, promotional: 0, retention: 0, winback: 0 });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"effectiveness" | "users" | "name">("effectiveness");
  const [starredOnly, setStarredOnly] = useState(false);
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/templates`);
      const data = await res.json();
      setTemplates(data.templates || []);
      setCategories(data.categories || { all: 0, onboarding: 0, nurturing: 0, promotional: 0, retention: 0, winback: 0 });
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
    setLoading(false);
  };

  const toggleStar = async (templateId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/templates/${templateId}/star`, { method: "POST" });
      const data = await res.json();
      setTemplates(templates.map(t => t.id === templateId ? { ...t, starred: data.starred } : t));
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const useTemplate = async (templateId: string) => {
    setUsingTemplate(templateId);
    try {
      const res = await fetch(`${API_URL}/api/templates/${templateId}/use?tenant_id=credicefi`, { method: "POST" });
      const data = await res.json();
      // Redirigir al journey builder con el template
      window.location.href = `/marketing/journeys/new-${templateId}?template=${templateId}&new=true`;
    } catch (error) {
      console.error("Error using template:", error);
      window.location.href = `/marketing/journeys/new-${templateId}?new=true`;
    }
    setUsingTemplate(null);
  };

  const filtered = useMemo(() => {
    return templates
      .filter(t => (category === "all" || t.category === category))
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
      .filter(t => !starredOnly || t.starred)
      .sort((a, b) => {
        if (sortBy === "effectiveness") return b.effectiveness - a.effectiveness;
        if (sortBy === "users") return b.users - a.users;
        return a.name.localeCompare(b.name);
      });
  }, [templates, category, search, sortBy, starredOnly]);

  const categoryList = [
    { id: "all", label: "Todos", count: categories.all },
    { id: "onboarding", label: "Onboarding", count: categories.onboarding, color: "#22c55e" },
    { id: "nurturing", label: "Nurturing", count: categories.nurturing, color: "#3b82f6" },
    { id: "promotional", label: "Promocional", count: categories.promotional, color: "#ec4899" },
    { id: "retention", label: "Retencion", count: categories.retention, color: "#f59e0b" },
    { id: "winback", label: "Win-back", count: categories.winback, color: "#ef4444" },
  ];

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Templates IA" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Templates Inteligentes</h1>
              <p className="text-gray-400">Plantillas optimizadas por IA para tus campanas</p>
            </div>
          </div>
          <button onClick={fetchTemplates} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Buscar templates..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none" />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
            <option value="effectiveness">Efectividad</option>
            <option value="users">Usuarios</option>
            <option value="name">Nombre</option>
          </select>
          <button onClick={() => setStarredOnly(!starredOnly)}
            className={`px-4 py-3 rounded-xl border flex items-center gap-2 ${starredOnly ? "border-yellow-500 bg-yellow-500/20 text-yellow-400" : "border-white/10 bg-white/5 text-gray-400"}`}>
            <Star className={`w-4 h-4 ${starredOnly ? "fill-yellow-400" : ""}`} /> Favoritos
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categoryList.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${category === cat.id ? "text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              style={category === cat.id ? { backgroundColor: cat.color || "#8b5cf6" } : {}}>
              {cat.label} <span className="ml-1 text-xs opacity-70">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
          <p className="text-gray-400">Cargando templates...</p>
        </div>
      ) : (
        <>
          {/* Templates Grid */}
          <div className="grid grid-cols-2 gap-6">
            {filtered.map((template, i) => {
              const catColor = CATEGORY_COLORS[template.category] || "#6b7280";
              return (
                <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-5 group hover:border-purple-500/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: catColor + "20", color: catColor }}>
                            {template.category}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{template.duration}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            template.difficulty === "Facil" ? "bg-green-500/20 text-green-400" :
                            template.difficulty === "Medio" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{template.difficulty}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{template.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                      </div>
                      <button onClick={() => toggleStar(template.id)} className="p-2 hover:bg-white/10 rounded-lg">
                        <Star className={`w-5 h-5 ${template.starred ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {template.channels.map(ch => {
                        const Icon = CHANNEL_ICONS[ch] || Globe;
                        return <div key={ch} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs text-gray-400"><Icon className="w-3 h-3" />{ch}</div>;
                      })}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <div className="text-lg font-bold text-green-400">{template.effectiveness}%</div>
                        <div className="text-xs text-gray-500">Efectividad</div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <div className="text-lg font-bold text-blue-400">{(template.users / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-gray-500">Usuarios</div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <div className="text-lg font-bold text-purple-400">{template.metrics.conversion}%</div>
                        <div className="text-xs text-gray-500">Conversion</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                      <button onClick={() => useTemplate(template.id)} disabled={usingTemplate === template.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium disabled:opacity-50">
                        {usingTemplate === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {usingTemplate === template.id ? "Cargando..." : "Usar Template"}
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Copy className="w-4 h-4" /></button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No hay templates</h3>
              <p className="text-gray-500">Intenta con otros filtros</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
