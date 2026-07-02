"use client";

import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

const ROADMAP_TILES = [
  { title: "Onboarding dealers/bancos", body: "Flujo de alta de instituciones en la red." },
  { title: "Programas bancarios", body: "Configuración de productos y reglas por lender." },
  { title: "Feature flags por tenant", body: "Activación granular de capacidades." },
  { title: "Roles y permisos", body: "Matriz RBAC operador / institución." },
  { title: "Health de integraciones", body: "Estado de adapters y webhooks." },
  { title: "Billing", body: "Facturación por uso — visión comercial." },
  { title: "Export Power BI", body: "Conectores analíticos externos." },
] as const;

export function AdminNetworkOsView() {
  const { tenantConfig } = useTenantConfig();

  return (
    <div data-testid="admin-network-os" style={{ maxWidth: 960, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span className="ch-eyebrow">Admin / Network OS</span>
          <DataTruthBadge level="ROADMAP" />
        </div>
        <h1 className="ch-serif" style={{ margin: 0, fontSize: 30, letterSpacing: "-0.02em" }}>
          Operador de red — {tenantConfig.institution_name}
        </h1>
        <p style={{ fontSize: 14, color: "var(--ch-text-2)", marginTop: 8, lineHeight: 1.5 }}>
          Vista estratégica para el operador de red — {tenantConfig.institution_name}. La mayoría de módulos son ROADMAP hasta que el backend publique APIs de administración.
        </p>
      </header>

      <div className="ch-card" style={{ padding: 16, marginBottom: 20, border: "1px solid var(--ch-line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>Tenant activo</span>
          <DataTruthBadge level="REAL" />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ch-text-2)" }}>
          {tenantConfig.institution_name} · {tenantConfig.locale} · {tenantConfig.currency_code}
        </p>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {ROADMAP_TILES.map((tile) => (
          <div key={tile.title} className="ch-card" style={{ padding: 16, opacity: 0.92 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{tile.title}</h2>
              <DataTruthBadge level="ROADMAP" />
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--ch-text-3)", lineHeight: 1.45 }}>{tile.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
