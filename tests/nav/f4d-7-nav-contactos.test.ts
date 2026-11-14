/** @jest-environment node */
/** F4D-7: Contactos en el menú del concesionario (grupo Operación, misma regla que Inventario). */
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

  it("usa la misma capability que Inventario (no se inventa ninguna)", () => {
    const todos = DEALER_NAV_GROUPS.flatMap((g) => g.items);
    const c = todos.find((x) => x.href === HREF)!;
    const inv = todos.find((x) => x.href === "/autos/dealer/inventario")!;
    expect(c.capability).toBe("autos.inventory.list");
    expect(c.capability).toBe(inv.capability);
    expect(c.alsoRequires).toEqual(inv.alsoRequires);
  });

  it("un usuario sin autos.inventory.list no la ve; con ella sí", () => {
    const hrefs = (allows: (k: string | null) => boolean) =>
      visibleDealerNavGroups(allows).flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs((k) => k === null)).not.toContain(HREF);
    expect(hrefs((k) => k === null || k === "autos.inventory.list")).toContain(HREF);
  });

  it("el manifiesto la declara como menu", () => {
    const e = MANIFIESTO_PAGINAS.find((p) => p.ruta === HREF);
    expect(e).toBeDefined();
    expect(e!.categoria).toBe("menu");
  });
});
