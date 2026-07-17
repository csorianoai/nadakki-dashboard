"use client";

import { Building2, MessageCircle, ShieldCheck } from "lucide-react";
import { useTenant } from "@/components/system/TenantProvider";
import { DualSearch } from "@/components/marketing/DualSearch";

const DIFF_PILLS = [
  {
    icon: Building2,
    label: "Financiamiento pre-aprobado en 24h",
  },
  {
    icon: ShieldCheck,
    label: "Verificación AI de importados",
  },
  {
    icon: MessageCircle,
    label: "Concierge WhatsApp 24/7 (próximamente)",
  },
] as const;

export function Hero() {
  const { config } = useTenant();

  return (
    <section
      id="hero"
      className="relative overflow-hidden px-[22px] pb-10 pt-8 md:pb-14 md:pt-12"
      style={{
        background:
          "radial-gradient(120% 120% at 85% -10%, var(--brand-soft), transparent 55%)",
      }}
    >
      <div className="mx-auto max-w-[1440px]">
        <span className="inline-flex rounded-full border border-nk-border bg-nk-surface px-3 py-1 text-xs font-semibold text-nk-fg-muted">
          Aprobación bancaria integrada · {config.sub}
        </span>

        <h1 className="mt-5 max-w-[920px] font-manrope text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-nk-fg md:text-[clamp(34px,5.4vw,60px)]">
          El vehículo perfecto para ti,{" "}
          <span className="bg-gradient-to-br from-brand to-brand-2 bg-clip-text text-transparent">
            financiado en tu banco
          </span>
        </h1>

        <div className="mt-5 flex flex-wrap gap-3">
          {DIFF_PILLS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-nk-border bg-nk-surface px-4 py-2.5 font-manrope text-sm font-medium text-nk-fg"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              {label}
            </span>
          ))}
        </div>

        <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-nk-fg-muted md:text-base">
          Marketplace inteligente con aprobación bancaria integrada, AI Concierge y precios verificados
          en República Dominicana.
        </p>

        <DualSearch />
      </div>
    </section>
  );
}
