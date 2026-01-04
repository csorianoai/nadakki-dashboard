"use client";
import { motion } from "framer-motion";
import { Rss, Plus, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const FEEDS = [
  { id: 1, name: "TechCrunch", url: "techcrunch.com/feed", posts: 45, lastUpdate: "Hace 5 min", active: true },
  { id: 2, name: "Marketing Land", url: "marketingland.com/feed", posts: 23, lastUpdate: "Hace 15 min", active: true },
  { id: 3, name: "HubSpot Blog", url: "blog.hubspot.com/feed", posts: 67, lastUpdate: "Hace 1 hora", active: true },
  { id: 4, name: "Social Media Today", url: "socialmediatoday.com/feed", posts: 34, lastUpdate: "Hace 2 horas", active: false },
];

export default function SocialFeedsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agregar Feed
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Rss className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Feeds RSS</h1>
            <p className="text-gray-400">Monitorea contenido de fuentes externas</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {FEEDS.map((feed, i) => (
          <motion.div key={feed.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <Rss className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{feed.name}</h3>
                    <p className="text-sm text-gray-500">{feed.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-white">{feed.posts} posts</p>
                    <p className="text-xs text-gray-500">{feed.lastUpdate}</p>
                  </div>
                  <StatusBadge status={feed.active ? "active" : "inactive"} label={feed.active ? "Activo" : "Pausado"} size="sm" />
                  <div className="flex gap-1">
                    <button className="p-2 hover:bg-white/10 rounded-lg"><ExternalLink className="w-4 h-4 text-gray-400" /></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
                    <button className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
