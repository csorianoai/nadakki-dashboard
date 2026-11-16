/** F4E-4: el asistente contable en el chrome del dealer y la vista de finanzas del inventario en el menú. */
import fs from "fs";
import path from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import { DEALER_NAV_GROUPS, visibleDealerNavGroups } from "@/components/dealer-management/shell/dealer-nav";
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";

const HREF = "/autos/dealer/finanzas/inventario";
let ruta = "/autos/dealer/inventario";

jest.mock("next/navigation", () => ({ usePathname: () => ruta }));
jest.mock("@/components/ai/AsistenteContable", () => ({
  AsistenteContable: () => <div data-testid="asistente-panel">panel</div>,
}));

function cargar() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/components/dealer-management/shell/DealerAsistente").DealerAsistente as () => JSX.Element | null;
}

describe("F4E-4 asistente contable en el dealer", () => {
  it("en una ruta /autos/dealer/** hay un control 'Asistente contable' que abre y cierra el panel", () => {
    ruta = "/autos/dealer/inventario";
    const DealerAsistente = cargar();
    render(<DealerAsistente />);
    expect(screen.queryByTestId("asistente-panel")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /asistente contable/i }));
    expect(screen.getByTestId("asistente-panel")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(screen.queryByTestId("asistente-panel")).toBeNull();
  });

  it("cerrar el panel no pierde la conversación: el panel se oculta, no se desmonta", () => {
    ruta = "/autos/dealer/finanzas";
    const DealerAsistente = cargar();
    render(<DealerAsistente />);
    fireEvent.click(screen.getByRole("button", { name: /asistente contable/i }));
    const panel = screen.getByTestId("asistente-panel");
    fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(panel.isConnected).toBe(true);
    expect(panel.closest("[hidden]")).not.toBeNull();
  });

  it("fuera de /autos/dealer no existe el control", () => {
    for (const r of ["/contable", "/autos/dealerx", "/", "/autos"]) {
      ruta = r;
      const DealerAsistente = cargar();
      const { container, unmount } = render(<DealerAsistente />);
      expect(container.innerHTML).toBe("");
      unmount();
    }
  });

  it("el chrome del dealer monta el asistente", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "components/dealer-management/shell/DealerShell.tsx"), "utf8");
    expect(src).toContain("<DealerAsistente");
  });
});

describe("F4E-4 Finanzas del inventario en el menú", () => {
  const todas = () => DEALER_NAV_GROUPS.flatMap((g) => g.items);

  it("el grupo Finanzas la contiene con la misma regla de visibilidad que Finanzas por vehículo", () => {
    const fin = DEALER_NAV_GROUPS.find((g) => g.id === "finanzas")!;
    const nueva = fin.items.find((i) => i.href === HREF)!;
    const vieja = fin.items.find((i) => i.href === "/autos/dealer/finanzas")!;
    expect(nueva).toBeDefined();
    expect(nueva.capability).toBe(vieja.capability);
    expect(nueva.alsoRequires).toEqual(vieja.alsoRequires);
    expect(todas().filter((i) => i.href === HREF)).toHaveLength(1);
  });

  it("solo se ve con la capability contable y la de inventario", () => {
    const hrefs = (allows: (k: string | null) => boolean) => visibleDealerNavGroups(allows).flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs((k) => k === null)).not.toContain(HREF);
    expect(hrefs((k) => k === null || k === "accounting.ledger.entries")).not.toContain(HREF);
    expect(hrefs((k) => k === null || k === "accounting.ledger.entries" || k === "autos.inventory.list")).toContain(HREF);
  });

  it("el manifiesto la declara en el menú (dealer-nav)", () => {
    const e = MANIFIESTO_PAGINAS.find((p) => p.ruta === HREF);
    expect(e).toMatchObject({ archivo: "app/autos/dealer/finanzas/inventario/page.tsx", categoria: "menu", fuente: "dealer-nav", href: HREF });
  });
});
