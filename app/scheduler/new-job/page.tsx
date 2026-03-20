"use client";

import { motion } from "framer-motion";
import { Plus, Ban } from "lucide-react";
import Link from "next/link";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

/** Backend no expone POST para crear jobs. Pagina informativa solamente. */
export default function SchedulerNewJobPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/scheduler">
        <StatusBadge status="inactive" label="No disponible" size="lg" />
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-500/20 border border-gray-500/30">
            <Ban className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Nuevo job</h1>
            <p className="text-gray-400">No soportado por la API actual</p>
          </div>
        </div>
      </motion.div>
      <GlassCard className="p-6 max-w-2xl border-white/10">
        <div className="flex items-start gap-3 text-gray-300 text-sm">
          <Plus className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-white mb-2">Creacion de jobs deshabilitada</p>
            <p className="text-gray-400 leading-relaxed">
              El backend solo expone{" "}
              <span className="font-mono text-xs">GET /api/v1/scheduler/status</span> para consulta. No hay
              endpoints para alta, edicion o borrado de jobs desde el dashboard.
            </p>
            <p className="mt-4">
              <Link href="/scheduler" className="text-orange-400 hover:underline">
                Volver al estado operativo del scheduler
              </Link>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
