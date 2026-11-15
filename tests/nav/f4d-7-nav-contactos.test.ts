/** @jest-environment node */
/** F4D-7: Contactos en el menú del concesionario (grupo Operación, capability del backend de contactos). */
import { DEALER_NAV_GROUPS, visibleDealerNavGroups } from "@/components/dealer-management/shell/dealer-nav";
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";

const HREF = "/autos/dealer/contactos";

describe("F4D-7 Contactos en el menú del dealer", () => {
  it("el grupo Operación contiene Contactos con href /autos/dealer/contactos, justo después de Inventario", () => {
    const op = DEALER_NAV_GROUPS.find((g) => g.id === "operacion")!;
    const i = op.items.findIndex((x) => x.href === HREF);
    expect(i).toBeGreaterThan(-1);
    expect(op.items[i]!.label).toBe("Contactos");
    expect(op.items[i - 1]!.href).toBe("/autos/dealer/inventario");
  });

  it("pide la capability que exige el backend para /api/v1/autos/contacts (autos.leads.crm), no la de Inventario", () => {
    const c = DEALER_NAV_GROUPS.flatMap((g) => g.items).find((x) => x.href === HREF)!;
    expect(c.capability).toBe("autos.leads.crm");
    expect(c.alsoRequires).toBeUndefined();
  });

  it("un plan con inventario y sin CRM no la ve (recibiría 403 en la pantalla); con autos.leads.crm sí", () => {
    const hrefs = (allows: (k: string | null) => boolean) =>
      visibleDealerNavGroups(allows).flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs((k) => k === null)).not.toContain(HREF);
    expect(hrefs((k) => k === null || k === "autos.inventory.list")).not.toContain(HREF);
    expect(hrefs((k) => k === null || k === "autos.leads.crm")).toContain(HREF);
  });

  it("el manifiesto la tiene clasificada y accesible", () => {
    const e = MANIFIESTO_PAGINAS.find((p) => p.ruta === HREF);
    expect(e).toBeDefined();
    expect(["menu", "enlazada"]).toContain(e!.categoria);
  });
});
