import { render, screen, within } from "@testing-library/react";
import { FuentesZona } from "@/components/realtor/property-intel/FuentesZona";

const mockApiFetch = jest.fn();
const mockAuth = jest.fn((): Record<string, string> => ({ Authorization: "Bearer t" }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => mockAuth() }));

const P = "0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
const B = `/api/v1/realestate/property-intel/properties/${P}/sources`;
const res = (status: number, body?: unknown) => ({ ok: status < 300, status, json: async () => body });
const base = { detail: null, values: {}, geo: {}, window: {}, uncertainty: null, provenance: {} };
const ACS = { ...base, source: "us_census_acs5", provider_status: "configured", data_status: "HISTORICAL", unavailable_reason: null,
  evidence_tier: "estimado", geo: { zcta: "33137" }, window: { label: "ACS 2019-2023 (5 anos)" }, uncertainty: "estimacion de encuesta; moe al 90%",
  provenance: { provider: "U.S. Census Bureau", year: 2023 },
  values: { population: { estimate: 21000, moe: 900 }, median_household_income: { estimate: 85000, moe: 5000 }, median_gross_rent: { estimate: null, moe: null } } };
const PERM = { ...base, source: "city_of_miami_building_permits", provider_status: "not_configured", data_status: "UNAVAILABLE",
  unavailable_reason: "provider_not_configured", evidence_tier: "observado", detail: "Falta MIAMI_PERMITS_QUERY_URL (https) o MIAMI_PERMITS_DATE_FIELD." };
const DOR = { ...base, source: "florida_dor_nal_sdf", provider_status: "configured", data_status: "HISTORICAL", unavailable_reason: null,
  evidence_tier: "observado", geo: { zip5: "33137" }, provenance: { provider: "Florida Department of Revenue", roll_year: 2025 },
  values: { roll_year: 2025, parcels: 1200, residential_units: 3400, median_just_value: 510000, sales_24m: 180, median_sale_price_24m: 615000 } };

function api(m: Record<string, ReturnType<typeof res>>) {
  mockApiFetch.mockImplementation(async (url: string) => m[url.split("?")[0]] ?? res(500));
}
beforeEach(() => { mockApiFetch.mockReset(); mockAuth.mockReturnValue({ Authorization: "Bearer t" }); });

it("pinta cada fuente con su estado, cifras, margen y procedencia; UNAVAILABLE con su motivo", async () => {
  api({ [`${B}/acs`]: res(200, ACS), [`${B}/miami-permits`]: res(200, PERM), [`${B}/dor`]: res(200, DOR) });
  render(<FuentesZona propertyId={P} />);
  const acs = await screen.findByTestId("pi-src-us_census_acs5");
  expect(acs).toHaveAttribute("data-status", "HISTORICAL");
  expect(acs).toHaveTextContent("Población21,000 ± 900");
  expect(acs).toHaveTextContent("Ingreso mediano del hogar85,000 ± 5,000");
  expect(acs).toHaveTextContent("Renta bruta mediana—");
  expect(acs).toHaveTextContent("Estimado · U.S. Census Bureau 2023 · ZCTA 33137");
  const perm = await screen.findByTestId("pi-src-city_of_miami_building_permits");
  expect(perm).toHaveAttribute("data-status", "UNAVAILABLE");
  expect(within(perm).getByTestId("pi-src-reason")).toHaveTextContent("No configurado · Falta MIAMI_PERMITS_QUERY_URL");
  const dor = await screen.findByTestId("pi-src-florida_dor_nal_sdf");
  expect(dor).toHaveTextContent("Mediana del valor justo510,000 USD");
  expect(dor).toHaveTextContent("Ventas (24 meses)180");
  expect(screen.queryByText(/DEMO/)).toBeNull();
});

it("permisos LIVE: área medida, reparto por ScopeofWork, obra nueva por coste y atribución CC BY 4.0", async () => {
  const live = { ...PERM, provider_status: "configured", data_status: "LIVE", unavailable_reason: null, detail: null,
    geo: { area: "Edgewater", envelope: [-80.1935, 25.7935, -80.183, 25.811] }, window: { start: "2025-10-20", end: "2026-10-20" },
    provenance: { provider: "City of Miami Open Data", attribution: "City of Miami (CC BY 4.0)" },
    values: { permits_issued: 1082, scope_of_work: [{ scope: "SYNTH REPAIR", count: 900 }, { scope: "SYNTH NEW", count: 40 }],
      new_construction: { scopes: ["SYNTH NEW"], count: 40, top_by_cost: [{ permit_number: "BD-SYNTH-1", scope_of_work: "SYNTH NEW",
        property_type: "SYNTH", total_cost: 90000000, issued_date: "2026-01-01", status: "SYNTH" }] } } };
  api({ [`${B}/acs`]: res(200, ACS), [`${B}/miami-permits`]: res(200, live), [`${B}/dor`]: res(200, DOR) });
  render(<FuentesZona propertyId={P} />);
  const perm = await screen.findByTestId("pi-src-city_of_miami_building_permits");
  expect(perm).toHaveTextContent("Permisos emitidos (12 meses)1,082");
  expect(perm).toHaveTextContent("Edgewater · 2025-10-20 → 2026-10-20");
  expect(perm).toHaveTextContent("City of Miami (CC BY 4.0)");
  expect(within(perm).getAllByTestId("pi-src-scope").map((n) => n.textContent)).toEqual(["SYNTH REPAIR · 900", "SYNTH NEW · 40"]);
  expect(within(perm).getByTestId("pi-src-new-count")).toHaveTextContent("Obra nueva (SYNTH NEW): 40");
  expect(within(perm).getByTestId("pi-src-new-row")).toHaveTextContent("BD-SYNTH-1 · SYNTH NEW · 90,000,000 USD · 2026-01-01 · SYNTH");
});

it("permisos sin filtro de obra nueva: lo dice, sin inventar la lista", async () => {
  const live = { ...PERM, provider_status: "configured", data_status: "LIVE", unavailable_reason: null,
    detail: "Sin MIAMI_PERMITS_NEW_WORK_SCOPES: elige en scope_of_work los valores de obra nueva.",
    geo: { area: "Edgewater" }, provenance: { attribution: "City of Miami (CC BY 4.0)" },
    values: { permits_issued: 10, scope_of_work: [], new_construction: null } };
  api({ [`${B}/acs`]: res(200, ACS), [`${B}/miami-permits`]: res(200, live), [`${B}/dor`]: res(200, DOR) });
  render(<FuentesZona propertyId={P} />);
  const perm = await screen.findByTestId("pi-src-city_of_miami_building_permits");
  expect(perm).toHaveTextContent("Sin MIAMI_PERMITS_NEW_WORK_SCOPES");
  expect(within(perm).queryByTestId("pi-src-new-row")).toBeNull();
});

it("respuesta sin sobre válido o error HTTP → no se inventa nada; 404 oculta; sin sesión no llama", async () => {
  api({ [`${B}/acs`]: res(200, { data_status: "LIVE" }), [`${B}/miami-permits`]: res(503), [`${B}/dor`]: res(404) });
  const { unmount } = render(<FuentesZona propertyId={P} />);
  expect(await screen.findByTestId("pi-src-msg-acs")).toHaveTextContent("No se pudo leer");
  expect(await screen.findByTestId("pi-src-msg-miami-permits")).toHaveTextContent("Servicio no disponible");
  expect(screen.queryByTestId("pi-src-msg-dor")).toBeNull();
  unmount();
  mockApiFetch.mockReset();
  mockAuth.mockReturnValue({});
  render(<FuentesZona propertyId={P} />);
  expect((await screen.findAllByText("Tu sesión terminó. Vuelve a entrar.")).length).toBe(3);
  expect(mockApiFetch).not.toHaveBeenCalled();
});
