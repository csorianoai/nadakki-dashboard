"use client";

import type { CSSProperties } from "react";
const DEMO_TENANTS = [
  { id: "banco-cibao", label: "Banco del Cibao", accent: "#2bd073" },
  { id: "credicefi", label: "CrediCefi Motors", accent: "#a78bfa" },
  { id: "nadakki-demo", label: "Nadakki Demo", accent: "#4d9fff" },
] as const;

type Props = {
  tenantId: string;
  onTenantChange: (id: string) => void;
};

export function TenantSwitcher({ tenantId, onTenantChange }: Props) {
  const current = DEMO_TENANTS.find((t) => t.id === tenantId) ?? DEMO_TENANTS[0];

  return (
    <div
      className="fm-tenant-switch"
      style={
        {
          "--fm-tenant": current.accent,
          "--fm-tenant-soft": `${current.accent}1f`,
          "--fm-tenant-bd": `${current.accent}59`,
        } as CSSProperties
      }
    >
      <span className="fm-tenant-dot" aria-hidden />
      <label className="sr-only" htmlFor="fm-tenant-select">
        Tenant activo
      </label>
      <select
        id="fm-tenant-select"
        value={tenantId}
        onChange={(e) => onTenantChange(e.target.value)}
      >
        {DEMO_TENANTS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { DEMO_TENANTS };
