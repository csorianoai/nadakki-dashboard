"use client";

import { useTenant } from "@/contexts/TenantContext";

export default function TenantSwitcher() {
  const { tenantId, settings } = useTenant();

  return (
    <div className="px-4 py-3 border-b border-white/10">
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
        Tenant Activo
      </label>
      <div className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm font-medium">
        {settings.name}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
          active
        </span>
        <span className="text-gray-500 uppercase">
          {settings.plan}
        </span>
      </div>
    </div>
  );
}