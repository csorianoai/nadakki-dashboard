/**
 * Contrato del alta y la edicion manual de vehiculos.
 *
 * Lo que se prueba es justo lo que se puede perder en silencio: que el payload
 * no lleve campos que el contrato no acepta, que los precios con moneda
 * incrustada no viajen mientras P-B no este en main, que `status` no se mezcle
 * con los campos materiales, y que la moneda del label venga del tenant.
 */
import {
  PENDING_FIELD_NOTE,
  VEHICLE_CONDITIONS,
  VEHICLE_FORM_EMPTY,
  VEHICLE_INITIAL_STATUS,
  VEHICLE_PATCHABLE_FIELDS,
  VEHICLE_PENDING_FIELDS,
  VEHICLE_STATUS_LABEL,
  VEHICLE_WRITE_CAPABILITY,
  createVehicleManual,
  motivoBloqueoDisponible,
  patchVehicleStatus,
  validateVehicleForm,
  vehicleCreatePayload,
  vehicleIdFrom,
  vehiclePatchPayload,
  vehiclePriceFields,
  vehicleStatusPayload,
} from "@/lib/dealer-management/vehicle-manual";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(),
}));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const CONTEXT = { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" };

const COMPLETO = {
  ...VEHICLE_FORM_EMPTY,
  make: " Toyota ",
  model: " Hilux ",
  year: " 2021 ",
  trim: " SRV ",
  vin: "1HGBH41JXMN109186",
  mileage_km: " 48000 ",
  condition: "used",
  fuel_type: "diesel",
  transmission: "automatica",
  drivetrain: "4x4",
  body_type: "pickup",
  exterior_color: "blanco",
  interior_color: "negro",
  province: "Buenos Aires",
  municipality: "La Plata",
  description: " Unico dueno ",
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("capability y estado inicial", () => {
  it("usa una clave del catalogo 097 y no una inventada", () => {
    expect(MIGRATION_097_CAPABILITY_KEYS.has(VEHICLE_WRITE_CAPABILITY)).toBe(true);
  });

  it("el alta nace en BORRADOR y el label no se escribe a mano en la pantalla", () => {
    expect(VEHICLE_INITIAL_STATUS).toBe("draft");
    expect(VEHICLE_STATUS_LABEL[VEHICLE_INITIAL_STATUS]).toBe("BORRADOR");
  });
});

describe("vehicleCreatePayload", () => {
  it("recorta, tipa y omite los opcionales vacios", () => {
    expect(vehicleCreatePayload({ ...VEHICLE_FORM_EMPTY, make: "Fiat", model: "Cronos", year: "2020" })).toEqual({
      make: "Fiat",
      model: "Cronos",
      year: 2020,
      condition: "used",
    });
  });

  it("envia los campos del contrato con el tipo que el contrato pide", () => {
    const payload = vehicleCreatePayload(COMPLETO);
    expect(payload.make).toBe("Toyota");
    expect(payload.model).toBe("Hilux");
    expect(payload.year).toBe(2021);
    expect(payload.mileage_km).toBe(48000);
    expect(payload.trim).toBe("SRV");
    expect(payload.description).toBe("Unico dueno");
  });

  it("no serializa ningun precio mientras el contrato lo llame price_rd", () => {
    const keys = Object.keys(vehicleCreatePayload(COMPLETO));
    expect(keys).not.toContain("price_rd");
    expect(keys).not.toContain("price_usd");
    expect(keys).not.toContain("price_functional");
    expect(keys).not.toContain("price_reference_usd");
  });

  it("no inventa los campos que el contrato no expone", () => {
    const keys = Object.keys(vehicleCreatePayload(COMPLETO));
    for (const field of VEHICLE_PENDING_FIELDS) expect(keys).not.toContain(field.name);
    expect(keys).not.toContain("status");
  });
});

describe("validateVehicleForm", () => {
  it("exige marca, modelo y ano", () => {
    const errors = validateVehicleForm(VEHICLE_FORM_EMPTY);
    expect(errors.make).toBeDefined();
    expect(errors.model).toBeDefined();
    expect(errors.year).toBeDefined();
  });

  it("acepta el formulario completo sin errores", () => {
    expect(validateVehicleForm(COMPLETO)).toEqual({});
  });

  it("rechaza ano fuera del rango del contrato", () => {
    expect(validateVehicleForm({ ...COMPLETO, year: "1899" }).year).toBeDefined();
    expect(validateVehicleForm({ ...COMPLETO, year: "2051" }).year).toBeDefined();
    expect(validateVehicleForm({ ...COMPLETO, year: "2021.5" }).year).toBeDefined();
  });

  it("acepta VIN vacio y rechaza uno que no tenga 17", () => {
    expect(validateVehicleForm({ ...COMPLETO, vin: "" }).vin).toBeUndefined();
    expect(validateVehicleForm({ ...COMPLETO, vin: "ABC" }).vin).toBeDefined();
  });

  it("rechaza kilometros negativos o por encima del maximo", () => {
    expect(validateVehicleForm({ ...COMPLETO, mileage_km: "-1" }).mileage_km).toBeDefined();
    expect(validateVehicleForm({ ...COMPLETO, mileage_km: "2000001" }).mileage_km).toBeDefined();
    expect(validateVehicleForm({ ...COMPLETO, mileage_km: "" }).mileage_km).toBeUndefined();
  });

  it("solo admite las condiciones del enum del contrato", () => {
    expect(VEHICLE_CONDITIONS.map((item) => item.value)).toEqual(["used", "new"]);
    expect(validateVehicleForm({ ...COMPLETO, condition: "seminuevo" }).condition).toBeDefined();
  });

  it("corta en el maximo declarado por el contrato", () => {
    expect(validateVehicleForm({ ...COMPLETO, make: "x".repeat(51) }).make).toBeDefined();
    expect(validateVehicleForm({ ...COMPLETO, province: "x".repeat(101) }).province).toBeDefined();
  });
});

describe("vehiclePriceFields", () => {
  it("toma la moneda del tenant y nunca la escribe a mano", () => {
    const [oficial] = vehiclePriceFields("ARS");
    expect(oficial.label).toBe("Precio (ARS)");
    expect(vehiclePriceFields("USD")[0].label).toBe("Precio (USD)");
  });

  it("sin moneda del tenant no inventa una", () => {
    const [oficial] = vehiclePriceFields(null);
    expect(oficial.label).not.toMatch(/ARS|US\$|RD\$/);
  });

  it("la referencia dice que la contabilidad usa el precio en pesos", () => {
    const referencia = vehiclePriceFields("ARS")[1];
    expect(referencia.label).toBe("Precio de referencia (US$)");
    expect(referencia.ayuda).toContain("la contabilidad usa el precio en pesos");
  });

  it("los campos pendientes se anuncian como Proximamente", () => {
    expect(PENDING_FIELD_NOTE).toBe("Próximamente");
    expect(VEHICLE_PENDING_FIELDS.map((field) => field.label)).toEqual([
      "Dominio",
      "Número de stock",
      "Puertas",
      "Cilindrada",
      "Cilindros",
    ]);
  });
});

describe("PATCH", () => {
  it("solo manda los campos materiales que el contrato acepta", () => {
    const payload = vehiclePatchPayload(COMPLETO);
    expect(Object.keys(payload).sort()).toEqual([...VEHICLE_PATCHABLE_FIELDS].sort());
    expect(payload.mileage_km).toBe(48000);
  });

  it("no mezcla status con los campos materiales", () => {
    expect(vehiclePatchPayload(COMPLETO).status).toBeUndefined();
    expect(vehicleStatusPayload("disponible")).toEqual({ status: "disponible" });
  });

  it("no filtra make, model ni year por una via que no los acepta", () => {
    const keys = Object.keys(vehiclePatchPayload(COMPLETO));
    expect(keys).not.toContain("make");
    expect(keys).not.toContain("model");
    expect(keys).not.toContain("year");
    expect(keys).not.toContain("vin");
  });
});

describe("motivoBloqueoDisponible", () => {
  it("sin precio oficial no deja pasar a DISPONIBLE", () => {
    expect(motivoBloqueoDisponible(null)).toBe("FALTA_PRECIO_OFICIAL");
  });

  it("un precio no positivo tampoco alcanza", () => {
    expect(motivoBloqueoDisponible(0)).toBe("PRECIO_NO_VALIDO");
    expect(motivoBloqueoDisponible(-5)).toBe("PRECIO_NO_VALIDO");
  });

  it("con precio oficial positivo no hay bloqueo del frontend", () => {
    expect(motivoBloqueoDisponible(38_500_000)).toBeNull();
  });
});

describe("clientes HTTP", () => {
  beforeEach(() => fetchMock.mockReset());

  it("crea por la ruta de tenant+dealer con los headers de contexto", async () => {
    fetchMock.mockResolvedValue(ok({ id: "veh-9" }));
    const body = await createVehicleManual(CONTEXT, COMPLETO, "key-1");
    expect(vehicleIdFrom(body)).toBe("veh-9");

    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/tenant-a/dealers/dealer-a/vehicles");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Tenant-ID"]).toBe("tenant-a");
    expect(headers["X-Dealer-ID"]).toBe("dealer-a");
    expect(headers["X-Organization-Unit-ID"]).toBe("ou-a");
    expect(headers["Idempotency-Key"]).toBe("key-1");
  });

  it("sin Idempotency-Key no manda la cabecera vacia", async () => {
    fetchMock.mockResolvedValue(ok({ id: "veh-9" }));
    await createVehicleManual(CONTEXT, COMPLETO);
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect("Idempotency-Key" in headers).toBe(false);
  });

  it("la transicion de estado viaja sola por el PATCH del vehiculo", async () => {
    fetchMock.mockResolvedValue(ok({ id: "veh-9", status: "disponible" }));
    await patchVehicleStatus(CONTEXT, "veh 9", "disponible", "key-2");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/tenant-a/dealers/dealer-a/vehicles/veh%209");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body))).toEqual({ status: "disponible" });
  });

  it("un error HTTP se propaga con reason_code en vez de resolverse en silencio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ reason_code: "UPGRADE_REQUIRED" }),
    } as unknown as Response);
    await expect(createVehicleManual(CONTEXT, COMPLETO)).rejects.toMatchObject({
      status: 403,
      reason_code: "UPGRADE_REQUIRED",
    });
  });

  it("vehicleIdFrom no inventa id cuando el backend no lo devuelve", () => {
    expect(vehicleIdFrom(null)).toBeNull();
    expect(vehicleIdFrom({})).toBeNull();
    expect(vehicleIdFrom({ vehicle_id: " veh-7 " })).toBe("veh-7");
  });
});
