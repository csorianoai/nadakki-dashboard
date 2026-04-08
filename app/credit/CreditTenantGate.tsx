"use client";

import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Credit routes use X-Tenant-ID from the same tenant selector as the rest of the dashboard
 * ({@link TenantContext} / top bar). No silent default tenant.
 */
export function CreditTenantGate({ children }: { children: ReactNode }) {
  const { tenantId } = useTenant();
  const tid = tenantId?.trim() ?? "";
  if (!tid) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Crédito NADAKKI
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Seleccione una institución
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-xs">
          Use el selector de tenant en la barra superior o en el menú lateral y
          vuelva a esta pantalla.
        </p>
        <Link
          href="/tenants"
          className="inline-block text-sm text-violet-600 dark:text-violet-400 underline"
        >
          Open Multi-Tenant
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
