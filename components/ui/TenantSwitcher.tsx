'use client';

// components/ui/TenantSwitcher.tsx - Selector de Tenant Global
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

export default function TenantSwitcher() {
  const { currentTenant, tenants, isLoading, setCurrentTenant } = useTenant();

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        Cargando tenants...
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-glass-border">
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
        Tenant Activo
      </label>
      <select
        value={currentTenant?.tenant_id || ''}
        onChange={(e) => {
          const tenant = tenants.find(t => t.tenant_id === e.target.value);
          if (tenant) setCurrentTenant(tenant);
        }}
        className={cn(
          "w-full px-3 py-2 rounded-lg",
          "bg-glass-bg border border-glass-border",
          "text-white text-sm font-medium",
          "focus:outline-none focus:border-core-financial",
          "transition-colors cursor-pointer"
        )}
      >
        {tenants.map((tenant) => (
          <option 
            key={tenant.tenant_id} 
            value={tenant.tenant_id}
            className="bg-quantum-void"
          >
            {tenant.name} ({tenant.plan})
          </option>
        ))}
      </select>
      
      {currentTenant && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={cn(
            "px-2 py-0.5 rounded-full",
            currentTenant.status === 'active' 
              ? "bg-green-500/20 text-green-400" 
              : "bg-red-500/20 text-red-400"
          )}>
            {currentTenant.status}
          </span>
          <span className="text-gray-500">
            {currentTenant.decisions_this_month} decisions
          </span>
        </div>
      )}
    </div>
  );
}
