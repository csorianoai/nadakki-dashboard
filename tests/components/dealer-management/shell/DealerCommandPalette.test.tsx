/**
 * Contrato del buscador de pantallas del panel.
 *
 * Reglas que afirma, todas rompibles sin que nada se caiga:
 *
 *  1. Cerrado no pinta nada (`open=false` -> null).
 *  2. La busqueda ignora tildes y mayusculas.
 *  3. Busca tambien por el nombre del GRUPO.
 *  4. Enter navega; las flechas mueven el activo y dan la vuelta.
 *  5. Esc cierra y devuelve el foco al disparador.
 *  6. Sin resultados no ofrece ninguna opcion.
 *  7. Solo ofrece lo que recibe: entitlements se filtran aguas arriba.
 */
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Car, ReceiptText, Wallet } from "lucide-react";

import { DealerCommandPalette } from "@/components/dealer-management/shell/DealerCommandPalette";
import type { DealerNavItem } from "@/components/dealer-management/shell/dealer-nav";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/autos/dealer",
}));

function item(href: string, label: string, icon: DealerNavItem["icon"]): DealerNavItem {
  return { href, label, icon, capability: null };
}

const ITEMS = [
  { group: "Operación", item: item("/autos/dealer", "Inicio", Car) },
  {
    group: "Operación",
    item: item("/autos/dealer/finanzas", "Finanzas por vehículo", Wallet),
  },
  { group: "Finanzas", item: item("/contable", "Contabilidad", ReceiptText) },
];

function abrir(props: Partial<React.ComponentProps<typeof DealerCommandPalette>> = {}) {
  return render(
    <DealerCommandPalette open onClose={props.onClose ?? (() => {})} items={ITEMS} />,
  );
}

function buscador() {
  return screen.getByRole("combobox");
}

function FocusHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir buscador
      </button>
      <DealerCommandPalette open={open} onClose={() => setOpen(false)} items={ITEMS} />
    </>
  );
}

beforeEach(() => {
  push.mockClear();
});

describe("DealerCommandPalette", () => {
  it("cerrado no monta nada", () => {
    render(<DealerCommandPalette open={false} onClose={() => {}} items={ITEMS} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("abierto es un dialogo modal con su buscador", () => {
    abrir();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(buscador()).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("busca sin tildes y sin distinguir mayusculas", () => {
    abrir();
    fireEvent.change(buscador(), { target: { value: "OPERACION" } });
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.queryByText("Contabilidad")).not.toBeInTheDocument();
  });

  it("encuentra por etiqueta del item", () => {
    abrir();
    fireEvent.change(buscador(), { target: { value: "contabilidad" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("Contabilidad")).toBeInTheDocument();
  });

  it("sin coincidencias no ofrece ninguna opcion", () => {
    abrir();
    fireEvent.change(buscador(), { target: { value: "zzzz-no-existe" } });
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("Enter navega al item activo", () => {
    abrir();
    fireEvent.change(buscador(), { target: { value: "contabilidad" } });
    fireEvent.keyDown(buscador(), { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/contable");
  });

  it("las flechas mueven el activo y Enter sigue al que quedo marcado", () => {
    abrir();
    fireEvent.keyDown(buscador(), { key: "ArrowDown" });
    fireEvent.keyDown(buscador(), { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/autos/dealer/finanzas");
  });

  it("ArrowUp desde el primero da la vuelta al ultimo", () => {
    abrir();
    fireEvent.keyDown(buscador(), { key: "ArrowUp" });
    fireEvent.keyDown(buscador(), { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/contable");
  });

  it("Esc cierra", () => {
    const onClose = jest.fn();
    abrir({ onClose });
    fireEvent.keyDown(buscador(), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("al cerrar con Escape devuelve el foco al disparador", () => {
    render(<FocusHarness />);
    const trigger = screen.getByRole("button", { name: "Abrir buscador" });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(buscador(), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("solo ofrece lo que recibe: nunca un modulo fuera del plan", () => {
    render(
      <DealerCommandPalette open onClose={() => {}} items={[ITEMS[0]]} />,
    );
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.queryByText("Contabilidad")).not.toBeInTheDocument();
  });
});
