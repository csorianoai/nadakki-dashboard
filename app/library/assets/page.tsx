"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FolderOpen, Search, Upload, Image, FileText, 
  Video, Music, Download, Trash2, Eye
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const ASSETS = [
  { id: 1, name: "Logo_Principal.png", type: "image", size: "245 KB", date: "Hace 2 días" },
  { id: 2, name: "Banner_Promo_Q1.jpg", type: "image", size: "1.2 MB", date: "Hace 5 días" },
  { id: 3, name: "Video_Explainer.mp4", type: "video", size: "45 MB", date: "Hace 1 semana" },
  { id: 4, name: "Presentacion_2025.pdf", type: "document", size: "3.4 MB", date: "Hace 1 semana" },
  { id: 5, name: "Jingle_Navidad.mp3", type: "audio", size: "4.5 MB", date: "Hace 2 semanas" },
  { id: 6, name: "Iconos_Pack.zip", type: "document", size: "12 MB", date: "Hace 3 semanas" },
];

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  image: { icon: Image, color: "#ec4899" },
  video: { icon: Video, color: "#8b5cf6" },
  document: { icon: FileText, color: "#3b82f6" },
  audio: { icon: Music, color: "#22c55e" },
};

export default function LibraryAssetsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredAssets = ASSETS.filter(asset => {
    const matchSearch = asset.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || asset.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing/content">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Upload className="w-4 h-4" /> Subir Asset
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <FolderOpen className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Biblioteca de Assets</h1>
            <p className="text-gray-400">{ASSETS.length} archivos • Imágenes, videos, documentos</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar assets..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
          </div>
          <div className="flex items-center gap-2">
            {["all", "image", "video", "document", "audio"].map(type => (
              <button key={type} onClick={() => setFilter(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === type ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {type === "all" ? "Todos" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-4">
        {filteredAssets.map((asset, i) => {
          const config = TYPE_CONFIG[asset.type];
          const Icon = config.icon;
          return (
            <motion.div key={asset.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5 cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: config.color + "20" }}>
                    <Icon className="w-6 h-6" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate group-hover:text-purple-400">{asset.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{asset.size} • {asset.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> Ver
                  </button>
                  <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Download className="w-3 h-3" /> Descargar
                  </button>
                  <button className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg">
                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
