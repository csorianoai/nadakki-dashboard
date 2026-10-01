/**
 * Las rutas del panel del dealer viven bajo el layout del dealer.
 *
 * Seis pantallas del panel --anuncios, anuncios/nuevo, redes-sociales,
 * redes-sociales/analytics, reputacion, reputacion/reviews-- vivian en
 * app/(forge)/autos/dealer. Su URL era /autos/dealer/..., pero el arbol de
 * layouts que las envuelve es el de su carpeta, no el de su URL: resolvian por
 * app/(forge)/layout.tsx y se pintaban con el chrome de Forge, sin el
 * `DealerShell`. El usuario veia la misma URL del panel con otra navegacion.
 *
 * No es un caso que se pueda cerrar mirando una pantalla en jsdom: lo que falla
 * es la ubicacion del fichero. Asi que se mide el arbol de rutas.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const RUTAS_DEL_PANEL = [
  "anuncios",
  "anuncios/nuevo",
  "redes-sociales",
  "redes-sociales/analytics",
  "reputacion",
  "reputacion/reviews",
];

function bajoPanel(ruta: string): string {
  return join(process.cwd(), "app", "autos", "dealer", ruta, "page.tsx");
}

function bajoForge(ruta: string): string {
  return join(process.cwd(), "app", "(forge)", "autos", "dealer", ruta, "page.tsx");
}

describe("las seis pantallas del panel", () => {
  it("estan bajo app/autos/dealer, donde el layout monta DealerShell", () => {
    const faltan = RUTAS_DEL_PANEL.filter((ruta) => !existsSync(bajoPanel(ruta)));
    expect(faltan).toEqual([]);
  });

  it("ya no quedan bajo app/(forge)/autos/dealer", () => {
    const quedan = RUTAS_DEL_PANEL.filter((ruta) => existsSync(bajoForge(ruta)));
    expect(quedan).toEqual([]);
  });

  it("el layout del dealer sigue en su sitio, que es lo que las envuelve ahora", () => {
    expect(existsSync(join(process.cwd(), "app", "autos", "dealer", "layout.tsx"))).toBe(true);
  });
});

describe("regresion", () => {
  it("ninguna pantalla nueva del panel aparece bajo (forge)", () => {
    // El directorio puede existir vacio tras el movimiento; lo que no puede
    // haber es una pagina dentro, porque volveria a pintarse con otro chrome.
    const sospechosas = ["", ...RUTAS_DEL_PANEL].filter((ruta) =>
      existsSync(ruta ? bajoForge(ruta) : join(process.cwd(), "app", "(forge)", "autos", "dealer", "page.tsx")),
    );
    expect(sospechosas).toEqual([]);
  });
});
