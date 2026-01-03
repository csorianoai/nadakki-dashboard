"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  FileText, Wand2, Image, Video, Mic, 
  ArrowRight, Sparkles, TrendingUp
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CONTENT_TYPES = [
  { id: "social", name: "Social Media Posts", icon: Sparkles, desc: "Posts para redes sociales", count: 1250, color: "#ec4899" },
  { id: "blog", name: "Blog Articles", icon: FileText, desc: "Artículos de blog SEO", count: 89, color: "#8b5cf6" },
  { id: "email", name: "Email Copy", icon: Wand2, desc: "Emails de marketing", count: 456, color: "#22c55e" },
  { id: "ads", name: "Ad Copy", icon: TrendingUp, desc: "Copy para anuncios", count: 234, color: "#f59e0b" },
];

const RECENT_CONTENT = [
  { title: "Post: Transformación Digital 2025", type: "Instagram", date: "Hace 2 horas", status: "published" },
  { title: "Email: Oferta de Año Nuevo", type: "Email", date: "Hace 5 horas", status: "draft" },
  { title: "Blog: Tendencias de IA en Marketing", type: "Blog", date: "Ayer", status: "published" },
  { title: "Ad: Campaña Q1 - Awareness", type: "Google Ads", date: "Hace 2 días", status: "review" },
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
        {CONTENT_TYPES.map((type, i) => (
          <motion.div key={type.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group">
              <div className="p-3 rounded-xl mb-4 w-fit" style={{ backgroundColor: type.color + "20" }}>
                <type.icon className="w-6 h-6" style={{ color: type.color }} />
              </div>
              <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{type.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{type.desc}</p>
              <p className="text-2xl font-bold mt-4" style={{ color: type.color }}>{type.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500">piezas generadas</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Contenido Reciente</h2>
          <GlassCard className="p-4">
            <div className="space-y-4">
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
          <h2 className="text-xl font-bold text-white mb-4">Agentes de Contenido</h2>
          <GlassCard className="p-4">
            {["ContentGeneratorIA", "CopywriterIA", "BlogWriterIA", "SEOOptimizerIA"].map((agent, i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-300">{agent}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
