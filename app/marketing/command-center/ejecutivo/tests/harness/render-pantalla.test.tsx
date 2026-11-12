/**
 * PROTOTIPO — genera el HTML estatico de la pantalla patron con datos DEMO deterministas para las capturas de EVIDENCIA.
 * Solo escribe si COMMAND_CENTER_HARNESS_OUT esta definido (ver tests/build-harness.sh); si no, se omite.
 * Escritorio y movil se renderizan con window.matchMedia simulado; el HTML resultante es estatico (sin JS).
 * Reloj congelado: la pantalla recibe `ahora` fijo (AHORA_DEMO) y ningun componente lee Date.now.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { fireEvent, render } from "@testing-library/react";
import { CommandCenterEjecutivo } from "../../CommandCenterEjecutivo";
import { datosVacios } from "../../adaptador-real";
import { AHORA_DEMO, DATOS_DEMO } from "../../demo/datos-demo";
import type { DatosCommandCenter, EstadoPantalla, TemaPantalla } from "../../tipos";

const OUT = process.env.COMMAND_CENTER_HARNESS_OUT;
const run = OUT ? it : it.skip;

function conMatchMedia(movil: boolean) {
  const mql = { matches: movil, media: "", addEventListener: () => {}, removeEventListener: () => {} };
  Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: () => mql });
}

function documento(cuerpo: string, titulo: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titulo} (DEMO)</title><link rel="stylesheet" href="kit.css"></head><body>${cuerpo}</body></html>`;
}

// Ancho real que tienen los graficos dentro del panel en cada viewport (contenedor max 1600 px con 32 px de margen lateral,
// 2/3 de la rejilla de tres columnas con 16 px de hueco, menos el relleno del panel).
const ANCHO = { "1920x1080": 986, "1440x900": 880, "390x844": 326, "320x568": 256 } as const;
type VP = keyof typeof ANCHO;
const MOVIL = (vp: VP) => vp === "390x844" || vp === "320x568";

interface Caso {
  archivo: string;
  vp: VP;
  inicial?: string;
  estado?: EstadoPantalla;
  ahora?: string;
  /** Por defecto "dark" (azul noche, la version a revisar). "light" = control. */
  tema?: TemaPantalla;
  /** Abre los <details> (movil) para comprobar que lo expandido tampoco desborda. */
  expandido?: boolean;
  /** Conversiones del periodo (por defecto las 13 del diseno): permite capturar los tres estados de muestra. */
  conversiones?: number;
  vacio?: "antes" | "despues";
}

const CASOS: Caso[] = [
  { archivo: "ok-escritorio-1920x1080.html", vp: "1920x1080" },
  { archivo: "ok-escritorio-1440x900.html", vp: "1440x900" },
  // Control en tema claro (la version que se revisa es la oscura).
  { archivo: "claro-escritorio-1440x900.html", vp: "1440x900", tema: "light" },
  { archivo: "claro-movil-resumen-390x844.html", vp: "390x844", tema: "light" },
  ...(["390x844", "320x568"] as VP[]).map((vp) => ({ archivo: `ok-movil-expandido-${vp}.html`, vp, expandido: true })),
  ...(["390x844", "320x568"] as VP[]).flatMap((vp) => [
    { archivo: `ok-movil-resumen-${vp}.html`, vp, inicial: "resumen" },
    { archivo: `ok-movil-campanas-${vp}.html`, vp, inicial: "campanas" },
    { archivo: `ok-movil-calidad-${vp}.html`, vp, inicial: "calidad" },
  ]),
  // Tres estados de muestra (decision de Cesar, 10-nov-2026): 0-4 muy limitados, 5-14 preliminar (el caso base), 15+ seguimiento.
  ...(["1920x1080", "1440x900", "390x844", "320x568"] as VP[]).flatMap((vp) => [
    { archivo: `muestra-muy-limitada-${vp}.html`, vp, conversiones: 3 },
    { archivo: `muestra-seguimiento-${vp}.html`, vp, conversiones: 17 },
  ]),
  ...(["1440x900", "390x844"] as VP[]).flatMap((vp) => [
    { archivo: `estado-vacio-${vp}.html`, vp, estado: "vacio" as const },
    { archivo: `estado-error-${vp}.html`, vp, estado: "error" as const },
    { archivo: `estado-cargando-${vp}.html`, vp, estado: "cargando" as const },
    { archivo: `estado-desactualizado-${vp}.html`, vp, ahora: "2026-11-13T10:00:00Z" },
  ]),
  ...(["1440x900", "390x844"] as VP[]).flatMap((vp) => [
    { archivo: `sin-datos-antes-${vp}.html`, vp, estado: "vacio" as const, vacio: "antes" as const },
    { archivo: `sin-datos-despues-${vp}.html`, vp, estado: "vacio" as const, vacio: "despues" as const },
  ]),
];

describe("harness de la pantalla patron (Executive Command Center)", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });
  run("escribe un HTML por caso y viewport", () => {
    mkdirSync(OUT as string, { recursive: true });
    for (const c of CASOS) {
      conMatchMedia(MOVIL(c.vp));
      const datos: DatosCommandCenter | null = c.vacio === "antes"
        ? null
        : c.vacio === "despues"
          ? datosVacios({ tipo: "30d" }, "Tenant QA")
          : c.conversiones === undefined ? DATOS_DEMO : { ...DATOS_DEMO, conversiones_total: c.conversiones };
      const { container, unmount } = render(
        <CommandCenterEjecutivo datos={datos} estado={c.estado} ahora={c.ahora ?? AHORA_DEMO} demo={!c.vacio} mostrarEstructuraVacia={c.vacio === "despues"} anchoGrafico={ANCHO[c.vp]} tema={c.tema} />
      );
      // La seleccion de pestana inicial no es una prop de la pantalla: en movil se activa la pestana pedida simulando el clic.
      if (c.inicial && c.inicial !== "resumen") {
        const texto = c.inicial === "campanas" ? "campañas" : "calidad";
        const pestana = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]')).find((t) => t.textContent?.toLowerCase().includes(texto));
        expect(pestana).toBeTruthy();
        fireEvent.click(pestana as HTMLElement);
      }
      if (c.expandido) container.querySelectorAll("details").forEach((d) => (d.open = true));
      const html = documento(container.innerHTML, c.archivo);
      writeFileSync(join(OUT as string, c.archivo), html);
      if (c.vacio) expect(html).toContain("Sin datos en este periodo");
      else expect(html).toContain("DEMO");
      expect(html).not.toMatch(/NaN|Infinity/);
      unmount();
    }
  });
});
