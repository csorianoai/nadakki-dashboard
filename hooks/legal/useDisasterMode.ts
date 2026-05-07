"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDisasterMode } from "@/lib/legal/cases/legal-cases-api";

export function useDisasterMode(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["legal_disaster_mode", tenantId ?? ""],
    enabled: Boolean(tenantId?.trim()),
    queryFn: () => fetchDisasterMode(tenantId!),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
