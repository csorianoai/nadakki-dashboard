/**
 * Contrato del alta manual de vehiculo.
 *
 * Lo que se prueba es lo que se puede perder en silencio: que el payload no
 * lleve campos que el contrato no acepta, que ningun precio viaje mientras el
 * contrato los llame `price_rd`/`price_usd`, y que NINGUNA moneda de precio este
 * escrita a mano en la UI. Ese ultimo caso es el blocker
 * MONEDA_REFERENCIA_HARDCODEADA: hay un barrido que pone rojo cualquier simbolo
 * o codigo ISO colado en etiqueta o ayuda.
 */
import {
  PENDING_FIELD_NOTE,
  VEHICLE_CONDITIONS,
  VEHICLE_FORM_EMPTY,
  VEHICLE_INITIAL_STATUS,
  VEHICLE_PENDING_FIELDS,
  VEHICLE_STATUS_LABEL,
  VEHICLE_WRITE_CAPABILITY,
  createVehicleManual,
  validateVehicleForm,
  vehicleCreatePayload,
  vehicleIdFrom,
  vehiclePriceFields,
} from "@/lib/dealer-management/vehicle-manual";
import {
  DEALER_REGISTER_CAPABILITY,
  DEALER_VEHICLE_CAPABILITY,
} from "@/lib/dealer/capabilities";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

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
  fuel_type: "diesel",
  drivetrain: "4x4",
  province: "Buenos Aires",
  description: " Unico dueno ",
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("capability y estado inicial", () => {
  it("usa una clave del catalogo 097 y no una inventada", () => {
    expect(MIGRATION_097_CAPABILITY_KEYS.has(VEHICLE_WRITE_CAPABILITY)).toBe(true);
  });

  /**
   * El caso de arriba no basta, y lo detecto la auditoria: `autos.inventory.list`
   * TAMBIEN esta en el catalogo 097, asi que cambiar la clave de escritura por la
   * de lectura dejaba el test en verde. Una pantalla de ALTA pidiendo permiso de
   * LECTURA concede de mas, y nada lo habria notado.
   *
   * Por eso aqui se fija el valor, y ademas se fija la propiedad que lo hace
   * correcto --que no sea la clave de lectura-- contra la constante que ya nombra
   * esa lectura en lib/dealer/capabilities.ts. Asi el caso no depende solo de un
   * literal: si manana se renombran las claves del catalogo, el que falla señala
   * el motivo.
   */
  it("es la clave de ESCRITURA, no la de lectura", () => {
    expect(VEHICLE_WRITE_CAPABILITY).toBe("autos.inventory.create");
    expect(VEHICLE_WRITE_CAPABILITY).not.toBe(DEALER_VEHICLE_CAPABILITY);
    expect(DEALER_VEHICLE_CAPABILITY).toBe("autos.inventory.list");
  });

  it("y es exactamente la que el repo ya usa para dar de alta", () => {
    expect(VEHICLE_WRITE_CAPABILITY).toBe(DEALER_REGISTER_CAPABILITY);
  });

  it("no es una clave de solo lectura: el sufijo lo dice", () => {
    expect(VEHICLE_WRITE_CAPABILITY.endsWith(".create")).toBe(true);
    expect(VEHICLE_WRITE_CAPABILITY.endsWith(".list")).toBe(false);
    expect(VEHICLE_WRITE_CAPABILITY.endsWith(".view")).toBe(false);
  });

  it("el alta nace en BORRADOR y el label no se escribe en la pantalla", () => {
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

  it("envia los campos del contrato con el tipo que pide", () => {
    const payload = vehicleCreatePayload(COMPLETO);
    expect(payload.make).toBe("Toyota");
    expect(payload.year).toBe(2021);
    expect(payload.mileage_km).toBe(48000);
    expect(payload.description).toBe("Unico dueno");
  });

  it("no serializa ningun precio mientras el contrato lo llame price_rd", () => {
    const keys = Object.keys(vehicleCreatePayload(COMPLETO));
    for (const key of ["price_rd", "price_usd", "price_official", "price_reference", "status"]) {
      expect(keys).not.toContain(key);
    }
  });

  it("no inventa los campos que el contrato no expone", () => {
    const keys = Object.keys(vehicleCreatePayload(COMPLETO));
    for (const field of VEHICLE_PENDING_FIELDS) expect(keys).not.toContain(field.name);
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
    for (const year of ["1899", "2051", "2021.5"]) {
      expect(validateVehicleForm({ ...COMPLETO, year }).year).toBeDefined();
    }
  });

  it("acepta VIN vacio y rechaza uno que no tenga 17", () => {
    expect(validateVehicleForm({ ...COMPLETO, vin: "" }).vin).toBeUndefined();
    expect(validateVehicleForm({ ...COMPLETO, vin: "ABC" }).vin).toBeDefined();
  });

  it("rechaza kilometros fuera de rango", () => {
    expect(validateVehicleForm({ ...COMPLETO, mileage_km: "-1" }).mileage_km).toBeDefined();
    expect(validateVehicleForm({ ...COMPLETO, mileage_km: "2000001" }).mileage_km).toBeDefined();
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

describe("vehiclePriceFields: ninguna moneda escrita a mano", () => {
  /** Simbolos y codigos que no pueden aparecer salvo que los aporte el backend. */
  const LITERALES = /RD\$|US\$|MX\$|\bpesos\b|\bdolares\b|\bdólares\b/i;

  it("las dos monedas salen de los parametros, normalizadas", () => {
    expect(vehiclePriceFields("ARS", "USD")[0].label).toBe("Precio (ARS)");
    expect(vehiclePriceFields("ARS", "USD")[1].label).toBe("Precio de referencia (USD)");
    expect(vehiclePriceFields(" ars ", " usd ")[0].label).toBe("Precio (ARS)");
  });

  it("otra pareja produce otras etiquetas, sin rastro de la anterior", () => {
    const [oficial, referencia] = vehiclePriceFields("COP", "EUR");
    expect(oficial.label).toBe("Precio (COP)");
    expect(referencia.label).toBe("Precio de referencia (EUR)");
    expect(referencia.label).not.toContain("USD");
  });

  it("sin moneda funcional dice que falta el dato y no elige una", () => {
    const [oficial] = vehiclePriceFields(null, "USD");
    expect(oficial.label).toBe("Precio (moneda funcional del tenant)");
  });

  it("sin moneda de referencia tampoco la inventa: no asume US$", () => {
    const [, referencia] = vehiclePriceFields("ARS", null);
    expect(referencia.label).toBe("Precio de referencia (moneda de referencia del tenant)");
    expect(referencia.label).not.toContain("US$");
    expect(referencia.label).not.toContain("USD");
  });

  it("ninguna etiqueta ni ayuda trae simbolo o nombre de moneda a mano", () => {
    const combinaciones: [string | null, string | null][] = [
      ["ARS", "USD"],
      ["DOP", "USD"],
      [null, null],
      ["ARS", null],
      [null, "USD"],
    ];
    for (const [funcional, display] of combinaciones) {
      for (const field of vehiclePriceFields(funcional, display)) {
        expect(field.ayuda).not.toMatch(LITERALES);
        expect(field.label).not.toMatch(/RD\$|US\$|MX\$|\bpesos\b/i);
      }
    }
  });

  it("la ayuda de la referencia no la hace autoridad contable", () => {
    const [, referencia] = vehiclePriceFields("ARS", "USD");
    expect(referencia.ayuda).toContain("Solo se muestra en la publicación");
    expect(referencia.ayuda).toContain("la contabilidad usa el precio oficial");
  });

  it("la moneda de referencia no altera el precio oficial ni el payload", () => {
    const base = vehicleCreatePayload(COMPLETO);
    for (const display of ["USD", "EUR", null] as (string | null)[]) {
      expect(vehiclePriceFields("ARS", display)[0].label).toBe("Precio (ARS)");
      expect(vehicleCreatePayload(COMPLETO)).toEqual(base);
    }
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

describe("createVehicleManual", () => {
  beforeEach(() => fetchMock.mockReset());

  it("crea por la ruta de tenant+dealer con los headers de contexto", async () => {
    fetchMock.mockResolvedValue(ok({ id: "veh-9" }));
    expect(vehicleIdFrom(await createVehicleManual(CONTEXT, COMPLETO, "key-1"))).toBe("veh-9");

    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/tenant-a/dealers/dealer-a/vehicles");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Tenant-ID"]).toBe("tenant-a");
    expect(headers["X-Dealer-ID"]).toBe("dealer-a");
    expect(headers["X-Organization-Unit-ID"]).toBe("ou-a");
    expect(headers["Idempotency-Key"]).toBe("key-1");
  });

  it("dealer sin unidad organizativa: no inventa la cabecera de unidad", async () => {
    fetchMock.mockResolvedValue(ok({ id: "veh-9" }));
    await createVehicleManual({ ...CONTEXT, organizationUnitId: null }, COMPLETO);
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect("X-Organization-Unit-ID" in headers).toBe(false);
    expect(headers["X-Dealer-ID"]).toBe("dealer-a");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty("price_rd");
    expect(body).not.toHaveProperty("price_usd");
  });

  it("sin Idempotency-Key no manda la cabecera vacia", async () => {
    fetchMock.mockResolvedValue(ok({ id: "veh-9" }));
    await createVehicleManual(CONTEXT, COMPLETO);
    expect("Idempotency-Key" in (fetchMock.mock.calls[0][1]?.headers as object)).toBe(false);
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
