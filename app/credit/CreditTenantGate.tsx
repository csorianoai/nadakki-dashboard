"use client";

import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Credit routes use X-Tenant-ID from the same tenant selector as the rest of the dashboard
 * ({@link TenantContext} / top bar). No silent default tenant.
 */
export function CreditTenantGate({
  children,
}: {
  children: (tenantId: string) => ReactNode;
}) {
  const { tenantId } = useTenant();
  const tid = tenantId?.trim() ?? "";
  if (!tid) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Credit Core
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Select a tenant to use Credit Core
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-xs">
          Use the tenant selector in the top-right of the bar or in the sidebar,
          then return here.
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
  return <>{children(tid)}</>;
}
