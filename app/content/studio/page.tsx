"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Wand2, Sparkles, Copy, Check, RefreshCw, 
  Loader2, Instagram, Twitter, Linkedin, Mail
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E1306C" },
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "#1DA1F2" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { id: "email", name: "Email", icon: Mail, color: "#22c55e" },
];

const TONES = ["Profesional", "Casual", "Divertido", "Urgente", "Inspiracional"];

export default function ContentStudioPage() {
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("Profesional");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setResults([
      "🚀 ¡Transforma tu negocio hoy! Nuestra solución de IA automatiza tu marketing en minutos. 💡 Resultados garantizados. #Marketing #AI",
      "¿Sabías que el 73% de las empresas exitosas ya usan IA para marketing? 📊 No te quedes atrás → Descubre cómo ✨ #TransformaciónDigital",
      "ANTES: 8 horas creando contenido 😩\nDESPUÉS: 30 minutos con IA 🎯\n\nLa diferencia es automatización. 👉 Agenda tu demo #Productividad"
    ]);
    setGenerating(false);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing/content">
        <StatusBadge status="active" label="Content Studio" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Wand2 className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Content Studio</h1>
            <p className="text-gray-400">Crea contenido optimizado para cualquier plataforma</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-6">Configuración</h3>
            
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-3 block">Plataforma</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS?.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${platform === p.id ? "border-purple-500 bg-purple-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                    <p.icon className="w-5 h-5" style={{ color: p.color }} />
                    <span className={`text-sm ${platform === p.id ? "text-white" : "text-gray-400"}`}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-3 block">Tono</label>
              <div className="flex flex-wrap gap-2">
                {TONES?.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${tone === t ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-3 block">Descripción</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe el contenido que quieres generar..."
                className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50" />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generate}
              disabled={generating || !prompt.trim()}
              className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${generating || !prompt.trim() ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando...</> : <><Sparkles className="w-5 h-5" /> Generar Contenido</>}
            </motion.button>
          </GlassCard>
        </div>

        <div className="col-span-3">
          <GlassCard className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Resultados</h3>
              {results.length > 0 && (
                <button onClick={() => setResults([])} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> Limpiar
                </button>
              )}
            </div>

            {results.length > 0 ? (
              <div className="space-y-4">
                {results?.map((result, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="p-5 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">Variante {i + 1}</span>
                      <button onClick={() => copyToClipboard(result, i)} className="p-2 hover:bg-white/10 rounded-lg">
                        {copied === i ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                    <p className="text-white whitespace-pre-wrap">{result}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-purple-500/10 mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400">Configura y genera contenido</p>
                <p className="text-sm text-gray-500 mt-2">Los resultados aparecerán aquí</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

