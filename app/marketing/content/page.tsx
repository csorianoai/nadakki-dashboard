"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  FileText, Wand2, Calendar, Sparkles, 
  ArrowRight, TrendingUp, Clock, FolderOpen
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CONTENT_MODULES = [
  { id: "studio", name: "Content Studio", icon: Wand2, desc: "Crea contenido con IA", href: "/content/studio", color: "#8b5cf6", badge: "Popular" },
  { id: "calendar", name: "Calendario Editorial", icon: Calendar, desc: "Planifica tu contenido", href: "/content/calendar", color: "#22c55e" },
  { id: "library", name: "Biblioteca de Assets", icon: FolderOpen, desc: "Todos tus recursos", href: "/library/assets", color: "#f59e0b" },
  { id: "ai-generate", name: "AI Generator", icon: Sparkles, desc: "Generación avanzada", href: "/ai-studio/generate", color: "#ec4899" },
];

const RECENT_CONTENT = [
  { title: "Post: Transformación Digital 2025", type: "Instagram", date: "Hace 2 horas", status: "published" },
  { title: "Email: Oferta de Año Nuevo", type: "Email", date: "Hace 5 horas", status: "draft" },
  { title: "Blog: Tendencias de IA en Marketing", type: "Blog", date: "Ayer", status: "published" },
  { title: "Ad: Campaña Q1 - Awareness", type: "Google Ads", date: "Hace 2 días", status: "review" },
];

const STATS = [
  { value: "1,250", label: "Contenidos Creados", icon: <FileText className="w-6 h-6 text-purple-400" />, color: "#8b5cf6" },
  { value: "89", label: "Este Mes", icon: <TrendingUp className="w-6 h-6 text-green-400" />, color: "#22c55e" },
  { value: "4", label: "Pendientes", icon: <Clock className="w-6 h-6 text-yellow-400" />, color: "#f59e0b" },
  { value: "98%", label: "Engagement", icon: <Sparkles className="w-6 h-6 text-cyan-400" />, color: "#06b6d4" },
];

export default function MarketingContentPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <Link href="/ai-studio/generate">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Generar Contenido
          </motion.button>
        </Link>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Content Generation</h1>
            <p className="text-gray-400">Generación de contenido con IA para todas las plataformas</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} delay={i * 0.1} />
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos de Contenido</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {CONTENT_MODULES.map((module, i) => (
          <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link href={module.href}>
              <GlassCard className="p-5 cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                    <module.icon className="w-5 h-5" style={{ color: module.color }} />
                  </div>
                  {module.badge && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">{module.badge}</span>
                  )}
                </div>
                <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{module.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{module.desc}</p>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Contenido Reciente</h2>
          <GlassCard className="p-4">
            <div className="space-y-3">
              {RECENT_CONTENT.map((content, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium text-white">{content.title}</p>
                    <p className="text-sm text-gray-400">{content.type} • {content.date}</p>
                  </div>
                  <StatusBadge 
                    status={content.status === "published" ? "active" : content.status === "draft" ? "inactive" : "warning"} 
                    label={content.status === "published" ? "Publicado" : content.status === "draft" ? "Borrador" : "Revisión"} 
                    size="sm" 
                  />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <Link href="/ai-studio/generate">
              <GlassCard className="p-4 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-300 group-hover:text-white">Generar con IA</span>
                  <ArrowRight className="w-4 h-4 text-gray-500 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassCard>
            </Link>
            <Link href="/content/calendar">
              <GlassCard className="p-4 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-300 group-hover:text-white">Ver Calendario</span>
                  <ArrowRight className="w-4 h-4 text-gray-500 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassCard>
            </Link>
            <Link href="/ai-studio/templates">
              <GlassCard className="p-4 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-300 group-hover:text-white">Ver Templates</span>
                  <ArrowRight className="w-4 h-4 text-gray-500 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassCard>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
