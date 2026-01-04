"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Sparkles, Wand2, FileText, Image, History, 
  Settings, Bot, ArrowRight, Zap, BookOpen
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const AI_TOOLS = [
  { id: "generate", name: "Content Generator", icon: Wand2, desc: "Genera contenido con IA", href: "/ai-studio/generate", color: "#8b5cf6", badge: "Popular" },
  { id: "templates", name: "Templates", icon: FileText, desc: "Plantillas predefinidas", href: "/ai-studio/templates", color: "#22c55e" },
  { id: "history", name: "Historial", icon: History, desc: "Generaciones anteriores", href: "/ai-studio/history", color: "#f59e0b" },
  { id: "agents", name: "Mis Agentes", icon: Bot, desc: "Agentes personalizados", href: "/ai-studio/agents", color: "#ec4899" },
  { id: "prompts", name: "Prompt Library", icon: BookOpen, desc: "Biblioteca de prompts", href: "/library/prompts", color: "#06b6d4" },
  { id: "settings", name: "Configuración", icon: Settings, desc: "Ajustes de generación", href: "/ai-studio/settings", color: "#6b7280" },
];

const STATS = [
  { value: "6", label: "Herramientas", icon: <Wand2 className="w-6 h-6 text-purple-400" />, color: "#8b5cf6" },
  { value: "15K", label: "Generaciones", icon: <FileText className="w-6 h-6 text-green-400" />, color: "#22c55e" },
  { value: "4.8", label: "Rating", icon: <Sparkles className="w-6 h-6 text-yellow-400" />, color: "#f59e0b" },
  { value: "99%", label: "Uptime", icon: <Zap className="w-6 h-6 text-cyan-400" />, color: "#06b6d4" },
];

export default function AIStudioPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="AI Studio" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AI Studio
            </h1>
            <p className="text-gray-400 mt-1">Herramientas de generación de contenido con inteligencia artificial</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} delay={i * 0.1} />
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Herramientas Disponibles</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {AI_TOOLS.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <Link href={tool.href}>
              <GlassCard className="p-6 cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: tool.color + "20" }}>
                    <tool.icon className="w-6 h-6" style={{ color: tool.color }} />
                  </div>
                  {tool.badge && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{tool.desc}</p>
                <div className="flex items-center justify-end pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500 group-hover:text-purple-400 flex items-center gap-1">
                    Abrir <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Inicio Rápido</h3>
            <p className="text-sm text-gray-400">Comienza a generar contenido en segundos</p>
          </div>
          <Link href="/ai-studio/generate">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white flex items-center gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Generar Contenido
            </motion.button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
