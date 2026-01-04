"use client";
import { motion } from "framer-motion";
import { Bell, Check, Trash2, Settings } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const NOTIFICATIONS = [
  { id: 1, title: "Campana completada", desc: "Black Friday 2024 finalizo con exito", time: "Hace 2 horas", read: false },
  { id: 2, title: "Nuevo lead caliente", desc: "Carlos Garcia - Score 95", time: "Hace 5 horas", read: false },
  { id: 3, title: "Reporte generado", desc: "Reporte mensual Diciembre disponible", time: "Ayer", read: true },
  { id: 4, title: "Alerta de engagement", desc: "Post viral en Instagram +500%", time: "Hace 2 dias", read: true },
];

export default function NotificationsPage() {
  const unread = NOTIFICATIONS.filter(n => !n.read).length;
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status={unread > 0 ? "warning" : "active"} label={unread + " sin leer"} size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30"><Bell className="w-8 h-8 text-yellow-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Notificaciones</h1><p className="text-gray-400">{NOTIFICATIONS.length} notificaciones</p></div>
        </div>
      </motion.div>
      <div className="space-y-3">
        {NOTIFICATIONS.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className={`p-4 ${!n.read ? "border-l-2 border-l-yellow-500" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-bold text-white">{n.title}</h3>{!n.read && <div className="w-2 h-2 rounded-full bg-yellow-500" />}</div>
                  <p className="text-sm text-gray-400 mt-1">{n.desc}</p>
                  <p className="text-xs text-gray-500 mt-2">{n.time}</p>
                </div>
                <div className="flex gap-1">
                  {!n.read && <button className="p-2 hover:bg-green-500/20 rounded-lg"><Check className="w-4 h-4 text-gray-400" /></button>}
                  <button className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
