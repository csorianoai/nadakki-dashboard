import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { PropiedadesPanel } from "@/components/realtor/propiedades/PropiedadesPanel";

// Acceso y cliente REALES (apiFetch y useRealtorAccess sin simular): solo se sustituye la red (fetch).
const PID = "11111111-1111-4111-8111-111111111111";
const BASE = "/api/v1/realestate";

beforeEach(() => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const path = String(url).split("?")[0];
    const body = path.includes("/acceso") ? { ok: true, roles: ["owner"], demo: false }
      : path === `${BASE}/properties` ? { items: [{ id: PID, property_type: "house", address: { city: "Santiago", region: "Cibao" } }], next_cursor: null }
      : path === `${BASE}/listings` ? { items: [{ id: "L1", property_id: PID, status: "active", list_price: { amount: "100000", currency: "USD" } }], next_cursor: null }
      : { items: [], next_cursor: null };
    return { status: 200, ok: true, json: async () => body } as Response;
  }) as unknown as typeof fetch;
});

describe("propiedad → Abrir operación", () => {
  it("la ficha enlaza a /realtor/operaciones con la propiedad precargada y sin tenant", async () => {
    render(<PropiedadesPanel />);
    await screen.findByTestId("propiedades-panel");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("property-row"));
    const link = await screen.findByRole("link", { name: "Abrir operación" });
    const href = link.getAttribute("href") ?? "";
    expect(href).toBe(`/realtor/operaciones?property_id=${PID}`);
    expect(href).not.toMatch(/tenant/i);
  });
});
