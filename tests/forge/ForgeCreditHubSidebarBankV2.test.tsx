/**
 * @jest-environment jsdom
 *
 * UNA-VERSION: el sidebar persona "bank" del Credit Hub enlaza bank-v2 siempre,
 * sin interruptor. Persona dealer: no cambia.
 */
import { render, screen } from "@testing-library/react";
import { ForgeCreditHubSidebar } from "@/components/forge/layout/ForgeCreditHubSidebar";
import { PersonaProvider } from "@/components/credit-hub/system/PersonaProvider";
import type { ForgePersona } from "@/lib/credit-hub/design/persona";

jest.mock("next/navigation", () => ({ usePathname: () => "/credit-hub/preview" }));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({ tenantConfig: { branding: {}, institution_name: "Banco Demo" } }),
}));
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: null, isPending: false }),
}));

function pintar(persona: ForgePersona) {
  render(
    <PersonaProvider persona={persona}>
      <ForgeCreditHubSidebar />
    </PersonaProvider>,
  );
  const nav = screen.getByRole("navigation", { name: "Primary" });
  return Array.from(nav.querySelectorAll("a")).map((a) => a.getAttribute("href"));
}

it("la persona bank enlaza las pantallas de bank-v2", () => {
  expect(pintar("bank")).toEqual([
    "/credit-hub/bank-v2",
    "/credit-hub/bank-v2/solicitudes",
    "/credit-hub/bank-v2/analitica",
    "/credit-hub/bank-v2/cumplimiento",
    "/credit-hub/bank-v2/auditoria",
  ]);
});

it("la persona dealer no cambia", () => {
  const enlaces = pintar("dealer");
  expect(enlaces[0]).toBe("/credit-hub/dealer");
  expect(enlaces.some((h) => h?.includes("bank"))).toBe(false);
});
