/** Fechas con el formato del tenant (auditoria Mapaal QA, P1): dd/mm/aaaa en es-AR. */
import { formateaFecha } from "@/lib/dealer-management/formato";

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
