"use client";
import { BarChart3 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";

// Sin llamada al backend para estos datos: estado vacio honesto, sin cifras de ejemplo.
export default function SocialAnalyticsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social" />
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30"><BarChart3 className="w-8 h-8 text-yellow-400" /></div>
        <div><h1 className="text-3xl font-bold text-white">Social Analytics</h1><p className="text-gray-400">Metricas de rendimiento en redes sociales</p></div>
      </div>
      <GlassCard className="p-8 text-center" hover={false}>
        <p className="text-white font-medium" data-testid="estado-vacio">Aun no hay datos de analiticas sociales en tu cuenta</p>
        <p className="text-sm text-gray-400 mt-2">Cuando existan, los veras aqui.</p>
      </GlassCard>
    </div>
  );
}
