"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useTenantOnboarding } from "@/hooks/useTenantOnboarding";

export function CredentialsStep() {
  const { state, setState, fieldErrors } = useTenantOnboarding();

  return (
    <GlassCard className="p-4 sm:p-6" data-testid="step-credentials">
      <h2 className="text-lg font-semibold text-white mb-1">Credenciales bancarias</h2>
      <p className="text-sm text-gray-400 mb-6">
        Datos sintéticos de prueba — en producción se envían al router de credenciales del tenant.
      </p>
      <div className="space-y-6">
        {state.step5.bankCredentials.map((row, i) => (
          <div key={row.bankId} className="rounded-xl border border-white/10 bg-black/30 p-4" data-testid={`bank-cred-${row.bankId}`}>
            <h3 className="text-sm font-medium text-white mb-3">{row.bankName}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-xs text-gray-500">Client ID</span>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white"
                  value={row.clientId}
                  autoComplete="off"
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const banks = [...s.step5.bankCredentials];
                      banks[i] = { ...banks[i], clientId: v };
                      return { ...s, step5: { bankCredentials: banks } };
                    });
                  }}
                  data-testid={`onboarding-bank-client-${row.bankId}`}
                />
                {fieldErrors[`bank_${i}_id`] && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors[`bank_${i}_id`]}</p>
                )}
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs text-gray-500">Client secret</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white"
                  value={row.clientSecret}
                  autoComplete="new-password"
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const banks = [...s.step5.bankCredentials];
                      banks[i] = { ...banks[i], clientSecret: v };
                      return { ...s, step5: { bankCredentials: banks } };
                    });
                  }}
                  data-testid={`onboarding-bank-secret-${row.bankId}`}
                />
                {fieldErrors[`bank_${i}_secret`] && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors[`bank_${i}_secret`]}</p>
                )}
              </label>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
