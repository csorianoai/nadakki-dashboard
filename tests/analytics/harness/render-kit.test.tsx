/**
 * PROTOTIPO — genera el HTML estatico del kit con fixtures deterministas para las capturas de evidencia.
 * Solo escribe si ANALYTICS_HARNESS_OUT esta definido (ver e2e/analytics/build-harness.sh); si no, se omite.
 * No es una pantalla de produccion ni importa nada fuera del kit y de los fixtures.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { BarraFiltros, CifraKpiCard, EstadoAnalitica, FormatoProvider, GrillaKpi, SelectorPeriodo } from "@/components/analytics/kit";
import * as F from "../fixtures/cifras.fixture";

const OUT = process.env.ANALYTICS_HARNESS_OUT;
const run = OUT ? it : it.skip;
/** Tema de la captura: ANALYTICS_HARNESS_TEMA=dark (azul noche) o light (por defecto). */
const TEMA = process.env.ANALYTICS_HARNESS_TEMA === "dark" ? "dark" : "light";

function Pagina() {
  return (
    <div className="forge-app kit-fondo min-h-screen p-4 sm:p-6" data-theme={TEMA}>
      <div data-testid="banner-prototipo" role="note" className="mb-4 rounded-forge-sm border kit-bd kit-bg-hundida px-3 py-2 text-forge-xs font-medium kit-txt-2">
        PROTOTIPO — datos de ejemplo deterministas, no son cifras reales de ningún tenant.
      </div>
      <h1 className="mb-4 font-display text-[length:var(--forge-text-lg,18px)] font-semibold kit-txt">Kit de analítica · Ola 0 · PR 1</h1>
      <div className="mb-4 space-y-4">
        <SelectorPeriodo valor={{ tipo: "30d" }} onChange={() => {}} />
        <BarraFiltros
          onChange={() => {}}
          filtros={[
            { id: "canal", etiqueta: "Canal", valor: "todos", opciones: [{ valor: "todos", etiqueta: "Todos" }, { valor: "ads", etiqueta: "Google Ads" }] },
            { id: "campana", etiqueta: "Campaña", valor: "todos", opciones: [{ valor: "todos", etiqueta: "Todas" }] },
          ]}
        />
      </div>
      <GrillaKpi>
        <CifraKpiCard cifra={F.CIFRA_SUBE} />
        <CifraKpiCard cifra={F.CIFRA_BAJA} />
        <CifraKpiCard cifra={F.CIFRA_COSTO_SUBE} />
        <CifraKpiCard cifra={F.CIFRA_ANTERIOR_CERO} />
        <CifraKpiCard cifra={F.CIFRA_SIN_FUENTE} />
        <CifraKpiCard cifra={{ ...F.CIFRA_SUBE, id: "cargando", estado: "cargando" }} />
        <CifraKpiCard cifra={{ ...F.CIFRA_SUBE, id: "error", estado: "error" }} />
        <CifraKpiCard cifra={{ ...F.CIFRA_SUBE, id: "vacio", estado: "vacio" }} />
      </GrillaKpi>
      <div className="mt-4">
        <EstadoAnalitica estado="datos_insuficientes" />
      </div>
      <h2 className="mb-2 mt-6 text-forge-sm font-semibold kit-txt">Formato por tenant (locale y moneda de cada tenant)</h2>
      <GrillaKpi>
        <div data-testid="formato-baylara">
          <FormatoProvider formato={{ locale: "en-US", moneda: "USD" }}>
            <CifraKpiCard cifra={{ ...F.CIFRA_COSTO_SUBE, id: "baylara", etiqueta: "Baylara · costo por lead", moneda: undefined }} />
          </FormatoProvider>
        </div>
        <div data-testid="formato-mapaal">
          <FormatoProvider formato={{ locale: "es-AR", moneda: "ARS" }}>
            <CifraKpiCard cifra={{ ...F.CIFRA_COSTO_SUBE, id: "mapaal", etiqueta: "MAPAAL · costo por lead", moneda: undefined, valor: 1234.5 }} />
          </FormatoProvider>
        </div>
      </GrillaKpi>
    </div>
  );
}

describe("harness del kit", () => {
  run("escribe kit.html", () => {
    mkdirSync(OUT as string, { recursive: true });
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kit analitica (PROTOTIPO)</title><link rel="stylesheet" href="kit.css"></head><body>${renderToStaticMarkup(<Pagina />)}</body></html>`;
    writeFileSync(join(OUT as string, "kit.html"), html);
    expect(html).toContain("PROTOTIPO");
  });
});
