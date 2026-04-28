"use client";

import { useEffect } from "react";
import { registerCreditHubSpanishZodErrorMap } from "@/lib/credit-hub/i18n/zod-error-map";

/** Loads credit-hub i18n side effects (e.g. Zod error map) for dealer/bank shells. */
export function CreditHubI18nBootstrap() {
  useEffect(() => {
    registerCreditHubSpanishZodErrorMap();
  }, []);
  return null;
}
