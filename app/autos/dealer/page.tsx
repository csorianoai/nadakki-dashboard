"use client";

import Link from "next/link";
import { Sparkles, Upload, Users, BarChart3 } from "lucide-react";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";

export default function DealerDashboardPage() {
  return (
    <main>
      <header className="mb-8">
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Dealer Dashboard</h1>
        <p className="mt-1 text-nk-fg-muted">Herramientas AI para vender más rápido</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <HighlightCard
          href="/autos/dealer/publicar-rapido"
          icon={<Upload className="h-6 w-6" />}
          title="Publica en 90 segundos"
          desc="Sube 5 fotos — Nadakki AI genera listing completo con precio y descripción."
          badge="NUEVO"
          gradient
        />
        <HighlightCard
          href="/autos/dealer/leads"
          icon={<Users className="h-6 w-6" />}
          title="Leads Prioritarios"
          desc="12 leads hot clasificados por probabilidad de conversión."
          stat="🔥 12 hot"
        />
        <HighlightCard
          href="/autos/dealer/insights"
          icon={<BarChart3 className="h-6 w-6" />}
          title="Insights AI"
          desc="Recomendaciones accionables en español dominicano."
          stat="3 sin revisar"
        />
        <div className="rounded-r-sm border border-nk-border bg-nk-surface p-6">
          <Sparkles className="h-6 w-6 text-brand-2" />
          <p className="mt-3 font-manrope text-lg font-bold text-nk-fg">Modo demo activo</p>
          <p className="mt-1 text-sm text-nk-fg-muted">
            Backend Fase 8 en construcción. Datos de muestra realistas.
          </p>
          <DemoModeBadge visible />
        </div>
      </div>
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
