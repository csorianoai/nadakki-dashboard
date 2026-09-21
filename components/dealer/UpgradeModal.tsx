"use client";

import { useAccessPlans } from "@/lib/access/hooks";
import { AccessApiError } from "@/lib/access/client";
import type { EntitlementDecision } from "@/types/entitlements";

interface UpgradeModalProps {
  decision: EntitlementDecision;
  onClose: () => void;
  onUpgrade?: (plan_slug: string) => void;
}

type AccessPlanCard = {
  slug: string;
  name: string;
  price_rd: number | null;
  billing_period: string | null;
  capability_keys: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

/** Catalog rows from fetchAccessPlans — no invented price/currency/features. */
export function parseAccessPlan(value: unknown): AccessPlanCard | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const slug = readTrimmedString(rec.slug);
  const name = readTrimmedString(rec.name);
  if (!slug || !name) return null;
  const version = asRecord(rec.current_version);
  const rawCaps = version && Array.isArray(version.capabilities) ? version.capabilities : [];
  const capability_keys: string[] = [];
  for (const cap of rawCaps) {
    const row = asRecord(cap);
    if (!row || row.enabled !== true) continue;
    const key = readTrimmedString(row.key);
    if (key) capability_keys.push(key);
  }
  return {
    slug,
    name,
    price_rd: readFiniteNumber(rec.price_rd),
    billing_period: readTrimmedString(rec.billing_period),
    capability_keys,
  };
}

function formatPriceRd(price_rd: number, billing_period: string | null): string {
  const amount = price_rd.toLocaleString("es-DO");
  return billing_period ? `${amount} / ${billing_period}` : amount;
}

export function UpgradeModal({ decision, onClose, onUpgrade }: UpgradeModalProps) {
  const plansQuery = useAccessPlans();

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

  const catalogFailClosed =
    Boolean(plansQuery.error) ||
    plansQuery.isError ||
    plansQuery.isPending ||
    plansQuery.isLoading ||
    !Array.isArray(plansQuery.data?.plans);

  const plans = catalogFailClosed
    ? []
    : (plansQuery.data?.plans ?? []).map(parseAccessPlan).filter((row): row is AccessPlanCard => row != null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-4xl rounded-r bg-nk-surface p-8 shadow-nk-md" data-testid="dealer-upgrade-modal">
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
            : "Planes publicados por el catálogo de acceso."}
        </p>

        {plansQuery.isPending || plansQuery.isLoading ? (
          <p className="mt-6 text-sm text-nk-fg-muted" data-testid="dealer-upgrade-loading">
            Cargando planes…
          </p>
        ) : catalogFailClosed || plans.length === 0 ? (
          <p className="mt-6 text-sm text-nk-fg-muted" data-testid="dealer-upgrade-fail-closed" role="alert">
            {plansQuery.error instanceof AccessApiError
              ? plansQuery.error.reason_code ?? plansQuery.error.message
              : "No hay planes disponibles."}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3" data-testid="dealer-upgrade-plans">
            {plans.map((plan) => (
              <PlanCard key={plan.slug} plan={plan} onSelect={onUpgrade} />
            ))}
          </div>
        )}

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
  onSelect,
}: {
  plan: AccessPlanCard;
  onSelect?: (plan_slug: string) => void;
}) {
  return (
    <div className="rounded-r border-2 border-nk-border p-4" data-testid="dealer-upgrade-plan" data-plan-slug={plan.slug}>
      <h3 className="font-manrope text-lg font-bold text-nk-fg">{plan.name}</h3>
      {plan.price_rd != null ? (
        <p className="mt-1 text-xl font-extrabold text-brand" data-testid="dealer-upgrade-price" data-price-field="price_rd">
          {formatPriceRd(plan.price_rd, plan.billing_period)}
        </p>
      ) : null}
      {plan.capability_keys.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {plan.capability_keys.map((feature) => (
            <li key={feature} className="text-sm text-nk-fg-muted">
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(plan.slug)}
          className="mt-4 w-full rounded-full border border-nk-border bg-nk-surface-2 px-4 py-2 text-sm font-bold text-nk-fg"
        >
          Seleccionar
        </button>
      ) : null}
    </div>
  );
}
