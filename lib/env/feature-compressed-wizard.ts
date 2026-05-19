/**
 * T6.7 Time Compression Wizard — default ON (META MVP 4 critical path).
 * Set NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD=0 or false to fall back to legacy DealerNewWizard.
 */
export function isCompressedWizardFeatureEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}
