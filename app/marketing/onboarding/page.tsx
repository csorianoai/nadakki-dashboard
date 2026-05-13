"use client";

import Link from "next/link";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { OnboardingWizard } from "@/components/marketing/onboarding/OnboardingWizard";
import { TenantProfileActivationPanel } from "@/components/marketing/onboarding/TenantProfileActivationPanel";

export default function MarketingOnboardingWizardPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Onboarding del Marketing Core</h1>
        <p className="text-gray-400 mt-1 max-w-3xl">
          Guía interactiva en español para instituciones financieras y operadores en LatAm. El contenido extendido
          vive en <code className="text-pink-300 text-sm">MARKETING_USER_GUIDE.md</code> en la raíz del repositorio
          (audit Cowork).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/marketing/overview"
            className="text-xs font-semibold text-pink-400 hover:text-pink-300 underline underline-offset-2"
          >
            Ir al overview
          </Link>
          <span className="text-gray-600">·</span>
          <Link
            href="/marketing/social-connections"
            className="text-xs font-semibold text-pink-400 hover:text-pink-300 underline underline-offset-2"
          >
            Conexiones sociales
          </Link>
        </div>
      </div>

      <OnboardingWizard />

      <details className="mt-10 group">
        <summary className="cursor-pointer list-none flex items-center gap-2 text-pink-200 font-semibold">
          <span className="group-open:rotate-90 transition-transform text-pink-400">▸</span>
          Asistente de perfil de tenant (API <code className="text-xs text-gray-400">build-profile</code>)
        </summary>
        <div className="mt-4 border-t border-white/10 pt-6">
          <GlassCard className="p-4 mb-4 border border-violet-500/20 bg-violet-500/5">
            <p className="text-sm text-violet-100 m-0">
              Usa este bloque cuando necesites materializar identidad, catálogo y audiencia en la suite. Es distinto del
              recorrido guiado anterior, pero suele ejecutarse en el mismo sprint de onboarding.
            </p>
          </GlassCard>
          <TenantProfileActivationPanel />
        </div>
      </details>
    </div>
  );
}
