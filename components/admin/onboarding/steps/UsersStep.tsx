"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useTenantOnboarding } from "@/hooks/useTenantOnboarding";
import type { OnboardingUser, UserRole } from "@/types/onboarding";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "tenant_admin", label: "Admin tenant" },
  { value: "analyst", label: "Analista" },
  { value: "viewer", label: "Solo lectura" },
  { value: "support", label: "Soporte" },
];

const EMPTY_USER = (): OnboardingUser => ({
  email: "",
  fullName: "",
  role: "analyst",
});

export function UsersStep() {
  const { state, setState, fieldErrors } = useTenantOnboarding();
  const extras = state.step4.additionalUsers;

  const addUser = () => {
    if (extras.length >= 3) return;
    setState((s) => ({
      ...s,
      step4: { ...s.step4, additionalUsers: [...s.step4.additionalUsers, EMPTY_USER()] },
    }));
  };

  const removeUser = (index: number) => {
    setState((s) => ({
      ...s,
      step4: {
        ...s.step4,
        additionalUsers: s.step4.additionalUsers.filter((_, i) => i !== index),
      },
    }));
  };

  return (
    <GlassCard className="p-4 sm:p-6" data-testid="step-users">
      <h2 className="text-lg font-semibold text-white mb-1">Usuarios iniciales</h2>
      <p className="text-sm text-gray-400 mb-6">Administrador principal y hasta 3 usuarios adicionales.</p>

      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 mb-6">
        <h3 className="text-sm font-semibold text-purple-200 mb-3">Administrador del tenant</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block md:col-span-2">
            <span className="text-xs text-gray-500">Nombre completo *</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              value={state.step4.admin.fullName}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  step4: { ...s.step4, admin: { ...s.step4.admin, fullName: e.target.value } },
                }))
              }
              data-testid="onboarding-admin-name"
            />
            {fieldErrors.adminName && <p className="text-xs text-red-400 mt-1">{fieldErrors.adminName}</p>}
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-gray-500">Email *</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              value={state.step4.admin.email}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  step4: { ...s.step4, admin: { ...s.step4.admin, email: e.target.value } },
                }))
              }
              data-testid="onboarding-admin-email"
            />
            {fieldErrors.adminEmail && <p className="text-xs text-red-400 mt-1">{fieldErrors.adminEmail}</p>}
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-gray-500">Rol</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/30 px-3 py-2 text-gray-300 cursor-not-allowed"
              readOnly
              value="tenant_admin"
              data-testid="onboarding-admin-role"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-white">Usuarios adicionales</h3>
          <button
            type="button"
            onClick={addUser}
            disabled={extras.length >= 3}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-40"
            data-testid="onboarding-add-user"
          >
            Añadir usuario ({extras.length}/3)
          </button>
        </div>
        {extras.map((u, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-black/25 p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
            data-testid={`onboarding-extra-user-${i}`}
          >
            <label className="block md:col-span-1">
              <span className="text-xs text-gray-500">Nombre</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={u.fullName}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const copy = [...s.step4.additionalUsers];
                    copy[i] = { ...copy[i], fullName: v };
                    return { ...s, step4: { ...s.step4, additionalUsers: copy } };
                  });
                }}
              />
              {fieldErrors[`user_${i}_name`] && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors[`user_${i}_name`]}</p>
              )}
            </label>
            <label className="block md:col-span-1">
              <span className="text-xs text-gray-500">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={u.email}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const copy = [...s.step4.additionalUsers];
                    copy[i] = { ...copy[i], email: v };
                    return { ...s, step4: { ...s.step4, additionalUsers: copy } };
                  });
                }}
              />
              {fieldErrors[`user_${i}_email`] && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors[`user_${i}_email`]}</p>
              )}
            </label>
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <label className="block flex-1">
                <span className="text-xs text-gray-500">Rol</span>
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                  value={u.role}
                  onChange={(e) => {
                    const v = e.target.value as UserRole;
                    setState((s) => {
                      const copy = [...s.step4.additionalUsers];
                      copy[i] = { ...copy[i], role: v };
                      return { ...s, step4: { ...s.step4, additionalUsers: copy } };
                    });
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-zinc-900">
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                onClick={() => removeUser(i)}
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
