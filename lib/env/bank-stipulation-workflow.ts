/**
 * Gate for Agent-4 stipulation workflow UX (templates, bulk draft, dealer notify).
 * Fail-closed: OFF unless explicitly enabled at build (`1` / `true`).
 */
export function isBankStipulationWorkflowUiEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_BANK_STIPULATION_WORKFLOW_UI ?? "").trim();
  return v === "1" || v.toLowerCase() === "true";
}
