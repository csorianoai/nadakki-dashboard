"use client";

import { motion } from "@/lib/motion-stub";
import { Compass } from "lucide-react";
import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { ProyectoIntakeWizard } from "@/components/proyectos/ProyectoIntakeWizard";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";

export default function NuevoProyectoPage() {
  return (
    <ProyectosTenantGate>
      <div className="mx-auto max-w-4xl pb-16">
        <NavigationBar backHref="/proyectos" />
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <GlassCard
            hover={false}
            className="relative border border-amber-400/25 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-6 shadow-[0_0_48px_-12px_rgba(245,158,11,0.28)]"
          >
            <div
              className="pointer-events-none absolute right-[-10%] top-[-50%] h-48 w-48 rounded-full opacity-40 blur-[72px]"
              style={{ background: `radial-gradient(circle at 30% 30%, ${BP_ACCENTS.primary}, transparent 65%)` }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Compass className="h-6 w-6 text-amber-300/90" aria-hidden />
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.85rem]">
                    Nuevo proyecto
                  </h1>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
                  Wizard de alta conectado a{" "}
                  <span className="font-forgeMono text-[11px] text-amber-200/95">POST /api/v1/proyectos</span>. La solicitud lleva tenant vía cabecera{" "}
                  <span className="font-forgeMono text-[11px] text-amber-200/95">X-Tenant-ID</span>. Diseñado como plantilla viva hasta alinear campo a campo el contrato YAML.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <ProyectoIntakeWizard />
        </motion.div>
      </div>
    </ProyectosTenantGate>
  );
}
