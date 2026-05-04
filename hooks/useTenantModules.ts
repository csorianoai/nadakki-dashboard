"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";

export interface ModuleCatalogItem {
  module: string;
  display_name: string;
  description?: string;
  category?: string;
  icon?: string;
}

export interface TenantModulesResponse {
  tenant_id: string;
  plan: string;
  modules: string[];
  catalog: ModuleCatalogItem[];
}

async function fetchTenantModules(tenantId: string): Promise<TenantModulesResponse> {
  const res = await fetch(`/api/v1/tenants/${encodeURIComponent(tenantId)}/modules`, {
    headers: { "X-Tenant-ID": tenantId.trim() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch tenant modules: ${res.status}`);
  }
  return (await res.json()) as TenantModulesResponse;
}

export function useTenantModules() {
  const { tenantId } = useTenant();
  const tid = tenantId?.trim() ?? "";

  const query = useQuery({
    queryKey: ["tenant-modules", tid],
    queryFn: () => fetchTenantModules(tid),
    enabled: tid.length > 0,
    staleTime: 60_000,
  });

  const normalized = (query.data?.modules ?? []).map((m) => m.toLowerCase());

  const hasModule = (mod: string) => normalized.includes(mod.toLowerCase());

  /** Credit Hub may be exposed under several backend slugs. */
  const hasCreditHub = () =>
    hasModule("credit_hub") || hasModule("credit") || hasModule("forge_credit") || hasModule("forge_credit_hub");

  return {
    plan: query.data?.plan ?? "loading",
    modules: query.data?.modules ?? [],
    catalog: query.data?.catalog ?? [],
    hasModule,
    hasCreditHub,
    isLoading: !tid || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
