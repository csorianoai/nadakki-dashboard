export type ForgePersona = "dealer" | "bank" | "customer" | "admin";

export const forgePersonas: ForgePersona[] = ["dealer", "bank", "customer", "admin"];

export function isForgePersona(value: string | null | undefined): value is ForgePersona {
  return !!value && forgePersonas.includes(value as ForgePersona);
}

export function personaLabel(persona: ForgePersona): string {
  const labels: Record<ForgePersona, string> = {
    dealer: "Dealer",
    bank: "Bank",
    customer: "Customer",
    admin: "Admin",
  };

  return labels[persona];
}
