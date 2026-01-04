"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  History, Search, Copy, Trash2, Eye,
  Instagram, Twitter, Linkedin, Mail, Check
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const HISTORY_ITEMS = [
  { id: 1, type: "instagram", content: "🚀 ¡Transforma tu negocio hoy! Nuestra solución de IA...", date: "Hace 2 horas", tokens: 145 },
  { id: 2, type: "email", content: "Asunto: Oferta especial de fin de año...", date: "Hace 5 horas", tokens: 320 },
  { id: 3, type: "twitter", content: "¿Sabías que el 73% de las empresas exitosas ya usan IA?...", date: "Ayer", tokens: 89 },
  { id: 4, type: "linkedin", content: "Nos complace anunciar el lanzamiento de nuestra nueva...", date: "Hace 2 días", tokens: 256 },
  { id: 5, type: "instagram", content: "ANTES: 8 horas creando contenido 😩...", date: "Hace 3 días", tokens: 178 },
];

const ICON_MAP: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  email: Mail,
};

const COLOR_MAP: Record<string, string> = {
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  email: "#22c55e",
};

export default function AIHistoryPage() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const filteredHistory = HISTORY_ITEMS.filter(item => 
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/ai-studio">
        <StatusBadge status="active" label={`${HISTORY_ITEMS.length} generaciones`} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <History className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Historial de Generaciones</h1>
            <p className="text-gray-400">Todo el contenido que has generado con IA</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar en historial..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
        </div>
      </GlassCard>

      <div className="space-y-4">
        {filteredHistory.map((item, i) => {
          const Icon = ICON_MAP[item.type] || Mail;
          const color = COLOR_MAP[item.type] || "#8b5cf6";
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: color + "20" }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{item.date}</span>
                      <span>{item.tokens} tokens</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyToClipboard(item.content, item.id)} className="p-2 hover:bg-white/10 rounded-lg">
                      {copied === item.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg">
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
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
