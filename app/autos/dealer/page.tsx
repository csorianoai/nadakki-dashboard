"use client";

import Link from "next/link";
import { Sparkles, Upload, Users, BarChart3 } from "lucide-react";
import {
  CORE_NAV_CAPABILITY_KEYS,
  CoreNavigation,
  DEALER_QUICK_LINK_CAPABILITIES,
  isAccessQueryFailClosed,
} from "@/components/dealer/CoreNavigation";
import { UsageMeter } from "@/components/dealer/UsageMeter";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { useAuth } from "@/lib/auth-context";

const QUICK_LINK_CARDS = [
  {
    href: "/autos/dealer/publicar-rapido" as const,
    icon: <Upload className="h-6 w-6" />,
    title: "Publica en 90 segundos",
    desc: "Sube 5 fotos — Nadakki AI genera listing completo con precio y descripción.",
    badge: "NUEVO",
    gradient: true,
  },
  {
    href: "/autos/dealer/leads" as const,
    icon: <Users className="h-6 w-6" />,
    title: "Leads Prioritarios",
    desc: "12 leads hot clasificados por probabilidad de conversión.",
    stat: "🔥 12 hot",
  },
  {
    href: "/autos/dealer/insights" as const,
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Insights AI",
    desc: "Recomendaciones accionables en español dominicano.",
    stat: "3 sin revisar",
  },
];

export default function DealerDashboardPage() {
  const auth = useAuth();
  const query = useAccessEntitlementsBatch(CORE_NAV_CAPABILITY_KEYS);
  const failClosed = isAccessQueryFailClosed(query);

  return (
    <main className="space-y-8">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Dealer Hub</h1>
        <p className="mt-1 text-nk-fg-muted">
          Gestiona inventario, marketing y cores según tu plan
          {auth.isAuthenticated ? (
            <span className="ml-2 text-xs text-nk-fg-muted">· {auth.role}</span>
          ) : (
            <span className="ml-2 text-xs text-yellow-700">· Inicia sesión para capacidades completas</span>
          )}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="font-manrope text-lg font-bold text-nk-fg">Capacidades por core</h2>
          <CoreNavigation />
        </section>

        <aside className="rounded-r-sm border border-nk-border bg-nk-surface p-6">
          <h2 className="font-manrope text-lg font-bold text-nk-fg">Uso este mes</h2>
          <div className="mt-4">
            <UsageMeter />
          </div>
        </aside>
      </div>

      <section data-testid="dealer-quick-links" data-fail-closed={failClosed ? "true" : "false"}>
        <h2 className="mb-4 font-manrope text-lg font-bold text-nk-fg">Accesos rápidos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {QUICK_LINK_CARDS.map((card) => {
            const capabilityId = DEALER_QUICK_LINK_CAPABILITIES[card.href];
            const allowed =
              !failClosed && query.data?.results[capabilityId]?.allowed === true;
            if (!allowed) return null;
            return (
              <HighlightCard
                key={card.href}
                href={card.href}
                icon={card.icon}
                title={card.title}
                desc={card.desc}
                badge={"badge" in card ? card.badge : undefined}
                stat={"stat" in card ? card.stat : undefined}
                gradient={"gradient" in card ? card.gradient : false}
              />
            );
          })}
          <div className="rounded-r-sm border border-nk-border bg-nk-surface p-6">
            <Sparkles className="h-6 w-6 text-brand-2" />
            <p className="mt-3 font-manrope text-lg font-bold text-nk-fg">Core access Phase 1</p>
            <p className="mt-1 text-sm text-nk-fg-muted">
              Navegación dinámica según entitlements del backend. Fallback DEFAULT_DENY si API no responde.
            </p>
            <DemoModeBadge visible={!auth.isAuthenticated} />
          </div>
        </div>
      </section>
    </main>
  );
}

function HighlightCard({
  href,
  icon,
  title,
  desc,
  badge,
  stat,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
  stat?: string;
  gradient?: boolean;
}) {
  return (
    <Link
      href={href}
      data-testid="privileged-quick-link"
      data-allowed="true"
      className={
        gradient
          ? "block rounded-r-sm border border-brand-2/30 bg-gradient-to-br from-brand-2/10 to-transparent p-6 transition hover:shadow-nk-md"
          : "block rounded-r-sm border border-nk-border bg-nk-surface p-6 transition hover:border-brand-2/30 hover:shadow-nk-sm"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-brand-2">{icon}</span>
        {badge ? (
          <span className="rounded-full bg-brand-2 px-2 py-0.5 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
        {stat ? <span className="text-xs font-bold text-nk-fg-muted">{stat}</span> : null}
      </div>
      <h2 className="mt-3 font-manrope text-lg font-bold text-nk-fg">{title}</h2>
      <p className="mt-1 text-sm text-nk-fg-muted">{desc}</p>
    </Link>
  );
}
