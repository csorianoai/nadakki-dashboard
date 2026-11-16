"use client";
import { motion } from "@/lib/motion-stub";
import Link from "next/link";
import { Mail, FileText, Send, Users, ArrowRight, Zap } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const EMAIL_MODULES = [
  { id: "campaigns", name: "Campanas", icon: Send, desc: "Gestiona tus campanas de email", href: "/email/campaigns", color: "#22c55e" },
  { id: "templates", name: "Templates", icon: FileText, desc: "Plantillas de email", href: "/email/templates", color: "#8b5cf6" },
  { id: "automation", name: "Automatizacion", icon: Zap, desc: "Secuencias automaticas", href: "/automations", color: "#f59e0b" },
  { id: "lists", name: "Listas", icon: Users, desc: "Gestiona tus contactos", href: "/audiences/manager", color: "#3b82f6" },
];

export default function EmailPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Email Marketing" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <Mail className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Email Marketing</h1>
            <p className="text-gray-400 mt-1">Campanas, automatizaciones y analytics de email</p>
          </div>
        </div>
      </motion.div>

      <h2 className="text-xl font-bold text-white mb-4">Modulos</h2>
      <div className="grid grid-cols-2 gap-6">
        {EMAIL_MODULES?.map((module, i) => (
          <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
            <Link href={module.href}>
              <GlassCard className="p-6 cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                    <module.icon className="w-6 h-6" style={{ color: module.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">{module.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{module.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

