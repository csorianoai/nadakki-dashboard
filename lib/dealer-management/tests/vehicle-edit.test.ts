/**
 * Edicion P2: que se manda, que no, y que publicar va SOLO con `status`.
 */
import type { DealerVehicleStatusRow } from "@/lib/dealer/vehicle-status";
import { parseDealerVehicleStatus } from "@/lib/dealer/vehicle-status";
import {
  ESTADOS_PUBLICABLES,
  cambiosDeEdicion,
  formDeFicha,
  guardarEdicion,
  pasarADisponible,
  validarEdicion,
} from "@/lib/dealer-management/vehicle-edit";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const CONTEXT = { tenantId: "t-a", dealerId: "d-a", organizationUnitId: null };

const FICHA = parseDealerVehicleStatus(
  {
    id: "v-1",
    dealer_id: "d-a",
    make: "Toyota",
    model: "Hilux",
    year: 2021,
    status: "draft",
    price_amount: 18500000.5,
    price_currency: "ARS",
    display_price_amount: null,
    display_price_currency: null,
    plate: "AB123CD",
    plate_country: "AR",
    stock_number: "S-1",
    price_rd: null,
    price_usd: null,
  },
  "d-a",
) as DealerVehicleStatusRow;

const ORIGINAL = formDeFicha(FICHA);

describe("lectura de la ficha", () => {
  it("lee los campos P2; el importe numerico se guarda como texto", () => {
    expect(FICHA).toMatchObject({ price_amount: "18500000.5", price_currency: "ARS", plate: "AB123CD", stock_number: "S-1" });
    expect(ORIGINAL.price_amount).toBe("18500000.5");
  });
});

describe("cambiosDeEdicion", () => {
  it("sin cambios no manda nada (y el mismo importe escrito de otra forma no cuenta)", () => {
    expect(cambiosDeEdicion(ORIGINAL, ORIGINAL)).toEqual({});
    expect(cambiosDeEdicion({ ...ORIGINAL, price_amount: "18.500.000,50" }, ORIGINAL)).toEqual({});
  });

  it("solo manda lo que cambio, con los nombres del contrato", () => {
    expect(cambiosDeEdicion({ ...ORIGINAL, price_amount: "19900000" }, ORIGINAL)).toEqual({ price_amount: "19900000" });
    expect(cambiosDeEdicion({ ...ORIGINAL, stock_number: "S-2" }, ORIGINAL)).toEqual({ stock_number: "S-2" });
  });

  it("una pareja viaja entera aunque cambie una sola mitad", () => {
    expect(cambiosDeEdicion({ ...ORIGINAL, plate_country: "uy" }, ORIGINAL)).toEqual({ plate: "AB123CD", plate_country: "UY" });
    expect(
      cambiosDeEdicion({ ...ORIGINAL, display_price_amount: "15000", display_price_currency: "usd" }, ORIGINAL),
    ).toEqual({ display_price_amount: "15000", display_price_currency: "USD" });
  });

  it("nunca manda la moneda oficial ni los precios deprecados", () => {
    const body = cambiosDeEdicion({ ...ORIGINAL, price_amount: "1" }, ORIGINAL);
    for (const k of ["price_currency", "price_rd", "price_usd", "status"]) expect(body).not.toHaveProperty(k);
  });
});

describe("validarEdicion", () => {
  it("lo ya cargado no se puede borrar: el contrato no lo admite", () => {
    const errors = validarEdicion({ ...ORIGINAL, price_amount: "", stock_number: "" }, ORIGINAL, "ARS");
    expect(errors.price_amount).toMatch(/no se puede dejar vacío/);
    expect(errors.stock_number).toMatch(/no se puede dejar vacío/);
  });

  it("aplica las reglas del alta (referencia en otra moneda)", () => {
    const errors = validarEdicion({ ...ORIGINAL, display_price_amount: "1", display_price_currency: "ARS" }, ORIGINAL, "ARS");
    expect(errors.display_price_currency).toMatch(/otra moneda/);
  });
});

describe("PATCH", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as unknown as Response);
  });

  it("guardar va por la ruta del contrato con la clave de idempotencia", async () => {
    await guardarEdicion(CONTEXT, "v-1", { price_amount: "1" }, "k-1");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/t-a/dealers/d-a/vehicles/v-1");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body))).toEqual({ price_amount: "1" });
    expect((init?.headers as Record<string, string>)["Idempotency-Key"]).toBe("k-1");
  });

  it("publicar manda SOLO status: el backend no lo combina con otros campos", async () => {
    await pasarADisponible(CONTEXT, "v-1");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ status: "disponible" });
  });

  it("un 422 con motivo se propaga con su reason_code", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: { reason_code: "STOCK_NUMBER_TAKEN" } }),
    } as unknown as Response);
    await expect(guardarEdicion(CONTEXT, "v-1", { stock_number: "S-9" })).rejects.toMatchObject({ status: 422, reason_code: "STOCK_NUMBER_TAKEN" });
  });

  it("solo BORRADOR y ARCHIVADO pasan a DISPONIBLE (mapa del backend)", () => {
    expect([...ESTADOS_PUBLICABLES].sort()).toEqual(["archivado", "draft"]);
  });
});
