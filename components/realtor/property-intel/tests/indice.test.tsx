import { fireEvent, render, screen } from "@testing-library/react";
import PropertyIntelIndexPage from "@/app/realtor/property-intel/page";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const mockApiFetch = jest.fn();
const mockAuth = jest.fn((): Record<string, string> => ({}));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => mockAuth() }));

const ID = "0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
const P2 = "1c0a7e4f-2b3c-4d5e-9f60-718293a4b5c6";
const res = (status: number, body?: unknown) => ({ ok: status < 300, status, json: async () => body });
beforeEach(() => { push.mockReset(); mockApiFetch.mockReset(); mockAuth.mockReset(); mockAuth.mockReturnValue({}); });

it("(a) la página índice renderiza pi-index", () => {
  render(<PropertyIntelIndexPage />);
  expect(screen.getByTestId("pi-index")).toBeInTheDocument();
});

it("(b) UUID válido navega, a propiedad y a unidad", () => {
  render(<PropertyIntelIndexPage />);
  fireEvent.change(screen.getByLabelText("Identificador"), { target: { value: ID } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar propiedad" }));
  expect(push).toHaveBeenCalledWith(`/realtor/property-intel/${ID}`);
  fireEvent.click(screen.getByRole("button", { name: "Buscar unidad" }));
  expect(push).toHaveBeenCalledWith(`/realtor/property-intel/${ID}?unit=${ID}`);
});

it("(b) id no UUID: «Identificador no válido», sin navegar ni llamar a la API", () => {
  render(<PropertyIntelIndexPage />);
  fireEvent.change(screen.getByLabelText("Identificador"), { target: { value: "abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar propiedad" }));
  expect(screen.getByText("Identificador no válido")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
  expect(mockApiFetch).not.toHaveBeenCalled();
});

describe("PI-VISIBLE: índice con las propiedades del tenant", () => {
  it("lista cada propiedad con su dirección (hasta zona) y enlace a su ficha; sin tenant en la petición", async () => {
    mockAuth.mockReturnValue({ Authorization: "Bearer t" });
    mockApiFetch.mockResolvedValue(res(200, { items: [
      { id: ID, address: { country: "US", region: "FL", city: "Miami", zone: "Edgewater" }, jurisdiction: "US-FL", property_type: "condo", unit_count: 3, owner: null, created_at: "2026-10-01T00:00:00Z" },
      { id: P2, address: { country: "US", city: "Miami" }, jurisdiction: "US-FL", property_type: "land", unit_count: 0, owner: null, created_at: "2026-10-02T00:00:00Z" },
      { id: "no-uuid", address: { country: "US" }, property_type: "condo", unit_count: 1 },
    ], next_cursor: null }));
    render(<PropertyIntelIndexPage />);
    const rows = await screen.findAllByTestId("pi-index-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Edgewater, Miami, FL, US");
    expect(rows[0]).toHaveTextContent("3 unidades");
    expect(screen.getAllByRole("link", { name: /Abrir ficha/ }).map((a) => a.getAttribute("href")))
      .toEqual([`/realtor/property-intel/${ID}`, `/realtor/property-intel/${P2}`]);
    const [url] = mockApiFetch.mock.calls[0] as [string];
    expect(url).toMatch(/^\/api\/v1\/realestate\/properties\?/);
    expect(url).not.toMatch(/tenant/i);
  });

  it("vacío: lo dice, sin filas inventadas", async () => {
    mockAuth.mockReturnValue({ Authorization: "Bearer t" });
    mockApiFetch.mockResolvedValue(res(200, { items: [], next_cursor: null }));
    render(<PropertyIntelIndexPage />);
    expect(await screen.findByTestId("pi-index-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("pi-index-row")).toBeNull();
  });

  it("sin sesión no llama y pide entrar", async () => {
    render(<PropertyIntelIndexPage />);
    expect(await screen.findByTestId("pi-index-msg")).toHaveAttribute("data-state", "session_expired");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("503 → servicio no disponible, sin filas", async () => {
    mockAuth.mockReturnValue({ Authorization: "Bearer t" });
    mockApiFetch.mockResolvedValue(res(503));
    render(<PropertyIntelIndexPage />);
    expect(await screen.findByTestId("pi-index-msg")).toHaveAttribute("data-state", "service_unavailable");
    expect(screen.queryByTestId("pi-index-row")).toBeNull();
  });

  it("sigue next_cursor", async () => {
    mockAuth.mockReturnValue({ Authorization: "Bearer t" });
    mockApiFetch
      .mockResolvedValueOnce(res(200, { items: [{ id: ID, address: { country: "US" }, property_type: "condo", unit_count: 1 }], next_cursor: "c2" }))
      .mockResolvedValueOnce(res(200, { items: [{ id: P2, address: { country: "US" }, property_type: "house", unit_count: 1 }], next_cursor: null }));
    render(<PropertyIntelIndexPage />);
    expect(await screen.findAllByTestId("pi-index-row")).toHaveLength(2);
    expect(String(mockApiFetch.mock.calls[1][0])).toContain("cursor=c2");
  });
});
