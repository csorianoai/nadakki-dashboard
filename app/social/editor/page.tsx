"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Edit, Instagram, Twitter, Linkedin, Facebook, Image, Smile, Send, Loader2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const PLATFORMS = [
  { id: "instagram", icon: Instagram, color: "#E1306C", name: "Instagram" },
  { id: "twitter", icon: Twitter, color: "#1DA1F2", name: "Twitter" },
  { id: "linkedin", icon: Linkedin, color: "#0A66C2", name: "LinkedIn" },
  { id: "facebook", icon: Facebook, color: "#1877F2", name: "Facebook" },
];

export default function SocialEditorPage() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [posting, setPosting] = useState(false);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handlePost = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    setPosting(true);
    await new Promise(r => setTimeout(r, 2000));
    setPosting(false);
    setContent("");
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social">
        <StatusBadge status="active" label="Editor de Posts" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30">
            <Edit className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Editor de Posts</h1>
            <p className="text-gray-400">Crea y publica contenido en multiples plataformas</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <GlassCard className="p-6">
            <label className="text-sm text-gray-400 mb-3 block">Plataformas</label>
            <div className="flex gap-2 mb-6">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${selectedPlatforms.includes(p.id) ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5"}`}>
                  <p.icon className="w-5 h-5" style={{ color: selectedPlatforms.includes(p.id) ? p.color : "#6b7280" }} />
                  <span className={selectedPlatforms.includes(p.id) ? "text-white" : "text-gray-500"}>{p.name}</span>
                </button>
              ))}
            </div>

            <label className="text-sm text-gray-400 mb-3 block">Contenido</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escribe tu post aqui..."
              className="w-full h-48 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-pink-500/50" />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg"><Image className="w-5 h-5 text-gray-400" /></button>
                <button className="p-2 hover:bg-white/10 rounded-lg"><Smile className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{content.length} caracteres</span>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePost}
                  disabled={posting || !content.trim()}
                  className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 ${posting || !content.trim() ? "bg-gray-600" : "bg-gradient-to-r from-pink-500 to-purple-500"}`}>
                  {posting ? <><Loader2 className="w-5 h-5 animate-spin" /> Publicando...</> : <><Send className="w-5 h-5" /> Publicar</>}
                </motion.button>
              </div>
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard className="p-6">
            <h3 className="font-bold text-white mb-4">Vista Previa</h3>
            <div className="p-4 bg-white/5 rounded-xl min-h-[200px]">
              {content ? (
                <p className="text-white whitespace-pre-wrap">{content}</p>
              ) : (
                <p className="text-gray-500 text-center">Tu post aparecera aqui</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
