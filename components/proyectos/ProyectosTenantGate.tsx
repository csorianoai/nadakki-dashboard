"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Must match Forge session ({@link "@/hooks/useAuth"} / Auth V2). Legacy {@link TenantContext}
 * does not mirror the Forge login tenant — use `tenant.id` (UUID for X-Tenant-ID) here.
 */
export function ProyectosTenantGate({ children }: { children: ReactNode }) {
  const { tenant } = useAuth();
  const tid = tenant?.id?.trim() ?? "";
  if (!tid) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Projects Core — NADAKKI
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona una institución (tenant).</p>
        <p className="text-xs text-gray-500">
          Usa el selector en la barra superior o menú lateral y vuelve a esta pantalla.
        </p>
        <Link
          href="/tenants"
          className="inline-block text-sm font-medium text-violet-600 underline dark:text-violet-400"
        >
          Administrar tenants
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
