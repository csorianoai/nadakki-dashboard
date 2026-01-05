"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, Sparkles, Star, Clock, Users, Mail, MessageSquare, Bell,
  Globe, Target, TrendingUp, Play, Eye, Copy, Download, Filter,
  Zap, BarChart3, ArrowRight, Check
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  channels: string[];
  duration: string;
  difficulty: "Fácil" | "Medio" | "Avanzado";
  effectiveness: number;
  users: number;
  starred: boolean;
  metrics: { openRate: number; clickRate: number; conversion: number };
}

const CATEGORIES = [
  { id: "all", label: "Todos", count: 12 },
  { id: "onboarding", label: "Onboarding", count: 3, color: "#22c55e" },
  { id: "nurturing", label: "Nurturing", count: 2, color: "#3b82f6" },
  { id: "promotional", label: "Promocional", count: 3, color: "#ec4899" },
  { id: "retention", label: "Retención", count: 2, color: "#f59e0b" },
  { id: "winback", label: "Win-back", count: 2, color: "#ef4444" },
];

const TEMPLATES: Template[] = [
  { id: "t1", name: "Onboarding Completo", description: "Secuencia de 7 emails para nuevos usuarios con tips y guías", category: "onboarding", channels: ["email", "push"], duration: "14 días", difficulty: "Fácil", effectiveness: 92, users: 12500, starred: true, metrics: { openRate: 78, clickRate: 45, conversion: 28 } },
  { id: "t2", name: "Nurturing Educativo", description: "Educa a leads con contenido de valor y casos de éxito", category: "nurturing", channels: ["email", "sms"], duration: "30 días", difficulty: "Medio", effectiveness: 85, users: 8400, starred: true, metrics: { openRate: 72, clickRate: 38, conversion: 22 } },
  { id: "t3", name: "Lanzamiento Producto", description: "Campaña completa para lanzamiento con countdown y ofertas", category: "promotional", channels: ["email", "sms", "push"], duration: "10 días", difficulty: "Avanzado", effectiveness: 88, users: 15600, starred: false, metrics: { openRate: 68, clickRate: 42, conversion: 31 } },
  { id: "t4", name: "Prevención Churn", description: "Detecta y retiene usuarios en riesgo de abandonar", category: "retention", channels: ["email", "sms"], duration: "21 días", difficulty: "Medio", effectiveness: 76, users: 5200, starred: true, metrics: { openRate: 65, clickRate: 28, conversion: 18 } },
  { id: "t5", name: "Win-back Agresivo", description: "Recupera usuarios inactivos con ofertas especiales", category: "winback", channels: ["email", "sms"], duration: "7 días", difficulty: "Fácil", effectiveness: 64, users: 9200, starred: false, metrics: { openRate: 58, clickRate: 24, conversion: 12 } },
  { id: "t6", name: "Onboarding SaaS", description: "Específico para productos SaaS con trials y demos", category: "onboarding", channels: ["email"], duration: "21 días", difficulty: "Medio", effectiveness: 89, users: 6800, starred: false, metrics: { openRate: 75, clickRate: 41, conversion: 26 } },
  { id: "t7", name: "Black Friday", description: "Campaña de ventas estacional con urgencia y escasez", category: "promotional", channels: ["email", "sms", "push"], duration: "5 días", difficulty: "Avanzado", effectiveness: 94, users: 22400, starred: true, metrics: { openRate: 82, clickRate: 51, conversion: 38 } },
  { id: "t8", name: "Nurturing Enterprise", description: "Para clientes corporativos con contenido premium", category: "nurturing", channels: ["email"], duration: "45 días", difficulty: "Avanzado", effectiveness: 91, users: 3200, starred: true, metrics: { openRate: 81, clickRate: 47, conversion: 34 } },
  { id: "t9", name: "Bienvenida Express", description: "Onboarding rápido de 3 emails esenciales", category: "onboarding", channels: ["email"], duration: "5 días", difficulty: "Fácil", effectiveness: 82, users: 18900, starred: false, metrics: { openRate: 71, clickRate: 35, conversion: 20 } },
  { id: "t10", name: "Reactivación Suave", description: "Win-back gradual sin ser invasivo", category: "winback", channels: ["email"], duration: "14 días", difficulty: "Fácil", effectiveness: 68, users: 7600, starred: false, metrics: { openRate: 52, clickRate: 21, conversion: 9 } },
  { id: "t11", name: "Flash Sale", description: "Promoción relámpago de 24-48 horas", category: "promotional", channels: ["email", "sms", "push"], duration: "2 días", difficulty: "Medio", effectiveness: 86, users: 14200, starred: false, metrics: { openRate: 74, clickRate: 48, conversion: 29 } },
  { id: "t12", name: "Loyalty Program", description: "Programa de fidelización con puntos y rewards", category: "retention", channels: ["email", "push"], duration: "Ongoing", difficulty: "Avanzado", effectiveness: 79, users: 4500, starred: true, metrics: { openRate: 69, clickRate: 33, conversion: 15 } },
];

const CHANNEL_ICONS: Record<string, any> = { email: Mail, sms: MessageSquare, push: Bell, webhook: Globe };

export default function TemplatesPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"effectiveness" | "users" | "name">("effectiveness");
  const [starredOnly, setStarredOnly] = useState(false);

  const filtered = useMemo(() => {
    return TEMPLATES
      .filter(t => (category === "all" || t.category === category))
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
      .filter(t => !starredOnly || t.starred)
      .sort((a, b) => {
        if (sortBy === "effectiveness") return b.effectiveness - a.effectiveness;
        if (sortBy === "users") return b.users - a.users;
        return a.name.localeCompare(b.name);
      });
  }, [category, search, sortBy, starredOnly]);

  const useTemplate = (id: string) => {
    window.location.href = `/marketing/journeys?template=${id}`;
  };

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
              <p className="text-gray-400">Plantillas optimizadas por IA para tus campañas</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium">
            <Zap className="w-5 h-5" /> Crear con IA
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
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${category === cat.id ? "text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              style={category === cat.id ? { backgroundColor: cat.color || "#8b5cf6" } : {}}>
              {cat.label} <span className="ml-1 text-xs opacity-70">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filtered.map((template, i) => {
          const cat = CATEGORIES.find(c => c.id === template.category);
          return (
            <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5 group hover:border-purple-500/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: (cat?.color || "#6b7280") + "20", color: cat?.color || "#9ca3af" }}>{cat?.label}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{template.duration}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{template.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg">
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
                    <div className="text-xs text-gray-500">Conversión</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button onClick={() => useTemplate(template.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium">
                    <Play className="w-4 h-4" /> Usar Template
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
    </div>
  );
}
