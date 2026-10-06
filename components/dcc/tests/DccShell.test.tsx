import { fireEvent, render, screen } from "@testing-library/react";
import { Inbox, LayoutDashboard } from "lucide-react";
import { DccShell, itemActivo, type DccNavGroup } from "@/components/dcc/shell/DccShell";

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, href, ...rest }: { children?: React.ReactNode; href: string }) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

const GRUPOS: DccNavGroup[] = [
  {
    label: "Operación",
    items: [
      { id: "mesa", label: "Mesa", href: "/x", icon: LayoutDashboard },
      { id: "bandeja", label: "Bandeja", href: "/x/solicitudes", icon: Inbox },
    ],
  },
];

function shell(activo: string | null, onSalir?: () => void) {
  return render(
    <DccShell
      firma="con Nadakki Credit Hub"
      marca={{ nombre: "Banco Ejemplo", logoUrl: null }}
      grupos={GRUPOS}
      activo={activo}
      migas={[{ label: "Banco", href: "/x" }, { label: "Mesa" }]}
      usuario={{ nombre: "Laura Méndez", rol: "Analista", iniciales: "LM" }}
      onSalir={onSalir}
    >
      <p>pagina</p>
    </DccShell>,
  );
}

describe("DccShell (shell generico)", () => {
  it("marca y firma por props; item activo con aria-current y dorado", () => {
    shell("bandeja");
    expect(screen.getByTestId("dcc-shell-marca")).toHaveTextContent("Banco Ejemplo");
    expect(screen.getByTestId("dcc-shell-firma")).toHaveTextContent("con Nadakki Credit Hub");
    const activo = screen.getByRole("link", { name: "Bandeja" });
    expect(activo).toHaveAttribute("aria-current", "page");
    expect(activo.className).toContain("text-[var(--dcc-gold)]");
    expect(screen.getByRole("link", { name: "Mesa" })).not.toHaveAttribute("aria-current");
  });

  it("conmuta claro/oscuro en la raiz del shell", () => {
    const { container } = shell("mesa");
    const raiz = container.querySelector("[data-dcc-shell]");
    expect(raiz).toHaveAttribute("data-dcc-theme", "light");
    fireEvent.click(screen.getByTestId("dcc-shell-theme"));
    expect(raiz).toHaveAttribute("data-dcc-theme", "dark");
  });

  it("menu movil: se abre desde la barra superior y se cierra", () => {
    shell("mesa");
    const barra = screen.getByTestId("dcc-shell-sidebar");
    expect(barra.className).toContain("-translate-x-full");
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(barra.className).not.toContain("-translate-x-full");
    fireEvent.click(screen.getAllByRole("button", { name: "Cerrar menú" })[0]);
    expect(barra.className).toContain("-translate-x-full");
  });

  it("migas: la ultima es la pagina actual y salir llama al callback", () => {
    const salir = jest.fn();
    shell("mesa", salir);
    expect(screen.getByRole("link", { name: "Banco" })).toHaveAttribute("href", "/x");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(salir).toHaveBeenCalled();
  });
});

describe("itemActivo", () => {
  it("la raiz solo coincide exacta; gana el href mas largo", () => {
    expect(itemActivo(GRUPOS, "/x", "/x")).toBe("mesa");
    expect(itemActivo(GRUPOS, "/x/solicitudes/abc", "/x")).toBe("bandeja");
    expect(itemActivo(GRUPOS, "/x/otra", "/x")).toBeNull();
    expect(itemActivo(GRUPOS, "/xy", "/x")).toBeNull();
  });
});
