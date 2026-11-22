"use client";
import { Users } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";


// Sin llamada al backend para estos datos: estado vacio honesto, sin cifras de ejemplo.
export default function AudiencesManagerPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/audiences" />
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Users className="w-8 h-8 text-purple-400" /></div>
        <div><h1 className="text-3xl font-bold text-white">Gestor de Audiencias</h1><p className="text-gray-400">Segmentos de tu cuenta</p></div>
      </div>
      <GlassCard className="p-8 text-center" hover={false}>
        <p className="text-white font-medium" data-testid="estado-vacio">Aun no hay datos de segmentos en tu cuenta</p>
        <p className="text-sm text-gray-400 mt-2">Cuando existan, los veras aqui.</p>
      </GlassCard>
    </div>
  );
}
