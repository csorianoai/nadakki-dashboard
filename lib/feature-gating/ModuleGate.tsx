"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import { useTenantModules } from "@/hooks/useTenantModules";

export interface ModuleGateProps {
  module: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ModuleGate({ module, children, fallback }: ModuleGateProps) {
  const { hasModule, isLoading } = useTenantModules();

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 md:p-6">
        <Skeleton className="h-8 w-48 rounded-forge-md" />
        <Skeleton className="h-32 w-full max-w-2xl rounded-forge-md" />
      </div>
    );
  }

  if (!hasModule(module)) {
    return (
      fallback ?? (
        <div className="p-4 md:p-6">
          <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-6 text-center shadow-forge-xs">
            <p className="text-forge-sm text-forgeGray-700">Este módulo no está disponible en tu plan.</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
