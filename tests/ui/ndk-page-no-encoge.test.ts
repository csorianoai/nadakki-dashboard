/**
 * `.ndk-page` no encoge dentro del GlobalForgeAppShell.
 *
 * Desde #124 el `main` del shell es `flex flex-col overflow-y-auto`: sin `flex-shrink: 0`, el bloque oscuro
 * de la portada medía la altura de la ventana (900 px con 1469 px de contenido a 1440×900) y las tarjetas
 * «Acceso rápido por función» caían, con texto blanco, sobre el fondo claro del shell. La prueba visual
 * completa está en e2e/visual/fondo-continuo.spec.ts; esta guarda la regla sin navegador.
 */
import { readFileSync } from "fs";
import path from "path";

const css = readFileSync(path.join(__dirname, "../../app/globals.css"), "utf8");

function reglas(selector: string): string[] {
  const rx = new RegExp(`(^|\\n)\\s*${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "g");
  return [...css.matchAll(rx)].map((m) => m[2]);
}

describe(".ndk-page dentro del shell con scroll", () => {
  it("existe la regla .ndk-page en app/globals.css", () => {
    expect(reglas(".ndk-page").length).toBeGreaterThan(0);
  });

  it("declara flex-shrink: 0 para crecer con su contenido", () => {
    const decl = reglas(".ndk-page").join(";").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(decl).toMatch(/flex-shrink\s*:\s*0\s*(;|$)/);
  });
});
