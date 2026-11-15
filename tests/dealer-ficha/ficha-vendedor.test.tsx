/**
 * @jest-environment jsdom
 *
 * F4D-4 PARTE 2/2: el vendedor de la compra se pinta como contacto (GET /api/v1/autos/contacts/{id}).
 * Solo con autos.costs.view; DNI/CUIT tal como llegan; enlace a /autos/dealer/contactos; cache sin fuga entre usuarios.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("next/navigation", () => ({ useParams: () => ({ vehicleId: "veh-1" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const compra = (seller: string | null) => ({
  vehicle_id: "veh-1",
  cost: { currency: "USD", amount: "1000.00", paid_total: "1000.00" },
  acquisition: { mode: "compra_directa", acquired_on: "2026-11-01", seller_contact_id: seller },
  payments: [{ id: "p1", method: "efectivo", amount: "1000.00", currency: "USD", voided: false }],
});
const CONTACTO = { id: "c-9", kind: "person", display_name: "Ana Pérez", dni: "***.***.678", cuit: null };

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (sub: string) => `${b64({ alg: "none" })}.${b64({ sub, exp: 9999999999 })}.x`;

type Opts = { costsView?: boolean; seller?: string | null; contact?: { status: number; body: unknown } | "colgar" };

function mockRed(opts: Opts = {}) {
  const res = (status: number, body: unknown) => ({ ok: status < 300, status, json: async () => body });
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/entitlements/batch")) {
      return res(200, { results: { "autos.costs.view": { allowed: opts.costsView ?? true, reason_code: "ALLOWED" }, "autos.inventory.list": { allowed: true, reason_code: "ALLOWED" } } });
    }
    if (url.includes("/vehicles/veh-1/purchase")) {
      return opts.costsView === false ? res(403, { detail: "denied" }) : res(200, compra(opts.seller === undefined ? "c-9" : opts.seller));
    }
    if (url.includes("/api/v1/autos/contacts/")) {
      if (opts.contact === "colgar") return new Promise(() => {});
      const c = opts.contact ?? { status: 200, body: CONTACTO };
      return res(c.status, c.body);
    }
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles/veh-1")) return res(200, { id: "veh-1", dealer_id: "dealer-a", make: "Toyota", model: "Hilux", year: 2021, status: "disponible" });
    if (url.includes("/margin")) return res(200, []);
    if (url.includes("/days")) return res(200, { acquired_at: "2026-11-01T00:00:00Z", days_in_inventory: 1 });
    return res(404, {});
  }) as unknown as typeof fetch;
}

function montar(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return render(<DealerVehicleEconomicsPage />, { wrapper: Wrapper });
}

const urls = () => (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
});

test("con compra y vendedor: nombre, DNI tal como llega y enlace a contactos", async () => {
  mockRed();
  montar();
  const v = await screen.findByTestId("ficha-vendedor");
  await waitFor(() => expect(v).toHaveTextContent("Ana Pérez"));
  expect(v).toHaveTextContent("***.***.678");
  expect(screen.getByTestId("vendedor-enlace")).toHaveAttribute("href", expect.stringContaining("/autos/dealer/contactos"));
  expect(urls().some((u) => u.includes("/api/v1/autos/contacts/c-9"))).toBe(true);
  expect(v).not.toHaveTextContent(/Disponible cuando/);
});

test("con 403 la seccion del vendedor no esta en el DOM ni se pide el contacto", async () => {
  mockRed({ costsView: false });
  montar();
  expect(await screen.findByTestId("dealer-vehicle-ready")).toBeInTheDocument();
  expect(screen.queryByTestId("ficha-vendedor")).not.toBeInTheDocument();
  expect(urls().some((u) => u.includes("/autos/contacts/"))).toBe(false);
});

test("sin vendedor en la compra: 'Sin vendedor registrado' y sin pedir contacto", async () => {
  mockRed({ seller: null });
  montar();
  expect(await screen.findByTestId("vendedor-sin-registro")).toHaveTextContent("Sin vendedor registrado");
  expect(urls().some((u) => u.includes("/autos/contacts/"))).toBe(false);
});

test("error del contacto: aviso con Reintentar que vuelve a pedirlo", async () => {
  mockRed({ contact: { status: 500, body: {} } });
  montar();
  const err = await screen.findByTestId("vendedor-error");
  expect(err).toHaveTextContent("Reintentar");
  const antes = urls().filter((u) => u.includes("/autos/contacts/")).length;
  fireEvent.click(screen.getByRole("button", { name: "Reintentar", description: undefined }) as HTMLElement);
  await waitFor(() => expect(urls().filter((u) => u.includes("/autos/contacts/")).length).toBeGreaterThan(antes));
});

test("el segundo usuario no recibe el contacto en cache del primero", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockRed();
  tokenStorage.setTokens({ accessToken: jwt("user-1"), refreshToken: "r1" });
  const a = montar(client);
  await waitFor(() => expect(screen.getByTestId("ficha-vendedor")).toHaveTextContent("Ana Pérez"));
  a.unmount();
  mockRed({ contact: "colgar" });
  tokenStorage.setTokens({ accessToken: jwt("user-2"), refreshToken: "r2" });
  montar(client);
  await waitFor(() => expect(urls().filter((u) => u.includes("/autos/contacts/")).length).toBe(1));
  expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
});
