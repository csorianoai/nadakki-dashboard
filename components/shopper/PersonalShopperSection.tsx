"use client";

import { Bell, Search, Sparkles, Target } from "lucide-react";
import { useShopper } from "@/components/shopper/ShopperProvider";
import { PersonalShopperOnboarding } from "@/components/shopper/PersonalShopperOnboarding";

export function PersonalShopperSection() {
  const { openOnboarding, onboardingOpen, closeOnboarding, profile } = useShopper();

  return (
    <section className="border-y border-nk-border bg-gradient-to-br from-brand/5 via-transparent to-brand-2/5 py-14">
      <div className="mx-auto max-w-[1440px] px-[clamp(16px,3vw,22px)]">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            AI Personal Shopper
          </span>
          <h2 className="mt-4 font-manrope text-2xl font-extrabold text-nk-fg md:text-3xl">
            Activa tu AI Personal Shopper
          </h2>
          <p className="mt-2 text-nk-fg-muted">
            Dinos qué buscas una sola vez. Nadakki AI trabaja 24/7 y te avisa cuando aparece el
            match perfecto.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          <Benefit icon={<Search className="h-5 w-5" />} title="Buscamos por ti 24/7" />
          <Benefit icon={<Bell className="h-5 w-5" />} title="Notificamos en WhatsApp" />
          <Benefit icon={<Target className="h-5 w-5" />} title="Match Score personalizado" />
        </ul>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={openOnboarding}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-8 py-3 text-sm font-bold text-white shadow-nk-sm transition hover:brightness-105"
          >
            <Sparkles className="h-4 w-4" />
            {profile ? "Actualizar mi shopper" : "Activar gratis"}
          </button>
        </div>
      </div>

      <PersonalShopperOnboarding open={onboardingOpen} onClose={closeOnboarding} />
    </section>
  );
}

function Benefit({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <li className="flex flex-col items-center rounded-r-sm border border-nk-border bg-nk-surface p-5 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        {icon}
      </span>
      <span className="text-sm font-semibold text-nk-fg">{title}</span>
    </li>
  );
}
