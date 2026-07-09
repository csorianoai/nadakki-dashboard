/** Bank pilot UI surfaces (wizard labels, escalate panel). Default on; set false for graceful hide. */
export function isBankPilotUiEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_BANK_PILOT_UI ?? "true").trim().toLowerCase();
  return v !== "false" && v !== "0" && v !== "off";
}
