"use client";

import Link from "next/link";
import { Briefcase, Building2, Shield, User } from "lucide-react";
import { ForgeLogo } from "@/components/credit-hub/brand/ForgeLogo";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";

const portals = [
  {
    href: "/credit-hub/dealer",
    icon: Briefcase,
    title: "Dealer Portal",
    description: "Crear y gestionar solicitudes de crédito",
    available: true,
  },
  {
    href: "#",
    icon: Building2,
    title: "Bank Portal",
    description: "Evaluar y decidir sobre solicitudes",
    available: false,
  },
  {
    href: "#",
    icon: User,
    title: "Customer Portal",
    description: "Ver mis solicitudes y ofertas",
    available: false,
  },
  {
    href: "#",
    icon: Shield,
    title: "Admin",
    description: "Configuración del sistema",
    available: false,
  },
];

export default function CreditHubHome() {
  return (
    <div data-portal="dealer" className="flex min-h-screen items-center justify-center bg-forge-bg p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <ForgeLogo size="xl" animated className="mx-auto mb-6" />
          <h1 className="mb-3 font-display text-4xl font-bold text-forge-text md:text-5xl">Nadakki Forge</h1>
          <p className="text-lg text-forge-text-muted">Where credit decisions are forged</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {portals.map((portal) => {
            const Icon = portal.icon;
            const cardContent = (
              <ForgeCard variant={portal.available ? "interactive" : "default"} className={!portal.available ? "opacity-50" : ""}>
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-forge-primary to-forge-accent p-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-forge-text">{portal.title}</h2>
                    <p className="mt-1 text-sm text-forge-text-muted">{portal.description}</p>
                    {!portal.available && <span className="mt-2 inline-block text-xs text-forge-warning">Próximamente</span>}
                  </div>
                </div>
              </ForgeCard>
            );

            return portal.available ? (
              <Link key={portal.href} href={portal.href}>
                {cardContent}
              </Link>
            ) : (
              <div key={portal.title}>{cardContent}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
