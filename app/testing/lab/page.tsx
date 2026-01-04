"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const TESTS = [
  { name: "Lead Scoring Accuracy", status: "passed", duration: "2.3s" },
  { name: "Content Generation Quality", status: "passed", duration: "5.1s" },
  { name: "API Response Time", status: "passed", duration: "0.8s" },
  { name: "Data Validation", status: "failed", duration: "1.2s" },
];

export default function TestingLabPage() {
  const [running, setRunning] = useState(false);

  const runTests = async () => { setRunning(true); await new Promise(r => setTimeout(r, 3000)); setRunning(false); };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/testing">
        <motion.button whileHover={{ scale: 1.05 }} onClick={runTests} disabled={running}
          className={`px-4 py-2 rounded-lg font-medium text-white text-sm flex items-center gap-2 ${running ? "bg-gray-600" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}>
          {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Ejecutando...</> : <><Play className="w-4 h-4" /> Run All Tests</>}
        </motion.button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30"><FlaskConical className="w-8 h-8 text-cyan-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Testing Lab</h1><p className="text-gray-400">Ejecuta y monitorea pruebas</p></div>
        </div>
      </motion.div>
      <div className="space-y-3">
        {TESTS.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {t.status === "passed" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  <span className="text-white">{t.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">{t.duration}</span>
                  <StatusBadge status={t.status === "passed" ? "active" : "error"} label={t.status === "passed" ? "Passed" : "Failed"} size="sm" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
