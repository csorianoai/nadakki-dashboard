"use client";

import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

const TRANSLATION_BUNDLES: Record<string, CreditHubTranslations> = {
  "es-DO": CREDIT_HUB_ES_DO,
};

export function useTranslations(): CreditHubTranslations {
  const { tenantConfig } = useTenantConfig();
  const locale = tenantConfig?.locale ?? "es-DO";
  return TRANSLATION_BUNDLES[locale] ?? TRANSLATION_BUNDLES["es-DO"];
}
