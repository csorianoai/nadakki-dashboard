"use client";

import { useTenant } from "@/contexts/TenantContext";

export default function SicConfiguracionPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Configuración SIC</h1>
      <p className="text-slate-500 text-sm mb-6">Parámetros del sistema de información crediticia</p>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
        <p className="text-slate-400 text-sm mb-4">Tenant: {tenant}</p>
        <p className="text-slate-500 text-xs">Configuración disponible en próximas versiones.</p>
      </div>
    </div>
  );
}
