"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useTenantOnboarding } from "@/hooks/useTenantOnboarding";

export function BrandingStep() {
  const { state, setState, fieldErrors, logoFileRef } = useTenantOnboarding();

  return (
    <GlassCard className="p-4 sm:p-6" data-testid="step-branding">
      <h2 className="text-lg font-semibold text-white mb-1">Marca</h2>
      <p className="text-sm text-gray-400 mb-6">Logo y colores para la consola del tenant.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block md:col-span-2">
          <span className="text-xs text-gray-500">Logo (PNG/SVG)</span>
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-white"
            data-testid="onboarding-logo-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              logoFileRef.current = f ?? null;
              if (!f) {
                setState((s) => ({
                  ...s,
                  step2: { ...s.step2, logoFileName: null, logoDataUrl: null },
                }));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const url = typeof reader.result === "string" ? reader.result : null;
                setState((s) => ({
                  ...s,
                  step2: { ...s.step2, logoFileName: f.name, logoDataUrl: url },
                }));
              };
              reader.readAsDataURL(f);
            }}
          />
          {state.step2.logoFileName && (
            <p className="text-xs text-gray-500 mt-1">Seleccionado: {state.step2.logoFileName}</p>
          )}
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">Color primario</span>
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent p-0"
              value={state.step2.primaryColor}
              onChange={(e) =>
                setState((s) => ({ ...s, step2: { ...s.step2, primaryColor: e.target.value } }))
              }
              data-testid="onboarding-primary-color"
            />
            <input
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white"
              value={state.step2.primaryColor}
              onChange={(e) =>
                setState((s) => ({ ...s, step2: { ...s.step2, primaryColor: e.target.value } }))
              }
            />
          </div>
          {fieldErrors.primaryColor && <p className="text-xs text-red-400 mt-1">{fieldErrors.primaryColor}</p>}
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">Color secundario</span>
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent p-0"
              value={state.step2.secondaryColor}
              onChange={(e) =>
                setState((s) => ({ ...s, step2: { ...s.step2, secondaryColor: e.target.value } }))
              }
              data-testid="onboarding-secondary-color"
            />
            <input
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white"
              value={state.step2.secondaryColor}
              onChange={(e) =>
                setState((s) => ({ ...s, step2: { ...s.step2, secondaryColor: e.target.value } }))
              }
            />
          </div>
          {fieldErrors.secondaryColor && <p className="text-xs text-red-400 mt-1">{fieldErrors.secondaryColor}</p>}
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-gray-500">Dominio personalizado (opcional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            value={state.step2.customDomain}
            placeholder="console.midominio.com"
            onChange={(e) =>
              setState((s) => ({ ...s, step2: { ...s.step2, customDomain: e.target.value.trim() } }))
            }
            data-testid="onboarding-custom-domain"
          />
          {fieldErrors.customDomain && <p className="text-xs text-red-400 mt-1">{fieldErrors.customDomain}</p>}
        </label>
      </div>
    </GlassCard>
  );
}
