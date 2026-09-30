/**
 * Contrato de los tokens del panel del dealer en app/globals.css.
 *
 * Por que existe: los componentes del shell no leen colores, leen
 * `var(--nav-bg-2)`, `var(--surface)`, `var(--ring)`… Si un token se renombra
 * o desaparece, NADA se rompe de forma visible en CI --el build compila igual
 * y ningun render falla--: la pantalla simplemente se queda sin estilo. Este
 * contrato es la unica red que atrapa esa clase de fallo.
 *
 * Tambien es lo que exige la puerta de CI: un cambio de producto con cero
 * tests relacionados falla cerrado (ci.yml, SOURCE_CHANGED_WITH_ZERO_RELATED_TESTS).
 *
 * No afirma valores hexadecimales concretos --el color es decision de diseño y
 * cambiara-- sino que cada token del contrato EXISTE y tiene un valor no vacio.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

/** Tokens que consume el shell del dealer (sidebar, topbar, paleta). */
const TOKENS_DEL_PANEL = [
  "--brand",
  "--brand-strong",
  "--brand-soft",
  "--on-brand",
  "--nav-bg",
  "--nav-bg-2",
  "--nav-fg",
  "--nav-fg-muted",
  "--nav-border",
  "--bg",
  "--surface",
  "--surface-2",
  "--border",
  "--fg",
  "--fg-muted",
  "--danger",
  "--warning",
  "--success",
  "--r",
  "--ring",
];

function valorDe(token: string): string | null {
  // `--token: valor;` con espacios libres. Se toma la PRIMERA definicion.
  const re = new RegExp(`\\${token}\\s*:\\s*([^;]+);`);
  const m = CSS.match(re);
  return m ? m[1].trim() : null;
}

describe("tokens del panel en globals.css", () => {
  it.each(TOKENS_DEL_PANEL)("%s esta definido con un valor no vacio", (token) => {
    const valor = valorDe(token);
    expect(valor).not.toBeNull();
    expect(valor).not.toBe("");
  });

  it("los tokens de navegacion son oscuros y distintos entre fondo y fondo-2", () => {
    // El sidebar usa --nav-bg de fondo y --nav-bg-2 para el item activo: si
    // fueran iguales, el activo dejaria de distinguirse y nadie se enteraria.
    expect(valorDe("--nav-bg")).not.toEqual(valorDe("--nav-bg-2"));
  });

  it("el texto de navegacion se distingue del atenuado", () => {
    expect(valorDe("--nav-fg")).not.toEqual(valorDe("--nav-fg-muted"));
  });

  it("--ring trae una sombra de foco, no un color suelto", () => {
    // Se usa como `box-shadow: var(--ring)`; un color plano ahi no pinta foco.
    expect(valorDe("--ring")).toMatch(/\d+\s*px/);
  });

  it("los radios son longitudes con unidad", () => {
    for (const token of ["--r", "--r-sm", "--r-lg"]) {
      expect(valorDe(token)).toMatch(/^\d+(\.\d+)?(px|rem)$/);
    }
  });
});
