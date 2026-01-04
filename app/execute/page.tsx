"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, CheckCircle, Bot } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ExecutePage() {
  const [agent, setAgent] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleExecute = async () => {
    setExecuting(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 2000));
    setResult("Ejecucion completada exitosamente. El agente proceso 125 registros.");
    setExecuting(false);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Execute Agent" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30"><Play className="w-8 h-8 text-green-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Ejecutar Agente</h1><p className="text-gray-400">Ejecuta agentes de IA manualmente</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-bold text-white mb-4">Configuracion</h3>
          <div className="space-y-4">
            <div><label className="text-sm text-gray-400 block mb-2">Seleccionar Agente</label>
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white">
                <option value="">Selecciona un agente...</option>
                <option value="lead-scoring">Lead Scoring IA</option>
                <option value="content-gen">Content Generator IA</option>
                <option value="analytics">Analytics Reporter IA</option>
              </select>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} onClick={handleExecute} disabled={executing || !agent}
              className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${executing || !agent ? "bg-gray-600" : "bg-gradient-to-r from-green-500 to-emerald-500"}`}>
              {executing ? <><Loader2 className="w-5 h-5 animate-spin" /> Ejecutando...</> : <><Play className="w-5 h-5" /> Ejecutar</>}
            </motion.button>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="font-bold text-white mb-4">Resultado</h3>
          {result ? (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-green-400" /><span className="font-medium text-green-400">Exito</span></div>
              <p className="text-gray-300">{result}</p>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              <p>Los resultados apareceran aqui</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
