import { dealerCreditWizardHref, dealerWizardStepIdFromSegment } from "@/lib/credit-hub/dealer/dealerCreditRoutes";

export const DEALER_WIZARD_STEP_PATHS = ["applicant", "consent", "vehicle", "review"] as const;

export type DealerWizardStepSlug = (typeof DEALER_WIZARD_STEP_PATHS)[number];

/** El id del paso sigue en inglés; la URL es la de Dealer OS (/autos/dealer/credito/solicitudes/nueva/...). */
export function dealerWizardStepHref(slug: DealerWizardStepSlug, applicationId?: string): string {
  const href = dealerCreditWizardHref(slug);
  return applicationId ? `${href}?application_id=${encodeURIComponent(applicationId)}` : href;
}

export function dealerWizardStepIndexFromPathname(pathname: string | null): number {
  if (!pathname) return 0;
  const seg = pathname.split("/").filter(Boolean).pop() ?? "";
  const i = DEALER_WIZARD_STEP_PATHS.indexOf(dealerWizardStepIdFromSegment(seg) as DealerWizardStepSlug);
  return i >= 0 ? i : 0;
}

export function dealerWizardStepSlugFromIndex(index: number): DealerWizardStepSlug {
  return DEALER_WIZARD_STEP_PATHS[Math.min(Math.max(index, 0), DEALER_WIZARD_STEP_PATHS.length - 1)]!;
}
