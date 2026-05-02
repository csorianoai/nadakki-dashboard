/** Spanish (Mexico) — Credit Hub UI strings (Forge reusability test + MX tenants). */
import type { CreditHubTranslations } from "../es-DO/credit-hub";
import { CREDIT_HUB_ES_DO } from "../es-DO/credit-hub";

export const CREDIT_HUB_ES_MX = {
  ...CREDIT_HUB_ES_DO,
  bank: {
    ...CREDIT_HUB_ES_DO.bank,
    hero_compliance_line:
      "Bandeja priorizada, decisiones auditables, marco CNBV / LFPDPPP e indicadores ejecutivos para comité de riesgo.",
  },
  bank_ui: {
    ...CREDIT_HUB_ES_DO.bank_ui,
    compliance_card_title: "Cumplimiento CNBV / LFPDPPP",
  },
} as unknown as CreditHubTranslations;
