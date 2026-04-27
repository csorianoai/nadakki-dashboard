"use client";

import { AlertCircle } from "lucide-react";
import { useFeatureFlag } from "@/lib/credit-hub/hooks/useFeatureFlag";

export function CHFeatureFlagBanner() {
  const { enabled, loading } = useFeatureFlag();

  if (loading || enabled !== false) return null;

  return (
    <div className="border-b border-forge-warning/30 bg-forge-warning/10 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-forge-warning" />
        <p className="text-sm text-forge-text">
          <span className="font-medium">Forge está instalado</span> pero deshabilitado en este entorno. Contacta a tu
          administrador para activarlo.
        </p>
      </div>
    </div>
  );
}
