import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CargaManual } from "@/components/realtor/property-intel/CargaManual";

const mockApiFetch = jest.fn();
const mockAuth = jest.fn((): Record<string, string> => ({ Authorization: "Bearer t" }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => mockAuth() }));

const P = "0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
const BASE = "/api/v1/realestate/property-intel";
const res = (status: number, body?: unknown) => ({ ok: status < 300, status, json: async () => body });
const COMP = { id: "c1", property_id: P, name: "SYNTH Tower", address: "SYNTH 1 Ave", developer: "SYNTH Dev", price_from_amount: "650000.00",
  price_currency: "USD", units: 120, floors: 30, delivery: "2027-Q4", source_url: "https://example.com/a", evidence_tier: "observado",
  source_method: "csv", observed_at: "2026-10-20T12:00:00+00:00" };
const OBS = { id: "o1", property_id: P, competitor_project_id: "c1", kind: "incentive", description: "10% en firma", value_amount: null,
  value_currency: null, source_ref: "Folleto v3 p.4", source_url: null, evidence_tier: "observado", source_method: "manual",
  observed_at: "2026-10-18T00:00:00+00:00" };

/** GET por URL; POST devuelve lo que diga `post`. */
function api(get: Record<string, ReturnType<typeof res>>, post = res(201, {})) {
  mockApiFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") return post;
    const hit = Object.keys(get).find((k) => url.startsWith(k));
    return hit ? get[hit] : res(500);
  });
}
const lists = (c: unknown[], o: unknown[]) => ({ [`${BASE}/properties/${P}/competitor-projects`]: res(200, { data: c }), [`${BASE}/properties/${P}/observations`]: res(200, { data: o }) });
beforeEach(() => { mockApiFetch.mockReset(); mockAuth.mockReturnValue({ Authorization: "Bearer t" }); });

it("muestra competidores y observaciones con su procedencia (observado, fuente y fecha)", async () => {
  api(lists([COMP], [OBS]));
  render(<CargaManual propertyId={P} />);
  const row = await screen.findByTestId("pi-comp-row");
  expect(row).toHaveTextContent("SYNTH Tower");
  expect(row).toHaveTextContent("SYNTH Dev");
  expect(row).toHaveTextContent("650,000 USD");
  expect(row).toHaveTextContent("120 unidades · 30 pisos · entrega 2027-Q4");
  expect(row).toHaveTextContent("Observado · 2026-10-20 · CSV");
  expect(screen.getByRole("link", { name: "Fuente de SYNTH Tower" })).toHaveAttribute("href", "https://example.com/a");
  const obs = screen.getByTestId("pi-obs-row");
  expect(obs).toHaveTextContent("Incentivo · SYNTH Tower");
  expect(obs).toHaveTextContent("Folleto v3 p.4");
  expect(obs).toHaveTextContent("Observado · 2026-10-18 · manual");
});

it("vacío: lo dice; 404 oculta la sección; sin sesión no llama", async () => {
  api(lists([], []));
  const { unmount } = render(<CargaManual propertyId={P} />);
  expect(await screen.findByTestId("pi-comp-empty")).toBeInTheDocument();
  expect(screen.getByTestId("pi-obs-empty")).toBeInTheDocument();
  unmount();
  mockApiFetch.mockClear();
  api({ [`${BASE}/properties/${P}/competitor-projects`]: res(404), [`${BASE}/properties/${P}/observations`]: res(404) });
  const { container, unmount: u2 } = render(<CargaManual propertyId={P} />);
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(container.querySelector("[data-testid=pi-carga]")).toBeNull());
  u2();
  mockApiFetch.mockReset();
  mockAuth.mockReturnValue({});
  render(<CargaManual propertyId={P} />);
  expect(await screen.findByTestId("pi-comp-msg")).toHaveAttribute("data-state", "session_expired");
  expect(mockApiFetch).not.toHaveBeenCalled();
});

it("alta manual: envía los campos con property_id, sin tenant ni evidence_tier, y recarga", async () => {
  api(lists([], []));
  render(<CargaManual propertyId={P} />);
  await screen.findByTestId("pi-comp-empty");
  const set = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
  set("Nombre", "SYNTH Bay"); set("Dirección", "SYNTH 2 St"); set("Desarrollador", "SYNTH Dev 2"); set("Precio desde", "500000");
  set("Unidades", "80"); set("Pisos", "20"); set("Entrega", "2028"); set("URL de la fuente", "https://example.com/b"); set("Fecha de observación", "2026-10-19");
  fireEvent.click(screen.getByRole("button", { name: "Guardar competidor" }));
  await waitFor(() => expect(mockApiFetch.mock.calls.some(([u, i]) => u === `${BASE}/competitor-projects` && i?.method === "POST")).toBe(true));
  const [, init] = mockApiFetch.mock.calls.find(([u, i]) => u === `${BASE}/competitor-projects` && i?.method === "POST")!;
  const body = JSON.parse(init.body);
  expect(body).toEqual({ property_id: P, name: "SYNTH Bay", address: "SYNTH 2 St", developer: "SYNTH Dev 2", price_from_amount: "500000",
    price_currency: "USD", units: 80, floors: 20, delivery: "2028", source_url: "https://example.com/b", observed_at: "2026-10-19T12:00:00Z" });
  expect(Object.keys(body).some((k) => /tenant|evidence_tier|captured_by|source_method/.test(k))).toBe(false);
  await waitFor(() => expect(mockApiFetch.mock.calls.filter(([, i]) => i?.method !== "POST").length).toBe(4));
});

it("sin URL de la fuente no envía; CSV va como text/csv al import y un 422 muestra las filas malas", async () => {
  api(lists([], []), res(422, { detail: { code: "CSV_INVALIDO", errors: [{ row: 4, msg: "source_url: Field required" }] } }));
  render(<CargaManual propertyId={P} />);
  await screen.findByTestId("pi-comp-empty");
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "X" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar competidor" }));
  expect(await screen.findByTestId("pi-comp-form-error")).toHaveTextContent("URL de la fuente");
  expect(mockApiFetch.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
  const csv = "name,address,source_url,observed_at\nA,B,,2026-10-19T00:00:00Z\n";
  fireEvent.change(screen.getByLabelText("CSV de competidores"), { target: { value: csv } });
  fireEvent.click(screen.getByRole("button", { name: "Importar competidores" }));
  expect(await screen.findByTestId("pi-csv-errors")).toHaveTextContent("Fila 4: source_url: Field required");
  const [url, init] = mockApiFetch.mock.calls.find(([, i]) => i?.method === "POST")!;
  expect(url).toBe(`${BASE}/properties/${P}/competitor-projects/import`);
  expect(new Headers(init.headers).get("Content-Type")).toBe("text/csv");
  expect(init.body).toBe(csv);
});

it("observación manual exige referencia de la fuente y envía kind y competidor", async () => {
  api(lists([COMP], []));
  render(<CargaManual propertyId={P} />);
  await screen.findByTestId("pi-comp-row");
  fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Vendido el 40%" } });
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "availability" } });
  fireEvent.change(screen.getByLabelText("Competidor"), { target: { value: "c1" } });
  fireEvent.change(screen.getByLabelText("Fecha de la observación"), { target: { value: "2026-10-17" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar observación" }));
  expect(await screen.findByTestId("pi-obs-form-error")).toHaveTextContent("Referencia de la fuente");
  fireEvent.change(screen.getByLabelText("Referencia de la fuente"), { target: { value: "Llamada a la sala de ventas" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar observación" }));
  await waitFor(() => expect(mockApiFetch.mock.calls.some(([u]) => u === `${BASE}/observations`)).toBe(true));
  const body = JSON.parse(mockApiFetch.mock.calls.find(([u]) => u === `${BASE}/observations`)![1].body);
  expect(body).toEqual({ property_id: P, kind: "availability", description: "Vendido el 40%", competitor_project_id: "c1",
    source_ref: "Llamada a la sala de ventas", observed_at: "2026-10-17T12:00:00Z" });
});
