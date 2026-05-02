export const DEALER_WIZARD_STEP_PATHS = ["applicant", "co-borrower", "vehicle", "documents", "consent"] as const;

export type DealerWizardStepSlug = (typeof DEALER_WIZARD_STEP_PATHS)[number];

const BASE = "/credit-hub/dealer/applications/new";

export function dealerWizardStepHref(slug: DealerWizardStepSlug): string {
  return `${BASE}/${slug}`;
}

export function dealerWizardStepIndexFromPathname(pathname: string | null): number {
  if (!pathname) return 0;
  const seg = pathname.split("/").filter(Boolean).pop() ?? "";
  const i = DEALER_WIZARD_STEP_PATHS.indexOf(seg as DealerWizardStepSlug);
  return i >= 0 ? i : 0;
}

export function dealerWizardStepSlugFromIndex(index: number): DealerWizardStepSlug {
  return DEALER_WIZARD_STEP_PATHS[Math.min(Math.max(index, 0), DEALER_WIZARD_STEP_PATHS.length - 1)]!;
}
