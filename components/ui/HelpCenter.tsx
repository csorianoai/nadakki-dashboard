"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, X, Book, MessageSquare, Mail, ExternalLink,
  ChevronRight, Search, Sparkles, FileText, Video, Headphones
} from "lucide-react";

const FAQ_ITEMS = [
  { q: "Como crear una campana?", a: "Ve a Marketing > Campaign Builder y sigue el wizard de 4 pasos." },
  { q: "Como conectar redes sociales?", a: "Ve a Social > Conexiones y haz clic en Conectar para cada plataforma." },
  { q: "Como ejecutar un agente de IA?", a: "Navega al core correspondiente, selecciona el agente y haz clic en Ejecutar." },
  { q: "Que son los workflows?", a: "Los workflows son secuencias automatizadas de agentes que trabajan juntos." },
];

const RESOURCES = [
  { name: "Documentacion", icon: Book, href: "https://docs.nadakki.com", color: "#3b82f6" },
  { name: "Video Tutoriales", icon: Video, href: "https://nadakki.com/tutorials", color: "#ef4444" },
  { name: "API Reference", icon: FileText, href: "https://api.nadakki.com/docs", color: "#22c55e" },
  { name: "Soporte", icon: Headphones, href: "mailto:support@nadakki.com", color: "#8b5cf6" },
];

export default function HelpCenter() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaq = FAQ_ITEMS.filter(item => 
    item.q.toLowerCase().includes(search.toLowerCase()) ||
    item.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-white font-medium shadow-lg shadow-purple-500/25"
      >
        <HelpCircle className="w-5 h-5" />
        <span>Ayuda</span>
      </motion.button>

      {/* Help Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 h-full w-96 bg-[#0a0f1c] border-l border-white/10 z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#0a0f1c] border-b border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-white">Centro de Ayuda</h2>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar ayuda..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Acciones Rapidas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {RESOURCES.map(res => (
                      <a key={res.name} href={res.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <res.icon className="w-4 h-4" style={{ color: res.color }} />
                        <span className="text-sm text-gray-300">{res.name}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* FAQ */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Preguntas Frecuentes</h3>
                  <div className="space-y-2">
                    {filteredFaq.map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                          className="w-full flex items-center justify-between p-3 text-left"
                        >
                          <span className="text-sm text-white">{item.q}</span>
                          <ChevronRight className={"w-4 h-4 text-gray-500 transition-transform " + 
                            (expandedFaq === i ? "rotate-90" : "")} />
                        </button>
                        <AnimatePresence>
                          {expandedFaq === i && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="px-3 pb-3 text-sm text-gray-400">{item.a}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20">
                  <h3 className="text-sm font-medium text-white mb-2">Necesitas mas ayuda?</h3>
                  <p className="text-xs text-gray-400 mb-3">Nuestro equipo esta disponible 24/7</p>
                  <a href="mailto:support@nadakki.com"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors">
                    <Mail className="w-4 h-4" /> Contactar Soporte
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
