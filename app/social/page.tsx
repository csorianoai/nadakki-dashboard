"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Share2, Calendar, MessageSquare, BarChart3,
  Rss, Settings, ArrowRight, Instagram, Twitter, Linkedin
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const SOCIAL_MODULES = [
  { id: "scheduler", name: "Programador", icon: Calendar, desc: "Programa posts automáticamente", href: "/social/scheduler", color: "#22c55e" },
  { id: "inbox", name: "Inbox Social", icon: MessageSquare, desc: "Mensajes y comentarios", href: "/social/inbox", color: "#3b82f6" },
  { id: "analytics", name: "Analytics", icon: BarChart3, desc: "Métricas de rendimiento", href: "/social/analytics", color: "#f59e0b" },
  { id: "feeds", name: "Feeds", icon: Rss, desc: "Monitorea contenido", href: "/social/feeds", color: "#8b5cf6" },
  { id: "editor", name: "Editor de Posts", icon: Share2, desc: "Crea y edita contenido", href: "/social/editor", color: "#ec4899" },
  { id: "connections", name: "Conexiones", icon: Settings, desc: "Gestiona cuentas", href: "/social/connections", color: "#06b6d4" },
];

const STATS = [
  { value: "41K", label: "Seguidores Total", icon: <Share2 className="w-6 h-6 text-blue-400" />, color: "#3b82f6" },
  { value: "12.5K", label: "Engagement/Mes", icon: <MessageSquare className="w-6 h-6 text-green-400" />, color: "#22c55e" },
  { value: "156", label: "Posts Este Mes", icon: <Calendar className="w-6 h-6 text-purple-400" />, color: "#8b5cf6" },
  { value: "4.2%", label: "Engagement Rate", icon: <BarChart3 className="w-6 h-6 text-yellow-400" />, color: "#f59e0b" },
];

export default function SocialPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="4 Cuentas Conectadas" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Share2 className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Social Media Hub
            </h1>
            <p className="text-gray-400 mt-1">Gestión unificada de todas tus redes sociales</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} delay={i * 0.1} />
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {SOCIAL_MODULES.map((module, i) => (
          <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <Link href={module.href}>
              <GlassCard className="p-6 cursor-pointer group h-full">
                <div className="p-3 rounded-xl mb-4 w-fit" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{module.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{module.desc}</p>
                <div className="flex items-center justify-end pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500 group-hover:text-blue-400 flex items-center gap-1">
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
            <h3 className="text-lg font-bold text-white">Cuentas Conectadas</h3>
            <p className="text-sm text-gray-400">Gestiona tus redes sociales</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Instagram className="w-5 h-5 text-pink-400" />
              <span className="text-sm text-gray-300">@credicefi</span>
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-300">@credicefi</span>
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-300">CrediCefi</span>
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
