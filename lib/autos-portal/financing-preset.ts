/** Credit Hub wizard preset encoder (vehicle context from VDP). */

export type CreditHubVehiclePreset = {
  vehiclePrice: number;
  downPayment: number;
  termMonths: number;
  loanAmount: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  autosVehicleId?: string;
  source: "autos_vdp";
};

export function buildCreditHubPreset(input: Omit<CreditHubVehiclePreset, "source" | "loanAmount">): CreditHubVehiclePreset {
  const loanAmount = Math.max(0, Math.round(input.vehiclePrice - input.downPayment));
  return {
    ...input,
    loanAmount,
    source: "autos_vdp",
  };
}

export function encodeCreditHubPreset(preset: CreditHubVehiclePreset): string {
  const json = JSON.stringify(preset);
  if (typeof btoa !== "undefined") {
    return encodeURIComponent(btoa(json));
  }
  return encodeURIComponent(Buffer.from(json, "utf8").toString("base64"));
}

export function creditHubWizardUrl(preset: CreditHubVehiclePreset): string {
  const q = encodeCreditHubPreset(preset);
  return `/credit-hub/dealer/applications/new/applicant?preset=${q}`;
}

export function creditHubApplicationUrl(applicationId: string): string {
  return `/credit-hub/dealer/applications/${encodeURIComponent(applicationId)}`;
}
