"use client";

import { useMemo } from "react";
import { useTenantConfig } from "./useTenantConfig";
import { ConsentApiClient } from "../api/consent-client";

export function useConsentApi(): ConsentApiClient | null {
  const { tenantConfig } = useTenantConfig();

  return useMemo(() => {
    if (!tenantConfig?.tenant_id) return null;
    return new ConsentApiClient(tenantConfig.tenant_id);
  }, [tenantConfig?.tenant_id]);
}
