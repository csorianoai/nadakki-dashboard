/** Fechas con el formato del tenant (auditoria Mapaal QA, P1): dd/mm/aaaa en es-AR. */
import { formateaFecha, parseaFecha, patronFecha } from "@/lib/dealer-management/formato";

const AR = { locale: "es-AR" };

it("es-AR pinta dd/mm/aaaa", () => {
  expect(formateaFecha("2026-10-05", AR)).toBe("05/10/2026");
});

it("una fecha sin hora no retrocede un dia por la zona horaria", () => {
  expect(formateaFecha("2026-01-01", AR)).toBe("01/01/2026");
});

it("con hora, tambien dd/mm/aaaa", () => {
  expect(formateaFecha("2026-10-05T15:00:00Z", AR)).toMatch(/^\d{2}\/\d{2}\/2026$/);
});

it("el locale manda: otro tenant, otro orden", () => {
  expect(formateaFecha("2026-10-05", { locale: "en-US" })).toBe("10/05/2026");
});

it("sin locale usa el neutro 'es', que tambien es dd/mm/aaaa", () => {
  expect(formateaFecha("2026-10-05")).toBe("05/10/2026");
});

it("lo que no es fecha no se inventa", () => {
  expect(formateaFecha("")).toBeNull();
  expect(formateaFecha(null)).toBeNull();
  expect(formateaFecha("no-es-fecha")).toBeNull();
});

describe("parseaFecha: lo que escribe el dealer, a ISO", () => {
  it("dd/mm/aaaa en es-AR", () => {
    expect(parseaFecha("30/09/2026", AR)).toBe("2026-09-30");
    expect(parseaFecha("5/1/2026", AR)).toBe("2026-01-05");
    expect(parseaFecha(" 05/10/2026 ", AR)).toBe("2026-10-05");
  });

  it("ida y vuelta con formateaFecha", () => {
    expect(formateaFecha(parseaFecha("29/02/2028", AR), AR)).toBe("29/02/2028");
    expect(parseaFecha(formateaFecha("2026-12-31", AR), AR)).toBe("2026-12-31");
  });

  it("el locale manda el orden: en-US es mm/dd/aaaa", () => {
    expect(parseaFecha("10/05/2026", { locale: "en-US" })).toBe("2026-10-05");
    expect(parseaFecha("10/05/2026", AR)).toBe("2026-05-10");
  });

  it("acepta ISO tal cual", () => {
    expect(parseaFecha("2026-01-15", AR)).toBe("2026-01-15");
  });

  it("una fecha que no existe no se corrige sola", () => {
    expect(parseaFecha("31/02/2026", AR)).toBeNull();
    expect(parseaFecha("29/02/2026", AR)).toBeNull();
    expect(parseaFecha("00/10/2026", AR)).toBeNull();
    expect(parseaFecha("10/13/2026", AR)).toBeNull();
    expect(parseaFecha("2026-02-30", AR)).toBeNull();
  });

  it("año de dos cifras o texto suelto no son fecha", () => {
    expect(parseaFecha("30/09/26", AR)).toBeNull();
    expect(parseaFecha("ayer", AR)).toBeNull();
    expect(parseaFecha("30092026", AR)).toBeNull();
  });

  it("vacio es null", () => {
    expect(parseaFecha("", AR)).toBeNull();
    expect(parseaFecha("   ", AR)).toBeNull();
    expect(parseaFecha(null, AR)).toBeNull();
    expect(parseaFecha(undefined, AR)).toBeNull();
  });
});

describe("patronFecha", () => {
  it("es-AR y el neutro 'es' piden dd/mm/aaaa", () => {
    expect(patronFecha(AR)).toBe("dd/mm/aaaa");
    expect(patronFecha()).toBe("dd/mm/aaaa");
  });

  it("en-US pide mm/dd/aaaa", () => {
    expect(patronFecha({ locale: "en-US" })).toBe("mm/dd/aaaa");
  });
});
