"use client";
import { FileText } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";


// Sin llamada al backend para estos datos: estado vacio honesto, sin cifras de ejemplo.
export default function EmailTemplatesPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/email" />
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><FileText className="w-8 h-8 text-purple-400" /></div>
        <div><h1 className="text-3xl font-bold text-white">Templates</h1><p className="text-gray-400">Plantillas de email</p></div>
      </div>
      <GlassCard className="p-8 text-center" hover={false}>
        <p className="text-white font-medium" data-testid="estado-vacio">Aun no hay datos de plantillas en tu cuenta</p>
        <p className="text-sm text-gray-400 mt-2">Cuando existan, los veras aqui.</p>
      </GlassCard>
    </div>
  );
}
