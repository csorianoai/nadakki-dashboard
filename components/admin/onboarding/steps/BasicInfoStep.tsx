"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useTenantOnboarding } from "@/hooks/useTenantOnboarding";
import type { CountryCode, Industry } from "@/types/onboarding";

const COUNTRIES: { value: CountryCode; label: string }[] = [
  { value: "DO", label: "República Dominicana" },
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "México" },
];

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "financial_services", label: "Servicios financieros" },
  { value: "tourism", label: "Turismo" },
  { value: "retail", label: "Retail" },
  { value: "automotive", label: "Automotriz" },
  { value: "technology", label: "Tecnología" },
  { value: "other", label: "Otro" },
];

export function BasicInfoStep() {
  const { state, setState, fieldErrors } = useTenantOnboarding();

  return (
    <GlassCard className="p-4 sm:p-6" data-testid="step-basic-info">
      <h2 className="text-lg font-semibold text-white mb-1">Información básica</h2>
      <p className="text-sm text-gray-400 mb-6">Identificador del tenant y contacto principal.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block md:col-span-2">
          <span className="text-xs text-gray-500">Slug (URL) *</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-600 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            value={state.step1.slug}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                step1: { ...s.step1, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") },
              }))
            }
            placeholder="mi-organizacion"
            autoComplete="off"
            data-testid="onboarding-slug"
          />
          {fieldErrors.slug && <p className="text-xs text-red-400 mt-1">{fieldErrors.slug}</p>}
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-gray-500">Nombre para mostrar *</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            value={state.step1.displayName}
            onChange={(e) => setState((s) => ({ ...s, step1: { ...s.step1, displayName: e.target.value } }))}
            data-testid="onboarding-display-name"
          />
          {fieldErrors.displayName && <p className="text-xs text-red-400 mt-1">{fieldErrors.displayName}</p>}
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">País</span>
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            value={state.step1.country}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                step1: { ...s.step1, country: e.target.value as CountryCode },
              }))
            }
            data-testid="onboarding-country"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-zinc-900">
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">Industria</span>
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            value={state.step1.industry}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                step1: { ...s.step1, industry: e.target.value as Industry },
              }))
            }
            data-testid="onboarding-industry"
          >
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value} className="bg-zinc-900">
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-gray-500">Email de contacto *</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            value={state.step1.contactEmail}
            onChange={(e) =>
              setState((s) => ({ ...s, step1: { ...s.step1, contactEmail: e.target.value } }))
            }
            data-testid="onboarding-contact-email"
          />
          {fieldErrors.contactEmail && <p className="text-xs text-red-400 mt-1">{fieldErrors.contactEmail}</p>}
        </label>
      </div>
    </GlassCard>
  );
}
