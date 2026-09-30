"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Upload, Users } from "lucide-react";
import { CORE_NAV_CAPABILITY_KEYS, isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { DealerSponsorshipBanner } from "@/components/dealer/DealerSponsorshipBanner";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import { DealerModuleGrid } from "@/components/dealer-management/DealerModuleGrid";
import { DealerOperationsHeader } from "@/components/dealer-management/DealerOperationsHeader";
import { UsageMeter } from "@/components/dealer/UsageMeter";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { DEALER_TOKENS } from "@/lib/dealer-management/tokens";

const QUICK_LINK_CARDS = [
  { href: "/autos/dealer/publicar-rapido" as const, capability: "autos.inventory.create", icon: Upload, title: "Publicar vehículo", desc: "Abre el flujo de publicación existente." },
  { href: "/autos/dealer/leads" as const, capability: "autos.leads.crm", icon: Users, title: "Leads", desc: "Gestiona los leads disponibles para este dealer." },
  { href: "/autos/dealer/insights" as const, capability: "autos.analytics.basic", icon: BarChart3, title: "Insights", desc: "Consulta señales operativas disponibles." },
];
const PAGE_CAPABILITIES = Array.from(new Set([...CORE_NAV_CAPABILITY_KEYS, ...QUICK_LINK_CARDS.map((card) => card.capability)]));

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
      {/* DealerPostSaleCores fuera del panel: disparaba GET /api/v1/legal/cases
          (403) y GET /api/marketing/scheduler/heartbeat (404) en cada carga de
          Inicio, y pintaba el reason_code crudo. Ni Legal ni el scheduler de
          Marketing son superficies del dealer. El componente sigue existiendo
          para quien lo necesite; aqui no se monta. */}
      <aside className={`${DEALER_TOKENS.panel} p-5`}>
        <h2 className="font-manrope text-base font-bold text-nk-fg">Uso del plan</h2>
        <div className="mt-4"><UsageMeter /></div>
      </aside>
      <section data-testid="dealer-quick-links" data-fail-closed={failClosed ? "true" : "false"}>
        <h2 className="mb-3 font-manrope text-base font-bold text-nk-fg">Accesos rápidos</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {QUICK_LINK_CARDS.map((card) => {
            const allowed = !failClosed && query.data?.results[card.capability]?.allowed === true;
            if (!allowed) return null;
            const Icon = card.icon;
            return <Link key={card.href} href={card.href} data-testid="privileged-quick-link" data-capability={card.capability} data-allowed="true" className={`${DEALER_TOKENS.card} ${DEALER_TOKENS.cardAllowed}`}>
              <Icon className="h-5 w-5 text-brand-2" aria-hidden="true" /><p className="mt-3 font-manrope text-sm font-bold text-nk-fg">{card.title}</p><p className="mt-1 text-xs text-nk-fg-muted">{card.desc}</p>
            </Link>;
          })}
        </div>
      </section>
    </main>
  );
}
