"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [reports, setReports] = useState<unknown[]>([]);

  const fetchReports = () => {
    setLoading(true);
    fetch(`${API_URL}/api/v1/reports`)
      .then((r) => {
        if (!r.ok) throw new Error("Not available");
        return r.json();
      })
      .then((data) => {
        setAvailable(true);
        setReports(Array.isArray(data) ? data : data?.reports || data?.data || []);
      })
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/" />
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
          <p className="text-gray-400">Cargando informes...</p>
        </div>
      </div>
    );
  }

  if (!available || reports.length === 0) {
    return (
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/">
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </NavigationBar>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh]"
        >
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center max-w-md">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Coming soon</h2>
            <p className="text-gray-400">
              Los informes estarán disponibles próximamente. El endpoint de reportes aún no está activo.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Informes</h1>
        <p className="text-gray-400 mt-1">Reportes y métricas del sistema</p>
      </motion.div>
      <div className="grid gap-4">
        {reports.map((r: any, i) => (
          <GlassCard key={i} className="p-4">
            <pre className="text-sm text-gray-300 overflow-auto">{JSON.stringify(r, null, 2)}</pre>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
