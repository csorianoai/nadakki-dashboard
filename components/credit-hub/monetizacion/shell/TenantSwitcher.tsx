"use client";

import { Shuffle } from "lucide-react";
import type { CSSProperties } from "react";

export const DEMO_TENANTS = [
  {
    id: "demo-operator",
    label: "Demo Operador",
    subtitle: "Operador · god-view",
    initials: "OP",
    accent: "#8b9dab",
  },
  {
    id: "banco-cibao",
    label: "Banco del Cibao",
    subtitle: "Banco · Híbrido (B2)",
    initials: "BC",
    accent: "#2bd073",
  },
  {
    id: "banco-atlantico",
    label: "Banco Atlántico",
    subtitle: "Banco · Comisión pura",
    initials: "BA",
    accent: "#54a8ec",
  },
  {
    id: "auto-credito-cibao",
    label: "Auto Crédito del Cibao",
    subtitle: "Dealer · Pro",
    initials: "AC",
    accent: "#a98bf0",
  },
] as const;

type Props = {
  tenantId: string;
  onTenantChange: (id: string) => void;
};

export function TenantSwitcher({ tenantId, onTenantChange }: Props) {
  const current = DEMO_TENANTS.find((t) => t.id === tenantId) ?? DEMO_TENANTS[0];
  const currentIndex = DEMO_TENANTS.findIndex((t) => t.id === current.id);

  const cycleTenant = () => {
    const next = DEMO_TENANTS[(currentIndex + 1) % DEMO_TENANTS.length];
    onTenantChange(next.id);
  };

  return (
    <button
      type="button"
      className="fm-tenant-switch"
      style={{ "--fm-tenant": current.accent } as CSSProperties}
      onClick={cycleTenant}
      aria-label={`Tenant activo: ${current.label}. Click para cambiar.`}
    >
      <span className="fm-tenant-initial" aria-hidden>
        {current.initials}
      </span>
      <span className="fm-tenant-copy">
        <span className="fm-tenant-name">{current.label}</span>
        <span className="fm-tenant-sub">{current.subtitle}</span>
      </span>
      <Shuffle size={14} strokeWidth={1.9} aria-hidden />
    </button>
  );
}
