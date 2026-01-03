"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Share2, Instagram, Twitter, Linkedin, Facebook,
  TrendingUp, Heart, MessageCircle, Repeat2, Eye
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E1306C", followers: "12.5K", engagement: "4.8%" },
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "#1DA1F2", followers: "8.2K", engagement: "3.2%" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", followers: "5.1K", engagement: "5.6%" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", followers: "15.3K", engagement: "2.9%" },
];

const RECENT_POSTS = [
  { platform: "Instagram", content: "🚀 Lanzamos nuevas funciones de IA...", likes: 234, comments: 45, shares: 12, time: "2h" },
  { platform: "Twitter", content: "¿Sabías que el 73% de empresas...", likes: 89, comments: 23, shares: 56, time: "4h" },
  { platform: "LinkedIn", content: "Nos complace anunciar nuestra...", likes: 156, comments: 34, shares: 28, time: "6h" },
];

export default function MarketingSocialPage() {
  const [activePlatform, setActivePlatform] = useState("all");

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="4 Plataformas Conectadas" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
            <Share2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Social Media Management</h1>
            <p className="text-gray-400">Gestión unificada de redes sociales con IA</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {PLATFORMS.map((platform, i) => (
          <motion.div key={platform.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group" onClick={() => setActivePlatform(platform.id)}>
              <div className="flex items-center justify-between mb-4">
                <platform.icon className="w-8 h-8" style={{ color: platform.color }} />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <h3 className="font-bold text-white">{platform.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xl font-bold text-white">{platform.followers}</p>
                  <p className="text-xs text-gray-500">Seguidores</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-400">{platform.engagement}</p>
                  <p className="text-xs text-gray-500">Engagement</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Posts Recientes</h2>
          <div className="space-y-4">
            {RECENT_POSTS.map((post, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                <GlassCard className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{post.platform}</span>
                    <span className="text-xs text-gray-500">{post.time}</span>
                  </div>
                  <p className="text-white mb-4">{post.content}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.comments}</span>
                    <span className="flex items-center gap-1"><Repeat2 className="w-4 h-4" /> {post.shares}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Agentes Sociales</h2>
          <GlassCard className="p-4">
            {["SocialPostGeneratorIA", "HashtagOptimizerIA", "EngagementAnalyzerIA", "SchedulerIA"].map((agent, i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg">
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
