import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { TextoRecortado } from "@/components/realtor/TextoRecortado";

/** ROP-UX-QUICKFIX: los títulos largos se cortan con «…» y el texto completo queda en el tooltip (title). */
const LARGO = "Visita · 18555 Collins Ave #2104, Sunny Isles Beach, FL 33160 — familia Herrera con sus dos hijos";

describe("TextoRecortado", () => {
  it("negativo: un texto vacío no pinta un tooltip vacío", () => {
    render(<TextoRecortado texto="" testid="t" />);
    expect(screen.getByTestId("t")).not.toHaveAttribute("title");
  });
  it("una línea: ellipsis, sin salto, y el texto completo en title", () => {
    render(<TextoRecortado texto={LARGO} testid="t" />);
    const el = screen.getByTestId("t");
    expect(el).toHaveTextContent(LARGO);
    expect(el).toHaveAttribute("title", LARGO);
    expect(el.style.textOverflow).toBe("ellipsis");
    expect(el.style.whiteSpace).toBe("nowrap");
    expect(el.style.overflow).toBe("hidden");
  });
  it("varias líneas: line-clamp con el número pedido", () => {
    render(<TextoRecortado texto={LARGO} lineas={2} testid="t" />);
    const el = screen.getByTestId("t");
    expect(el.style.webkitLineClamp).toBe("2");
    expect(el).toHaveAttribute("title", LARGO);
  });
});

describe("se usa donde hay títulos largos", () => {
  it.each([
    "components/realtor/mi-dia/MiDiaPanel.tsx",
    "components/realtor/clientes/ClientesPanel.tsx",
    "components/realtor/propiedades/PropiedadesPanel.tsx",
  ])("%s", (f) => {
    expect(readFileSync(join(process.cwd(), f), "utf8")).toContain("<TextoRecortado");
  });
});
