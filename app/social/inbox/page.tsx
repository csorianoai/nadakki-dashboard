"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Search, Instagram, Twitter, Linkedin, Reply, Heart, MoreHorizontal } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const MESSAGES = [
  { id: 1, platform: "instagram", user: "@maria_lopez", avatar: "M", content: "Excelente contenido! Tienen mas info?", time: "Hace 5 min", read: false },
  { id: 2, platform: "twitter", user: "@tech_carlos", avatar: "T", content: "Interesante articulo sobre IA", time: "Hace 15 min", read: false },
  { id: 3, platform: "linkedin", user: "Ana Martinez", avatar: "A", content: "Me gustaria conectar para colaboraciones", time: "Hace 1 hora", read: true },
  { id: 4, platform: "instagram", user: "@startup_mx", avatar: "S", content: "Hacen demos personalizadas?", time: "Hace 2 horas", read: true },
];

const PLATFORM_CONFIG: Record<string, { icon: any; color: string }> = {
  instagram: { icon: Instagram, color: "#E1306C" },
  twitter: { icon: Twitter, color: "#1DA1F2" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
};

export default function SocialInboxPage() {
  const [filter, setFilter] = useState("all");
  const unreadCount = MESSAGES.filter(m => !m.read).length;
  const filteredMessages = MESSAGES.filter(m => filter === "all" || m.platform === filter);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social">
        <StatusBadge status={unreadCount > 0 ? "warning" : "active"} label={unreadCount + " sin leer"} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
            <MessageSquare className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Social Inbox</h1>
            <p className="text-gray-400">Mensajes, comentarios y menciones</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar mensajes..." className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" />
          </div>
          <div className="flex items-center gap-2">
            {["all", "instagram", "twitter", "linkedin"].map(p => (
              <button key={p} onClick={() => setFilter(p)} className={`px-3 py-2 rounded-lg text-sm font-medium ${filter === p ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400"}`}>
                {p === "all" ? "Todos" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {filteredMessages?.map((msg, i) => {
          const config = PLATFORM_CONFIG[msg.platform];
          const Icon = config.icon;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className={`p-4 cursor-pointer hover:bg-white/5 ${!msg.read ? "border-l-2 border-l-blue-500" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: config.color }}>{msg.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{msg.user}</span>
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                      <span className="text-xs text-gray-500">{msg.time}</span>
                      {!msg.read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className="text-sm text-gray-300">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-white/10 rounded-lg"><Reply className="w-4 h-4 text-gray-400" /></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg"><Heart className="w-4 h-4 text-gray-400" /></button>
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

