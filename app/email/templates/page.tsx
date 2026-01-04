"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Search, Eye, Edit, Copy, Trash2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const TEMPLATES = [
  { id: 1, name: "Welcome Email", category: "Onboarding", uses: 234, lastEdit: "Hace 2 dias" },
  { id: 2, name: "Newsletter Standard", category: "Newsletter", uses: 567, lastEdit: "Hace 1 semana" },
  { id: 3, name: "Promo Sale", category: "Promocional", uses: 123, lastEdit: "Hace 3 dias" },
  { id: 4, name: "Abandono Carrito", category: "Automatizacion", uses: 89, lastEdit: "Hace 5 dias" },
  { id: 5, name: "Feedback Request", category: "Transaccional", uses: 45, lastEdit: "Hace 1 mes" },
];

const CATEGORIES = ["Todos", "Onboarding", "Newsletter", "Promocional", "Automatizacion", "Transaccional"];

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todos" || t.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/email">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Template
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Templates de Email</h1>
            <p className="text-gray-400">{TEMPLATES.length} plantillas disponibles</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar templates..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" />
          </div>
          <div className="flex gap-2">
            {CATEGORIES.slice(0, 4).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${category === cat ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-4">
        {filteredTemplates.map((template, i) => (
          <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5 cursor-pointer group">
              <div className="h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg mb-4 flex items-center justify-center">
                <FileText className="w-12 h-12 text-purple-400/50" />
              </div>
              <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{template.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{template.category} - {template.uses} usos</p>
              <p className="text-xs text-gray-600 mt-1">{template.lastEdit}</p>
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" /> Ver
                </button>
                <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Copy className="w-3 h-3" /> Duplicar
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg">
                  <Edit className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
