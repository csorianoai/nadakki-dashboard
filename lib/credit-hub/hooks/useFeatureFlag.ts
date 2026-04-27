"use client";

import { useHealth } from "./useHealth";

export function useFeatureFlag() {
  const { data: health, isLoading } = useHealth();
  return {
    enabled: health?.routeone_parity_enabled ?? null,
    storageMode: health?.storage_mode ?? null,
    storageStatus: health?.storage_status ?? null,
    webhookStatus: health?.webhook_status ?? null,
    loading: isLoading,
  };
}
