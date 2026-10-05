/**
 * D7: lo que `e2e/mapaal/D7.spec.ts` busca en pantalla existe en el codigo de
 * la app. Si alguien renombra un testid o cambia un texto, falla aqui y no en
 * el RESULT_D7 contra el tenant QA.
 */
import { existsSync, readFileSync } from "fs";
import path from "path";

import {
  PLANTILLA,
  PREFIJO_HOJA,
  RUTA_IMPORTAR,
  RUTA_INVENTARIO,
  TESTIDS_IMPORTAR,
  TESTIDS_INVENTARIO,
  TEXTO_SIN_IVA,
} from "../../e2e/mapaal/d7-guion";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

describe("D7 guion: selectores y textos contra el codigo de la app", () => {
  it("cada ruta tiene su pagina", () => {
    expect(existsSync(path.join(raiz, `app${RUTA_INVENTARIO}/page.tsx`))).toBe(true);
    expect(existsSync(path.join(raiz, `app${RUTA_IMPORTAR}/page.tsx`))).toBe(true);
  });

  it("los testids del inventario existen en su pagina", () => {
    const pagina = fuente(`app${RUTA_INVENTARIO}/page.tsx`);
    for (const id of TESTIDS_INVENTARIO) expect(pagina).toContain(`"${id}"`);
  });

  it("los testids de importar existen en su pagina", () => {
    const pagina = fuente(`app${RUTA_IMPORTAR}/page.tsx`);
    for (const id of Object.values(TESTIDS_IMPORTAR)) expect(pagina).toContain(`"${id}"`);
    expect(pagina).toContain(`data-testid={\`${PREFIJO_HOJA}\${`);
  });

  it("la pantalla declara la plantilla y la regla sin IVA del guion", () => {
    const pagina = fuente(`app${RUTA_IMPORTAR}/page.tsx`);
    expect(pagina).toContain(`"${PLANTILLA}"`);
    expect(pagina).toContain(TEXTO_SIN_IVA);
  });
});
