/** @jest-environment node */
/** F4D-7: Contactos está en dealer-nav, así que el manifiesto la declara 'menu' (no 'enlazada'). */
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";

describe("F4D-7 manifiesto: Contactos es menu", () => {
  it("la ruta /autos/dealer/contactos está clasificada como menu, fuente dealer-nav", () => {
    const e: any = MANIFIESTO_PAGINAS.find((p) => p.ruta === "/autos/dealer/contactos");
    expect(e).toBeDefined();
    expect(e.categoria).toBe("menu");
    expect(e.fuente).toBe("dealer-nav");
    expect(e.href).toBe("/autos/dealer/contactos");
  });
});
