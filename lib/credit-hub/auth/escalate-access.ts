/** Role gate for KYC/OCR escalate-review (backend contract v1.4). */
export function canEscalateReview(roleKey: string | null | undefined): boolean {
  const k = (roleKey ?? "").trim().toLowerCase();
  return k === "bank_analyst" || k === "credit_admin" || k === "bank_admin";
}
