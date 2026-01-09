"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, Search, Plus, Copy, Check, Star,
  Instagram, Twitter, Linkedin, Mail, Megaphone
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const PROMPTS = [
  { id: 1, name: "Post Viral Instagram", category: "Social", platform: "instagram", uses: 234, starred: true, 
    prompt: "Crea un post viral para Instagram sobre [tema] que incluya emojis, hashtags relevantes y un CTA claro..." },
  { id: 2, name: "Thread Educativo Twitter", category: "Social", platform: "twitter", uses: 189, starred: true,
    prompt: "Genera un thread de 10 tweets sobre [tema] que sea educativo, fácil de leer y termine con un CTA..." },
  { id: 3, name: "Email de Bienvenida", category: "Email", platform: "email", uses: 456, starred: false,
    prompt: "Escribe un email de bienvenida para nuevos suscriptores que presente [producto] y genere confianza..." },
  { id: 4, name: "Copy para Anuncio Facebook", category: "Ads", platform: "ads", uses: 321, starred: true,
    prompt: "Crea un copy persuasivo para un anuncio de Facebook sobre [producto] con gancho inicial y urgencia..." },
  { id: 5, name: "Artículo SEO Blog", category: "Content", platform: "blog", uses: 167, starred: false,
    prompt: "Escribe un artículo de blog optimizado para SEO sobre [tema] con headers H2, bullet points y conclusión..." },
];

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  email: Mail,
  ads: Megaphone,
  blog: BookOpen,
};

const CATEGORIES = ["Todos", "Social", "Email", "Ads", "Content"];

export default function LibraryPromptsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [copied, setCopied] = useState<number | null>(null);

  const filteredPrompts = PROMPTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todos" || p.category === category;
    return matchSearch && matchCategory;
  });

  const copyPrompt = (prompt: string, id: number) => {
    navigator.clipboard.writeText(prompt);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/ai-studio">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Prompt
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <BookOpen className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Biblioteca de Prompts</h1>
            <p className="text-gray-400">{PROMPTS.length} prompts guardados • Reutiliza tus mejores prompts</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar prompts..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div className="flex items-center gap-2">
            {CATEGORIES?.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${category === cat ? "bg-cyan-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {filteredPrompts?.map((prompt, i) => {
          const Icon = PLATFORM_ICONS[prompt.platform] || BookOpen;
          return (
            <motion.div key={prompt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{prompt.name}</h3>
                        {prompt.starred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-xs text-gray-500">{prompt.category} • {prompt.uses} usos</p>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => copyPrompt(prompt.prompt, prompt.id)}
                    className="p-2 bg-white/5 hover:bg-cyan-500/20 rounded-lg">
                    {copied === prompt.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </motion.button>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{prompt.prompt}</p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

