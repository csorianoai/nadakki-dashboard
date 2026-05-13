"use client";
import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import {
  Share2, Calendar, MessageSquare, Heart, Repeat2, Eye, Users,
  TrendingUp, Clock, Image, Video, Link2, Send, Plus, Filter,
  BarChart3, Bell, Inbox, Settings, ChevronLeft, ChevronRight,
  Twitter, Instagram, Linkedin, Facebook, Youtube, Loader2
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * Social Media Manager — empty state.
 *
 * This page currently has no backend API for social media metrics.
 * When /api/marketing/social/* endpoints are available, wire them here.
 */
export default function SocialMediaPage() {
  const [showComposer, setShowComposer] = useState(false);
  const [newPost, setNewPost] = useState("");

  const PLATFORM_ICONS = [
    { id: "twitter", name: "Twitter/X", icon: Twitter, color: "#1DA1F2" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2" },
  ];

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="warning" label="Social Media" size="lg" />
      </NavigationBar>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30">
            <Share2 className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Social Media Manager</h1>
            <p className="text-gray-400">Gestiona todas tus redes sociales en un solo lugar</p>
          </div>
        </div>
        <button onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 rounded-xl text-white font-medium">
          <Plus className="w-5 h-5" /> Create Post
        </button>
      </div>

      {/* Empty State — No connected platforms */}
      <div className="text-center py-20">
        <Share2 className="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-white mb-2">Sin cuentas conectadas</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          Conecta tus cuentas de redes sociales para ver metricas, programar publicaciones y gestionar tu bandeja de entrada social.
        </p>
        <div className="flex justify-center gap-4">
          {PLATFORM_ICONS.map(p => {
            const Icon = p.icon;
            return (
              <button key={p.id}
                className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all">
                <Icon className="w-5 h-5" style={{ color: p.color }} />
                <span className="text-sm">Conectar {p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Composer Modal (kept functional for when platforms are connected) */}
      {showComposer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowComposer(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Create Post</h3>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                {PLATFORM_ICONS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} className="p-2 rounded-lg border border-white/10 hover:border-white/30" style={{ backgroundColor: p.color + "10" }}>
                      <Icon className="w-5 h-5" style={{ color: p.color }} />
                    </button>
                  );
                })}
              </div>
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} rows={4}
                placeholder="What's on your mind?" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none mb-4" />
              <div className="flex gap-2 mb-4">
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Image className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Video className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Link2 className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-between">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowComposer(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">Cancel</button>
                <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg text-white flex items-center gap-2">
                  <Send className="w-4 h-4" /> Post Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
