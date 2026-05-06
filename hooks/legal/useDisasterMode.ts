"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDisasterMode } from "@/lib/legal/cases/legal-cases-api";

export function useDisasterMode() {
  return useQuery({
    queryKey: ["legal_disaster_mode"],
    queryFn: fetchDisasterMode,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
