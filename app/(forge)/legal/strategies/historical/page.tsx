"use client";

import React from "react";
import { StrategyComparator } from "@/components/legal/strategies/StrategyComparator";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";

export default function StrategyHistoricalPage() {
  const { effectiveTenantId, tenantHydrated } = useLegalEffectiveTenantId();

  if (!tenantHydrated) {
    return (
      <div className="p-6 text-sm text-gray-400">Cargando tenant...</div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Análisis Histórico de Estrategias</h1>
      <StrategyComparator tenantId={effectiveTenantId} />
    </div>
  );
}
