"use client";

import type { EntitlementDecision, PlanSlug } from "@/types/entitlements";

interface UpgradeModalProps {
  decision: EntitlementDecision;
  onClose: () => void;
  onUpgrade: (plan_slug: PlanSlug) => void;
}

const PLANS: Array<{
  slug: PlanSlug;
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    slug: "conecta",
    name: "Conecta",
    price: "RD$4,130/mes",
    features: ["Inventario básico", "Calculadora financiamiento", "Templates view-only"],
  },
  {
    slug: "crece",
    name: "Crece",
    price: "RD$10,030/mes",
    features: ["Marketing (5 camp/mes)", "Legal quick-check", "Credit bridge"],
    highlight: true,
  },
  {
    slug: "domina",
    name: "Domina",
    price: "RD$17,464/mes",
    features: ["Cores completos", "Campañas ilimitadas", "Soporte prioritario"],
  },
];

export function UpgradeModal({ decision, onClose, onUpgrade }: UpgradeModalProps) {
  if (decision.allowed) {
    return null;
  }

  if (decision.target_readiness === "BLOCKED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-w-lg rounded-r bg-nk-surface p-8 shadow-nk-md">
          <h2 className="font-manrope text-2xl font-extrabold text-nk-fg">
            Función no disponible aún
          </h2>
          <p className="mt-2 text-sm text-nk-fg-muted">
            Esta capacidad está en desarrollo. Vuelve pronto.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full border border-nk-border px-4 py-2 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (decision.provider_status === "PENDING") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-w-lg rounded-r bg-nk-surface p-8 shadow-nk-md">
          <h2 className="font-manrope text-2xl font-extrabold text-nk-fg">
            Proveedor pendiente de activación
          </h2>
          <p className="mt-2 text-sm text-nk-fg-muted">
            Tu plan incluye esta función, pero un proveedor externo debe activarse primero.
            Contacta a tu administrador.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full border border-nk-border px-4 py-2 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-4xl rounded-r bg-nk-surface p-8 shadow-nk-md">
        <h2 className="font-manrope text-2xl font-extrabold text-nk-fg">
          {decision.reason_code === "LIMIT_REACHED"
            ? "Límite mensual alcanzado"
            : "Mejora tu plan"}
        </h2>
        <p className="mt-2 text-sm text-nk-fg-muted">
          {decision.reason_code === "LIMIT_REACHED" &&
          decision.used != null &&
          decision.limit != null
            ? `Has usado ${decision.used} de ${decision.limit} este mes. Mejora tu plan para más.`
            : "Accede a capacidades premium de Marketing, Legal, Credit y Accounting."}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.slug}
              plan={plan}
              highlight={plan.highlight}
              onSelect={() => onUpgrade(plan.slug)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full border border-nk-border px-4 py-2 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  highlight,
  onSelect,
}: {
  plan: (typeof PLANS)[number];
  highlight?: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-r border-2 p-4 ${
        highlight ? "border-brand-2 bg-brand-2/5" : "border-nk-border hover:border-brand-2/40"
      }`}
    >
      <h3 className="font-manrope text-lg font-bold text-nk-fg">{plan.name}</h3>
      <p className="mt-1 text-xl font-extrabold text-brand">{plan.price}</p>
      <ul className="mt-4 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="text-sm text-nk-fg-muted">
            ✓ {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-bold transition ${
          highlight
            ? "bg-gradient-to-r from-brand-2 to-brand text-white"
            : "border border-nk-border bg-nk-surface-2 text-nk-fg"
        }`}
      >
        {highlight ? "Más popular" : "Seleccionar"}
      </button>
    </div>
  );
}
