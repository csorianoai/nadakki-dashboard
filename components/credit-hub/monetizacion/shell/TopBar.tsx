"use client";

import { Menu } from "lucide-react";
import { TenantSwitcher } from "./TenantSwitcher";

type Props = {
  title: string;
  tenantId: string;
  onTenantChange: (id: string) => void;
  onGenerateInvoice?: () => void;
  onMobileNavToggle?: () => void;
};

export function TopBar({
  title,
  tenantId,
  onTenantChange,
  onGenerateInvoice,
  onMobileNavToggle,
}: Props) {
  return (
    <header className="fm-topbar">
      <button
        type="button"
        className="fm-mobile-nav-btn"
        aria-label="Abrir menú de navegación"
        onClick={onMobileNavToggle}
      >
        <Menu size={18} strokeWidth={1.9} />
      </button>
      <h1 className="fm-topbar-title">{title}</h1>
      <div className="fm-topbar-divider" aria-hidden />
      <TenantSwitcher tenantId={tenantId} onTenantChange={onTenantChange} />
      <span className="fm-topbar-period">Periodo · mayo 2026</span>
      <div className="fm-topbar-spacer" />
      <button type="button" className="fm-btn-primary" onClick={onGenerateInvoice}>
        Generar factura
      </button>
    </header>
  );
}
