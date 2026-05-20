"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useTenantOnboarding } from "@/hooks/useTenantOnboarding";
import type { CoreKind, PricingTier } from "@/types/onboarding";

const CORE_DEF: { id: CoreKind; label: string }[] = [
  { id: "credit", label: "Crédito" },
  { id: "marketing", label: "Marketing" },
  { id: "legal", label: "Legal" },
  { id: "billing", label: "Facturación" },
];

const TIERS: PricingTier[] = ["starter", "pro", "enterprise"];

export function CoresStep() {
  const { state, setState, fieldErrors } = useTenantOnboarding();

  const toggle = (core: CoreKind) => {
    setState((s) => {
      const has = s.step3.cores.some((c) => c.core === core);
      const next = has
        ? s.step3.cores.filter((c) => c.core !== core)
        : [...s.step3.cores, { core, tier: "starter" as PricingTier }];
      return { ...s, step3: { cores: next } };
    });
  };

  const setTier = (core: CoreKind, tier: PricingTier) => {
    setState((s) => ({
      ...s,
      step3: {
        cores: s.step3.cores.map((c) => (c.core === core ? { ...c, tier } : c)),
      },
    }));
  };

  return (
    <GlassCard className="p-4 sm:p-6" data-testid="step-cores">
      <h2 className="text-lg font-semibold text-white mb-1">Suscripción por core</h2>
      <p className="text-sm text-gray-400 mb-6">Selecciona módulos y nivel de precio para cada uno.</p>
      {fieldErrors.cores && <p className="text-sm text-red-400 mb-4">{fieldErrors.cores}</p>}
      <ul className="space-y-4">
        {CORE_DEF.map(({ id, label }) => {
          const selected = state.step3.cores.some((c) => c.core === id);
          const row = state.step3.cores.find((c) => c.core === id);
          return (
            <li
              key={id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(id)}
                  className="h-4 w-4 rounded border-white/20"
                  data-testid={`onboarding-core-${id}`}
                />
                <span className="font-medium text-white">{label}</span>
              </label>
              {selected && row && (
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-xs uppercase tracking-wide">Tier</span>
                  <select
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white"
                    value={row.tier}
                    onChange={(e) => setTier(id, e.target.value as PricingTier)}
                    data-testid={`onboarding-tier-${id}`}
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t} className="bg-zinc-900">
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
