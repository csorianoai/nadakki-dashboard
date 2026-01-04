"use client";
import { motion } from "framer-motion";
import { Settings, Instagram, Twitter, Linkedin, Facebook, Plus, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CONNECTIONS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E1306C", connected: true, account: "@credicefi", followers: "12.5K" },
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "#1DA1F2", connected: true, account: "@credicefi", followers: "8.2K" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", connected: true, account: "CrediCefi", followers: "5.1K" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", connected: false, account: null, followers: null },
];

export default function SocialConnectionsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social">
        <StatusBadge status="active" label="3 conectadas" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Settings className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conexiones</h1>
            <p className="text-gray-400">Gestiona tus cuentas de redes sociales</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        {CONNECTIONS.map((conn, i) => (
          <motion.div key={conn.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: conn.color + "20" }}>
                    <conn.icon className="w-6 h-6" style={{ color: conn.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{conn.name}</h3>
                    {conn.connected && <p className="text-sm text-gray-400">{conn.account}</p>}
                  </div>
                </div>
                {conn.connected ? <CheckCircle className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-gray-500" />}
              </div>
              
              {conn.connected ? (
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-sm text-gray-400">{conn.followers} seguidores</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Reconectar
                    </button>
                    <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400">Desconectar</button>
                  </div>
                </div>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Conectar cuenta
                </motion.button>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
