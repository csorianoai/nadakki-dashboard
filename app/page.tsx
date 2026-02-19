"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Users, Zap, ArrowRight, Shield, BarChart3, Settings, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

const QUICK_LINKS = [
  { href: "/agents/execute", label: "Ejecutar Agentes", icon: Zap, color: "from-cyan-500 to-blue-600" },
  { href: "/marketing", label: "Marketing", icon: BarChart3, color: "from-green-500 to-emerald-600" },
  { href: "/admin/gates", label: "Admin Gates", icon: Shield, color: "from-amber-500 to-orange-600" },
  { href: "/admin/billing", label: "Billing", icon: Settings, color: "from-purple-500 to-pink-600" },
];

export default function HomePage() {
  const [stats, setStats] = useState({ totalAgents: 0, totalTenants: 0, backendOnline: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch("/api/ai-studio/agents")
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          const total = d?.data?.total ?? d?.data?.agents?.length ?? 0;
          setStats((s) => ({ ...s, totalAgents: total }));
        })
        .catch(() => {}),
      fetch(`${API_URL}/health`)
        .then((r) => {
          if (cancelled) return;
          setStats((s) => ({ ...s, backendOnline: r.ok }));
        })
        .catch(() => {}),
      fetch(`${API_URL}/api/v1/system/info`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d) return;
          const info = d?.data || d;
          if (info.total_tenants != null) {
            setStats((s) => ({ ...s, totalTenants: info.total_tenants }));
          }
        })
        .catch(() => {}),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="ndk-page ndk-fade-in min-h-[80vh]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                stats.backendOnline ? "bg-green-500/20 text-green-400 border border-green-500/40" : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stats.backendOnline ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
              {stats.backendOnline ? "Backend online" : "Backend offline"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            NADAKKI AI Suite
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Plataforma de automatización de marketing con inteligencia artificial
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Agentes</span>
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <span className="text-2xl font-bold text-white">{stats.totalAgents || "—"}</span>
            )}
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 text-sm">Tenants</span>
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <span className="text-2xl font-bold text-white">{stats.totalTenants || "—"}</span>
            )}
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-gray-400 text-sm">Estado</span>
            </div>
            <span className="text-lg font-semibold text-white">
              {stats.backendOnline ? "Operativo" : "Verificando"}
            </span>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Acceso rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link, i) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5 hover:border-white/20 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${link.color} flex items-center justify-center mb-3`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link href="/agents/execute">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity">
              Ejecutar agentes <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
