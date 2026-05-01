"use client";

import { useEffect } from "react";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { registerCreditHubSpanishZodErrorMap } from "@/lib/credit-hub/i18n/zod-error-map";

/** Loads credit-hub i18n side effects (e.g. Zod error map) for dealer/bank shells. */
export function CreditHubI18nBootstrap() {
  const { tenantConfig } = useTenantConfig();

  useEffect(() => {
    registerCreditHubSpanishZodErrorMap();
  }, []);

  useEffect(() => {
    const loc = tenantConfig.locale?.trim();
    if (!loc || typeof document === "undefined") return;
    document.documentElement.lang = loc;
  }, [tenantConfig.locale]);

  return null;
}
