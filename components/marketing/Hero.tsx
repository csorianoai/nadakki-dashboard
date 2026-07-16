"use client";

import { useTenant } from "@/components/system/TenantProvider";
import { DualSearch } from "@/components/marketing/DualSearch";

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

        <h1 className="mt-5 max-w-[920px] font-manrope text-[clamp(34px,5.4vw,60px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-nk-fg">
          El vehículo perfecto para ti,{" "}
          <span className="bg-gradient-to-br from-brand to-brand-2 bg-clip-text text-transparent">
            financiado en tu banco
          </span>
        </h1>

        <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-nk-fg-muted md:text-base">
          Marketplace inteligente con aprobación bancaria integrada, AI Concierge y precios verificados
          en República Dominicana.
        </p>

        <DualSearch />
      </div>
    </section>
  );
}
