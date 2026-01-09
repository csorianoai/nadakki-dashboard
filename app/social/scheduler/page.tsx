"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Clock, Instagram, Twitter, Linkedin, Edit, Trash2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const SCHEDULED_POSTS = [
  { id: 1, content: "Nuevo lanzamiento proximamente...", platform: "instagram", date: "2025-01-06", time: "10:00", status: "scheduled" },
  { id: 2, content: "La IA puede transformar tu marketing", platform: "twitter", date: "2025-01-06", time: "14:00", status: "scheduled" },
  { id: 3, content: "Caso de exito: Conversiones 150%", platform: "linkedin", date: "2025-01-07", time: "09:00", status: "scheduled" },
  { id: 4, content: "Tips de productividad", platform: "instagram", date: "2025-01-07", time: "18:00", status: "draft" },
];

const PLATFORM_CONFIG: Record<string, { icon: any; color: string; name: string }> = {
  instagram: { icon: Instagram, color: "#E1306C", name: "Instagram" },
  twitter: { icon: Twitter, color: "#1DA1F2", name: "Twitter" },
  linkedin: { icon: Linkedin, color: "#0A66C2", name: "LinkedIn" },
};

export default function SocialSchedulerPage() {
  const [filter, setFilter] = useState("all");
  const filteredPosts = SCHEDULED_POSTS.filter(post => filter === "all" || post.platform === filter);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Programar Post
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Programador de Posts</h1>
            <p className="text-gray-400">{SCHEDULED_POSTS.length} posts programados</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "all" ? "bg-green-500 text-white" : "bg-white/5 text-gray-400"}`}>Todos</button>
          {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
            <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${filter === key ? "bg-green-500 text-white" : "bg-white/5 text-gray-400"}`}>
              <config.icon className="w-4 h-4" /> {config.name}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-4">
        {filteredPosts?.map((post, i) => {
          const config = PLATFORM_CONFIG[post.platform];
          const Icon = config.icon;
          return (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: config.color + "20" }}>
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={post.status === "scheduled" ? "active" : "warning"} label={post.status === "scheduled" ? "Programado" : "Borrador"} size="sm" />
                    <button className="p-2 hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                    <button className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

