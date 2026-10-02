"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Compass, Upload, Users } from "lucide-react";
import { CORE_NAV_CAPABILITY_KEYS, isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { PrimerosPasosInicio } from "@/components/dealer/PrimerosPasosInicio";
import { DealerPostSaleCores } from "@/components/dealer/DealerPostSaleCores";
import { DealerSponsorshipBanner } from "@/components/dealer/DealerSponsorshipBanner";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import { DealerModuleGrid } from "@/components/dealer-management/DealerModuleGrid";
import { DealerOperationsHeader } from "@/components/dealer-management/DealerOperationsHeader";
import { UsageMeter } from "@/components/dealer/UsageMeter";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { DEALER_TOKENS } from "@/lib/dealer-management/tokens";

/**
 * `capability: null` = siempre visible, no depende del plan. Mismo criterio que
 * el menu (`dealer-nav.ts`): el Centro Operativo es la guia de carga y
 * operacion, no publica ningun dato del tenant y es lo que necesita un dealer
 * que todavia no tiene plan ni stock.
 */
const QUICK_LINK_CARDS: {
  href: string;
  capability: string | null;
  icon: typeof Upload;
  title: string;
  desc: string;
}[] = [
  { href: "/autos/dealer/publicar-rapido", capability: "autos.inventory.create", icon: Upload, title: "Publicar vehículo", desc: "Abre el flujo de publicación existente." },
  { href: "/autos/dealer/leads", capability: "autos.leads.crm", icon: Users, title: "Leads", desc: "Gestiona los leads disponibles para este dealer." },
  { href: "/autos/dealer/insights", capability: "autos.analytics.basic", icon: BarChart3, title: "Insights", desc: "Consulta señales operativas disponibles." },
  { href: "/centro-operativo", capability: null, icon: Compass, title: "Centro Operativo", desc: "La guía de carga y operación: cómo cargar el stock y qué asiento genera cada paso." },
];
const PAGE_CAPABILITIES = Array.from(
  new Set([
    ...CORE_NAV_CAPABILITY_KEYS,
    ...QUICK_LINK_CARDS.map((card) => card.capability).filter((key): key is string => key !== null),
  ]),
);

export default function DealerDashboardPage() {
  const query = useAccessEntitlementsBatch(PAGE_CAPABILITIES);
  const failClosed = isAccessQueryFailClosed(query);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const hasUpgradeRequired = Object.values(query.data?.results ?? {}).some(
    (decision) => decision.allowed === false && decision.reason_code === "UPGRADE_REQUIRED",
  );

  return (
    <main className={DEALER_TOKENS.shell}>
      <DealerOperationsHeader />
      {/*
        Arriba y antes que nada: un dealer con el inventario vacio no tiene nada
        que hacer en el resto de la pantalla hasta cargar su stock. Se pinta solo
        cuando el inventario esta vacio DE VERDAD; el propio componente decide.
      */}
      <PrimerosPasosInicio />
      {hasUpgradeRequired ? (
        <div className="flex justify-end">
          <button
            type="button"
            data-testid="dealer-upgrade-cta"
            onClick={() => setUpgradeOpen(true)}
            className="rounded-full border border-brand-2/40 bg-brand-2/10 px-4 py-2 text-sm font-semibold text-nk-fg hover:bg-brand-2/20"
          >
            Mejora tu plan
          </button>
        </div>
      ) : null}
      {upgradeOpen && hasUpgradeRequired ? (
        <UpgradeModal
          decision={{ allowed: false, reason_code: "UPGRADE_REQUIRED" }}
          onClose={() => setUpgradeOpen(false)}
        />
      ) : null}
      <DealerSponsorshipBanner />
      <DealerModuleGrid />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><DealerPostSaleCores /></div>
        <aside className={`${DEALER_TOKENS.panel} p-5`}><h2 className="font-manrope text-base font-bold text-nk-fg">Uso del plan</h2><div className="mt-4"><UsageMeter /></div></aside>
      </div>
      <section data-testid="dealer-quick-links" data-fail-closed={failClosed ? "true" : "false"}>
        <h2 className="mb-3 font-manrope text-base font-bold text-nk-fg">Accesos rápidos</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {QUICK_LINK_CARDS.map((card) => {
            // `capability: null` no pasa por el batch: no hay nada que permitir.
            const allowed =
              card.capability === null
                ? true
                : !failClosed && query.data?.results[card.capability]?.allowed === true;
            if (!allowed) return null;
            const Icon = card.icon;
            // Solo las tarjetas con `capability` son "privileged": ese testid es
            // el que verifica que con fail-closed NO se pinta ninguna. Una
            // tarjeta incondicional con esa marca convertiria esa garantia en
            // una mentira, asi que lleva la suya.
            const testid = card.capability === null ? "open-quick-link" : "privileged-quick-link";
            return <Link key={card.href} href={card.href} data-testid={testid} data-capability={card.capability ?? undefined} data-allowed="true" className={`${DEALER_TOKENS.card} ${DEALER_TOKENS.cardAllowed}`}>
              <Icon className="h-5 w-5 text-brand-2" aria-hidden="true" /><p className="mt-3 font-manrope text-sm font-bold text-nk-fg">{card.title}</p><p className="mt-1 text-xs text-nk-fg-muted">{card.desc}</p>
            </Link>;
          })}
        </div>
      </section>
    </main>
  );
}
