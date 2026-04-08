"use client";

import { useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { BillingApiError, createCheckout } from "@/lib/api/billing";

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Equipos que empiezan con automatización e IA.",
    price: "$999",
    featured: false,
    features: [
      "Ejecuciones mensuales según catálogo",
      "Soporte estándar",
      "Integraciones core",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    blurb: "Escala operación y reporting avanzado.",
    price: "$2,999",
    featured: true,
    features: [
      "Límites mayores y más agentes",
      "Analytics y exportaciones",
      "Soporte prioritario",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "SSO, cumplimiento dedicado y SLA.",
    price: "Personalizado",
    featured: false,
    features: [
      "Contrato y facturación a medida",
      "Ambientes y tenants dedicados",
      "Customer success asignado",
    ],
  },
];

export interface PricingTableProps {
  tenantId: string | null;
}

export default function PricingTable({ tenantId }: PricingTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectPlan(planId: string) {
    const tid = tenantId?.trim() ?? "";
    if (!tid) {
      setError("Selecciona un tenant para continuar al pago.");
      return;
    }
    setError(null);
    setBusyId(planId);
    try {
      const { url } = await createCheckout(planId, tid);
      window.location.href = url;
    } catch (e) {
      const msg =
        e instanceof BillingApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo iniciar Stripe Checkout.";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white m-0">Planes</h2>
        <p className="text-gray-400 text-sm mt-1 mb-0">
          Elige un plan; serás redirigido a Stripe Checkout. Tras el pago, el
          webhook actualiza el plan del tenant.
        </p>
      </div>

      {error ? (
        <GlassCard className="p-4 border-red-500/25 bg-red-500/10">
          <p className="text-red-200 text-sm m-0 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => {
          const busy = busyId === tier.id;
          return (
            <GlassCard
              key={tier.id}
              className={`p-6 flex flex-col h-full relative ${
                tier.featured
                  ? "ring-2 ring-cyan-500/60 border-cyan-500/40"
                  : "border-white/10"
              }`}
              hover
            >
              {tier.featured ? (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500 text-white">
                  Popular
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-white m-0">{tier.name}</h3>
              <p className="text-gray-400 text-sm mt-2 mb-4 flex-1">{tier.blurb}</p>
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">{tier.price}</span>
                {tier.price !== "Personalizado" ? (
                  <span className="text-gray-500 text-sm"> / mes</span>
                ) : null}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-gray-300 text-sm"
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!!busyId}
                onClick={() => void selectPlan(tier.id)}
                className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Seleccionar plan
              </button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
