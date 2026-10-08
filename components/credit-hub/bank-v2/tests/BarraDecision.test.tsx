import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BarraDecision } from "@/components/credit-hub/bank-v2/expediente/BarraDecision";
import type { BankDecision, BankReviewApplication } from "@/lib/credit-hub/types/bankDecision";

const llamadas: Array<{ path: string; body?: string }> = [];
let rol = "bank_analyst";
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u-1" } }) }));
jest.mock("@/lib/credit-hub/hooks/useCreditHubActor", () => ({
  useCreditHubActor: () => ({ can: (a: string) => a === "create_decision" && (rol === "bank_analyst" || rol === "credit_admin"), roleKey: rol }),
}));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string, init: { body?: string }) => {
    llamadas.push({ path, body: init.body });
    if (path.endsWith("/offers/compare")) return { offers_detail: [] };
    if (path.endsWith("/bank/assignable-analysts")) return { analysts: [{ user_id: "u-2", email: "banco.demo@nadakki.com", role_key: "banker" }] };
    return { ok: true };
  }),
}));

const app = (claim: BankReviewApplication["bank_claim"], decidida = false): BankReviewApplication => ({
  application_id: "a-1", tenant_id: "t", state: "claimed", bank_claim: claim,
  application_payload: { financial: { requested_amount: 2150000, term_months: 60, requested_rate: 12.5 }, ...(decidida ? { bank_decision: { decision: "APROBADO" } as unknown as BankDecision } : {}) },
});
const pintar = (a: BankReviewApplication) =>
  render(<QueryClientProvider client={new QueryClient()}><BarraDecision application={a} /></QueryClientProvider>);

describe("Barra de decision v2 (B4b)", () => {
  beforeEach(() => { llamadas.length = 0; rol = "bank_analyst"; });

  it.each([
    ["sin claim propio", { analyst_id: "otro" }, false, "bank_analyst", "no está asignada a ti"],
    ["ya decidida", { analyst_id: "u-1" }, true, "bank_analyst", "ya tiene una decisión"],
    ["rol sin permiso", { analyst_id: "u-1" }, false, "dealer", "Tu rol no tiene permiso"],
  ])("%s: misma condicion que el detalle actual, no deja decidir", (_c, claim, decidida, r, texto) => {
    rol = r as string;
    pintar(app(claim, decidida as boolean));
    expect(screen.getByTestId("decision-bloqueada")).toHaveTextContent(texto as string);
    expect(screen.queryByRole("button", { name: "Rechazar" })).toBeNull();
  });

  it("rechazar exige un motivo de la lista y lo envia en la justificacion; claim y decide como hoy", async () => {
    pintar(app({ analyst_id: "u-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Elige un motivo de la lista");
    expect(llamadas.some((l) => l.path.endsWith("/decide"))).toBe(false);
    fireEvent.change(screen.getByLabelText("Motivo de rechazo (obligatorio)"), { target: { value: "Ingresos no verificables" } });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar/ }));
    await waitFor(() => expect(llamadas.find((l) => l.path.endsWith("/decide"))).toBeDefined());
    expect(llamadas.map((l) => l.path).filter((p) => !p.endsWith("/offers/compare"))).toEqual(["/api/v2/credit/applications/a-1/claim", "/api/v2/credit/applications/a-1/decide"]);
    expect(JSON.parse(llamadas.find((l) => l.path.endsWith("/decide"))!.body!)).toMatchObject({ decision_type: "REJECT", notes: "Ingresos no verificables", adverse_action: true });
    expect(await screen.findByRole("status")).toHaveTextContent("decisión registrada");
  });

  describe("asignacion (BANK-V2-03)", () => {
    it("un analista se asigna una solicitud sin asignar y queda auditado por el claim", async () => {
      pintar(app(null));
      expect(screen.getByTestId("decision-bloqueada")).toHaveTextContent("no está asignada a ti");
      expect(screen.queryByLabelText("Asignar a")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Asignarme" }));
      await waitFor(() => expect(llamadas.find((l) => l.path.endsWith("/claim"))).toBeDefined());
      const claim = llamadas.find((l) => l.path.endsWith("/claim"))!;
      expect(claim.path).toBe("/api/v2/credit/applications/a-1/claim");
      expect(JSON.parse(claim.body!)).toMatchObject({ analyst_id: "u-1" });
      expect(await screen.findByTestId("asignacion-hecha")).toHaveTextContent("asignada a ti");
    });

    it("si la tiene otro analista no ofrece asignarse", () => {
      pintar(app({ analyst_id: "otro" }));
      expect(screen.queryByRole("button", { name: "Asignarme" })).toBeNull();
      expect(screen.queryByLabelText("Asignar a")).toBeNull();
    });

    it("el administrador del banco asigna a un analista con Asignar a…", async () => {
      rol = "credit_admin";
      pintar(app(null));
      const select = await screen.findByLabelText("Asignar a");
      await screen.findByRole("option", { name: "banco.demo@nadakki.com" });
      fireEvent.change(select, { target: { value: "u-2" } });
      fireEvent.click(screen.getByRole("button", { name: "Asignar" }));
      await waitFor(() => expect(llamadas.find((l) => l.path.endsWith("/claim/assign"))).toBeDefined());
      const asignar = llamadas.find((l) => l.path.endsWith("/claim/assign"))!;
      expect(asignar.path).toBe("/api/v2/credit/applications/a-1/claim/assign");
      expect(JSON.parse(asignar.body!)).toEqual({ analyst_id: "u-2" });
      expect(await screen.findByTestId("asignacion-hecha")).toHaveTextContent("banco.demo@nadakki.com");
    });

    it("un analista no ve Asignar a…", () => {
      pintar(app(null));
      expect(screen.queryByLabelText("Asignar a")).toBeNull();
      expect(llamadas.some((l) => l.path.endsWith("/bank/assignable-analysts"))).toBe(false);
    });
  });
});
