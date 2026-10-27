import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ClientesPanel } from "@/components/realtor/clientes/ClientesPanel";

// Acceso y cliente REALES (apiFetch y useRealtorAccess sin simular): solo se sustituye la red (fetch).
beforeEach(() => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const body = String(url).includes("/acceso") ? { ok: true, roles: ["owner"], demo: false }
      : { items: [{ contact: { id: "k1", display_label: "Ana P.", source: "manual", primary_points: [] }, client_roles: ["buyer"], agreement_signed: false }], next_cursor: null };
    return { status: 200, ok: true, json: async () => body } as Response;
  }) as unknown as typeof fetch;
});

describe("prospecto → Abrir operación", () => {
  it("la ficha enlaza a /realtor/operaciones con el contacto precargado y sin tenant", async () => {
    render(<ClientesPanel />);
    await screen.findByTestId("clientes-panel");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("contact-row"));
    const link = await screen.findByRole("link", { name: "Abrir operación" });
    const href = link.getAttribute("href") ?? "";
    expect(href).toBe("/realtor/operaciones?contact_id=k1");
    expect(href).not.toMatch(/tenant/i);
  });
});
