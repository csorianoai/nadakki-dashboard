"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchJurisdictions,
  fetchKnowledgePackStatus,
  type JurisdictionsResponse,
  type KnowledgePackStatus,
} from "@/lib/legal/cases/legal-cases-api";

export function useJurisdictions(tenantId: string | undefined) {
  const q = useQuery<JurisdictionsResponse>({
    queryKey: ["legal_jurisdictions", tenantId ?? ""],
    enabled: Boolean(tenantId?.trim()),
    queryFn: async () => {
      const raw = await fetchJurisdictions(tenantId!);
      return raw;
    },
    staleTime: 5 * 60 * 1000, // jurisdictions rarely change
  });

  return {
    ...q,
    jurisdictions: q.data?.jurisdictions ?? [],
    count: q.data?.count ?? 0,
  };
}

export function useKnowledgePackStatus(
  tenantId: string | undefined,
  jurisdiction: string = "do",
) {
  const q = useQuery<KnowledgePackStatus>({
    queryKey: ["legal_knowledge_pack_status", tenantId ?? "", jurisdiction],
    enabled: Boolean(tenantId?.trim()),
    queryFn: async () => {
      const raw = await fetchKnowledgePackStatus(tenantId!, jurisdiction);
      return raw;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...q,
    packStatus: q.data ?? null,
  };
}
