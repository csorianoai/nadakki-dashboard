import {
  MONETIZACION_NAV,
  isMonetizacionPath,
  monetizacionPageTitle,
} from "@/lib/credit-hub/monetizacion/routes";

describe("monetizacion routes", () => {
  test("MONETIZACION_NAV defines 8 screens", () => {
    expect(MONETIZACION_NAV).toHaveLength(8);
  });

  test("isMonetizacionPath matches module prefix only", () => {
    expect(isMonetizacionPath("/credit-hub/monetizacion/dashboard")).toBe(true);
    expect(isMonetizacionPath("/credit-hub/monetizacion")).toBe(true);
    expect(isMonetizacionPath("/credit-hub/bank")).toBe(false);
    expect(isMonetizacionPath(null)).toBe(false);
  });

  test("monetizacionPageTitle resolves nav label from pathname", () => {
    expect(monetizacionPageTitle("/credit-hub/monetizacion/configuracion")).toBe(
      "Configuración de cobro",
    );
    expect(monetizacionPageTitle("/credit-hub/monetizacion/unknown")).toBe("Monetización");
  });
});
