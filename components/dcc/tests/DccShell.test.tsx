import { fireEvent, render, screen } from "@testing-library/react";
import { Inbox, LayoutDashboard } from "lucide-react";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccShell, itemActivo, type DccNavGroup } from "@/components/dcc/shell/DccShell";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

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

function shell(activo: string | null, onSalir?: () => void, temaStorageKey?: string, hijo?: React.ReactNode) {
  return render(
    <DccShell
      temaStorageKey={temaStorageKey}
      firma="con Nadakki Credit Hub"
      marca={{ nombre: "Banco Ejemplo", logoUrl: null }}
      grupos={GRUPOS}
      activo={activo}
      migas={[{ label: "Banco", href: "/x" }, { label: "Mesa" }]}
      usuario={{ nombre: "Laura Méndez", rol: "Analista", iniciales: "LM" }}
      onSalir={onSalir}
    >
      {hijo ?? <p>pagina</p>}
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

describe("DccShell: tema recordado y un solo conmutador (banco v2)", () => {
  beforeEach(() => window.localStorage.clear());

  it("con temaStorageKey el oscuro sobrevive a recargar (nuevo montaje)", () => {
    const primero = shell("mesa", undefined, "clave-tema");
    fireEvent.click(screen.getByTestId("dcc-shell-theme"));
    expect(window.localStorage.getItem("clave-tema")).toBe("dark");
    primero.unmount();
    const { container } = shell("mesa", undefined, "clave-tema");
    expect(container.querySelector("[data-dcc-shell]")).toHaveAttribute("data-dcc-theme", "dark");
  });

  it("sin temaStorageKey no escribe en Local Storage", () => {
    shell("mesa");
    fireEvent.click(screen.getByTestId("dcc-shell-theme"));
    expect(window.localStorage.length).toBe(0);
  });

  it("dentro del shell la pagina no repite el conmutador; el de la cabecera manda en ambas", () => {
    const { container } = shell(
      "mesa",
      undefined,
      undefined,
      <DccPageMarco titulo="Mesa" marca={marcaDesdeBranding(null, "banco")}>
        <p>pagina</p>
      </DccPageMarco>,
    );
    expect(screen.queryByTestId("dcc-theme-toggle")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Cambiar a tema oscuro" })).toHaveLength(1);
    fireEvent.click(screen.getByTestId("dcc-shell-theme"));
    expect(container.querySelector("[data-dcc-root]")).toHaveAttribute("data-dcc-theme", "dark");
  });

  it("fuera del shell la pagina conserva su conmutador (sin cambios)", () => {
    render(
      <DccPageMarco titulo="Mesa" marca={marcaDesdeBranding(null, "banco")}>
        <p>pagina</p>
      </DccPageMarco>,
    );
    expect(screen.getByTestId("dcc-theme-toggle")).toBeInTheDocument();
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
