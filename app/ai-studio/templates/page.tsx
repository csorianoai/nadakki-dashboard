"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  FileText, Search, Instagram, Twitter, Linkedin, 
  Mail, Megaphone, ShoppingCart, Newspaper, ArrowRight
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const TEMPLATES = [
  { id: "social-post", name: "Post para Redes Sociales", icon: Instagram, category: "Social Media", uses: 1250, color: "#E1306C" },
  { id: "twitter-thread", name: "Twitter Thread", icon: Twitter, category: "Social Media", uses: 890, color: "#1DA1F2" },
  { id: "linkedin-post", name: "Post de LinkedIn", icon: Linkedin, category: "Social Media", uses: 567, color: "#0A66C2" },
  { id: "email-marketing", name: "Email de Marketing", icon: Mail, category: "Email", uses: 2340, color: "#22c55e" },
  { id: "ad-copy", name: "Copy para Anuncios", icon: Megaphone, category: "Ads", uses: 1890, color: "#f59e0b" },
  { id: "product-desc", name: "Descripción de Producto", icon: ShoppingCart, category: "E-commerce", uses: 780, color: "#8b5cf6" },
  { id: "blog-article", name: "Artículo de Blog", icon: Newspaper, category: "Content", uses: 456, color: "#ec4899" },
  { id: "newsletter", name: "Newsletter", icon: Mail, category: "Email", uses: 345, color: "#06b6d4" },
];

const CATEGORIES = ["Todos", "Social Media", "Email", "Ads", "E-commerce", "Content"];

export default function AITemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todos" || t.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/ai-studio">
        <StatusBadge status="active" label="Templates" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Plantillas de Contenido</h1>
            <p className="text-gray-400">Plantillas predefinidas para generar contenido rápidamente</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar plantillas..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
          </div>
          <div className="flex items-center gap-2">
            {CATEGORIES?.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${category === cat ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-4">
        {filteredTemplates?.map((template, i) => (
          <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={`/ai-studio/generate?template=${template.id}`}>
              <GlassCard className="p-5 cursor-pointer group h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: template.color + "20" }}>
                    <template.icon className="w-6 h-6" style={{ color: template.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                    <p className="text-xs text-gray-400 mt-2">{template.uses.toLocaleString()} usos</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

