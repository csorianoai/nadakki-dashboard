/**
 * `humanizeApplicant` admite que el tenant no tenga moneda, y entonces no inventa una.
 *
 * Mitad de lib de #529. El unico blocker vivo de su CHANGE_REQUEST era GR-12: tres
 * directorios de primer nivel. El auditor sugirio sacar justo este fichero a otro
 * packet, y es lo que se hizo; el arreglo --quitar el defecto "MXN" de
 * `DealerApplicationsListView`-- va en DASH-DEALER-APPS-MXN-UI-01.
 *
 * La anotacion de tipo no es vinculante: `tsconfig.json:11` tiene `"strict": false`,
 * asi que `strictNullChecks` esta apagado y el compilador no distingue `string` de
 * `string | null`. Por eso el test no persigue al compilador: fija en runtime lo
 * que el tipo promete, que es que con `null` el importe se ausenta en vez de salir
 * con la moneda de otro pais.
 */
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";

const APP = {
  application_id: "11111111-2222-3333-4444-555555555555",
  applicant_name: "Rosa Giménez",
  vehicle_make: "Toyota",
  vehicle_model: "Hilux",
  vehicle_year: 2021,
  requested_amount: "38500000",
};

describe("humanizeApplicant sin moneda del tenant", () => {
  it("con null no publica importe, y no inventa moneda", () => {
    const { amountLabel } = humanizeApplicant(APP, null);
    expect(amountLabel).toBe("—");
    for (const inventada of ["MXN", "MX$", "DOP", "RD$", "38"]) {
      expect(amountLabel).not.toContain(inventada);
    }
  });

  it("con la moneda del tenant si publica el importe en esa moneda", () => {
    const conArs = humanizeApplicant(APP, "ARS").amountLabel;
    expect(conArs).toMatch(/38/);
    expect(conArs).not.toContain("MXN");
    expect(conArs).not.toContain("RD$");
  });

  it("el resto del humanizado no depende de la moneda", () => {
    const sin = humanizeApplicant(APP, null);
    const con = humanizeApplicant(APP, "ARS");
    expect(sin.primaryLabel).toBe("Rosa Giménez");
    expect(sin.primaryLabel).toBe(con.primaryLabel);
    expect(sin.vehicleLabel).toBe("2021 Toyota Hilux");
    expect(sin.vehicleLabel).toBe(con.vehicleLabel);
    expect(sin.hasClientData).toBe(true);
  });

  it("una cadena vacia tampoco vale como moneda", () => {
    expect(humanizeApplicant(APP, "").amountLabel).toBe("—");
    expect(humanizeApplicant(APP, "   ").amountLabel).toBe("—");
  });
});
