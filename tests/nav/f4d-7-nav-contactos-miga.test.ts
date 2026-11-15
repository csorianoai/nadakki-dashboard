/** @jest-environment node */
import { migasDe } from "@/lib/migas";

describe("F4D-7 miga de pan", () => {
  it("la miga de /autos/dealer/contactos termina en 'Contactos' (hereda del menú, sin tocar lib/migas.ts)", () => {
    const m = migasDe("/autos/dealer/contactos");
    expect(m[m.length - 1]!.label).toBe("Contactos");
  });
});
