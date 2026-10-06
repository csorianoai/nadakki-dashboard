"use client";

import Link from "next/link";
import { BarChart3, Cable, Car, FileText, Gauge, Landmark, Megaphone, PackagePlus, ReceiptText, Search, Users, WalletCards, type LucideIcon } from "lucide-react";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { DEALER_TOKENS } from "@/lib/dealer-management/tokens";

type ModuleItem = { id: string; label: string; description: string; href: string; capability: string; icon: LucideIcon };

const SECTIONS: Array<{ title: string; items: ModuleItem[] }> = [
  { title: "Operación", items: [
    { id: "inventory", label: "Inventario", description: "Vehículos del dealer y su ciclo de vida.", href: "/autos/dealer/inventario", capability: "autos.inventory.list", icon: Car },
    { id: "publish", label: "Publicar vehículo", description: "Entrada de publicación existente del dealer.", href: "/autos/dealer/publicar-rapido", capability: "autos.inventory.create", icon: PackagePlus },
    { id: "leads", label: "Leads", description: "Seguimiento de oportunidades comerciales.", href: "/autos/dealer/leads", capability: "autos.leads.crm", icon: Users },
    { id: "insights", label: "Insights", description: "Señales operativas disponibles para el dealer.", href: "/autos/dealer/insights", capability: "autos.analytics.basic", icon: BarChart3 },
  ]},
  { title: "Financiamiento", items: [
    { id: "dealer-bank", label: "Dealer-Bank", description: "Solicitudes y ofertas según acceso real.", href: "/credit-hub/dealer", capability: "credit.applications.submit", icon: Landmark },
    { id: "applications", label: "Solicitudes", description: "Superficie existente de financiamiento Autos.", href: "/autos/vehiculos", capability: "autos.financing.applications", icon: FileText },
    { id: "offers", label: "Ofertas", description: "Marketplace y ofertas disponibles por contrato.", href: "/autos/dashboard/mis-leads", capability: "autos.search.marketplace", icon: Search },
  ]},
  { title: "Crecimiento", items: [
    { id: "marketing", label: "Marketing", description: "Abre el Marketing Core existente.", href: "/marketing/campaigns", capability: "marketing.email.campaigns", icon: Megaphone },
  ]},
  { title: "Administración", items: [
    { id: "accounting", label: "Contabilidad", description: "Abre el Core Contable existente.", href: "/contable", capability: "accounting.invoices.view", icon: ReceiptText },
    { id: "legal", label: "Legal", description: "Contratos y servicios jurídicos disponibles.", href: "/legal/contracts", capability: "legal.contracts.templates", icon: WalletCards },
  ]},
  { title: "Sistema", items: [
    { id: "connections", label: "Conexiones", description: "Integraciones y patrocinio reportados.", href: "/autos/dealer/conexiones", capability: "autos.api.access", icon: Cable },
    { id: "status", label: "Estado", description: "Readiness real de los cores del dealer.", href: "/autos/dealer/estado", capability: "autos.api.access", icon: Gauge },
  ]},
];

export const DEALER_MANAGEMENT_CAPABILITIES = Array.from(new Set(SECTIONS.flatMap((section) => section.items.map((item) => item.capability))));

function badgeClass(state: "allowed" | "locked" | "not_ready") {
  if (state === "allowed") return DEALER_TOKENS.badgeAllowed;
  if (state === "not_ready") return DEALER_TOKENS.badgeNotReady;
  return DEALER_TOKENS.badgeLocked;
}

export function DealerModuleGrid() {
  const query = useAccessEntitlementsBatch(DEALER_MANAGEMENT_CAPABILITIES);
  const branding = useDealerManagementBranding();
  const isArgentina = branding.data?.currency === "ARS" || branding.data?.locale?.toLowerCase().endsWith("-ar") === true;

  return (
    <section className="space-y-4" aria-labelledby="dealer-control-title">
      <div>
        <h2 id="dealer-control-title" className="font-manrope text-lg font-extrabold text-nk-fg">Centro de Control</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">Acá ves a qué módulos de tu concesionaria tenés acceso. Si alguno figura bloqueado, pedile a quien administra tu cuenta que te lo habilite.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className={DEALER_TOKENS.panel}>
            <div className="border-b border-nk-border px-5 py-4"><h3 className={DEALER_TOKENS.sectionTitle}>{section.title}</h3></div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {section.items.map((item) => {
                const decision = query.data?.results[item.capability];
                const forcedArLegal = item.id === "legal" && isArgentina;
                const state = forcedArLegal || decision?.reason_code === "TARGET_CORE_NOT_READY" ? "not_ready" : !query.isLoading && !query.error && decision?.allowed === true ? "allowed" : "locked";
                const statusText = forcedArLegal ? "Sin paquete jurídico Argentina" : state === "allowed" ? "Disponible" : state === "not_ready" ? "No listo" : query.isLoading ? "Verificando" : "Bloqueado";
                const Icon = item.icon;
                const body = <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-2/10 text-brand-2"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${badgeClass(state)}`}>{statusText}</span>
                  </div>
                  <p className="mt-3 font-manrope text-sm font-bold text-nk-fg">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-nk-fg-muted">{forcedArLegal ? "Las acciones legales quedan restringidas hasta disponer del paquete AR." : item.description}</p>
                </>;

                return state === "allowed" ? (
                  <Link key={item.id} href={item.href} data-testid={`dealer-module-${item.id}`} data-allowed="true" className={`${DEALER_TOKENS.card} ${DEALER_TOKENS.cardAllowed}`}>{body}</Link>
                ) : (
                  <div key={item.id} data-testid={`dealer-module-${item.id}`} data-allowed="false" data-reason-code={forcedArLegal ? "COUNTRY_PACK_AR_GAP" : decision?.reason_code ?? "DEFAULT_DENY"} className={`${DEALER_TOKENS.card} cursor-not-allowed opacity-80`} aria-disabled="true">{body}</div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
