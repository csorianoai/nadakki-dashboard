"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Workflow, Zap, Users, TrendingUp, Mail, BarChart3, Search, TestTube, Star, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const WORKFLOWS = [
  { id: "campaign-optimization", name: "Campaign Optimization", icon: Zap, desc: "Optimiza campañas con IA predictiva", agents: 5, color: "#8b5cf6", status: "active" },
  { id: "customer-acquisition-intelligence", name: "Customer Acquisition", icon: Users, desc: "Adquisición inteligente de clientes", agents: 5, color: "#22c55e", status: "active" },
  { id: "customer-lifecycle-revenue", name: "Customer Lifecycle", icon: TrendingUp, desc: "Maximiza el valor del cliente", agents: 5, color: "#f59e0b", status: "active" },
  { id: "content-performance-engine", name: "Content Performance", icon: BarChart3, desc: "Optimiza rendimiento de contenido", agents: 5, color: "#3b82f6", status: "active" },
  { id: "social-media-intelligence", name: "Social Intelligence", icon: Search, desc: "Inteligencia de redes sociales", agents: 4, color: "#ec4899", status: "active" },
  { id: "email-automation-master", name: "Email Automation", icon: Mail, desc: "Automatización de email marketing", agents: 5, color: "#06b6d4", status: "active" },
  { id: "multi-channel-attribution", name: "Attribution", icon: BarChart3, desc: "Atribución multi-canal", agents: 4, color: "#a855f7", status: "active" },
  { id: "competitive-intelligence-hub", name: "Competitive Intel", icon: Search, desc: "Inteligencia competitiva", agents: 4, color: "#ef4444", status: "active" },
  { id: "ab-testing-experimentation", name: "A/B Testing", icon: TestTube, desc: "Experimentación y testing", agents: 4, color: "#14b8a6", status: "active" },
  { id: "influencer-partnership-engine", name: "Influencer Engine", icon: Star, desc: "Gestión de influencers", agents: 4, color: "#f97316", status: "active" },
];

export default function WorkflowsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="10 Workflows Activos" size="lg" />
      </NavigationBar>

      <div className="ndk-page-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-2"
        >
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <Workflow className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="ndk-page-title">Marketing Workflows</h1>
            <p className="ndk-page-subtitle">10 workflows de automatización con IA • 45 agentes integrados</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WORKFLOWS.map((wf, index) => (
          <motion.div
            key={wf.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={"/workflows/" + wf.id}>
              <GlassCard className="p-6 cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: wf.color + "20" }}>
                    <wf.icon className="w-6 h-6" style={{ color: wf.color }} />
                  </div>
                  <StatusBadge status={wf.status as any} size="sm" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {wf.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{wf.desc}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-gray-500">{wf.agents} agentes</span>
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
