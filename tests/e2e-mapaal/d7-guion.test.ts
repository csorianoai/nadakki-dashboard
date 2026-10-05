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
  esPeticionImport,
  RUTA_IMPORTAR,
  RUTA_INVENTARIO,
  TESTIDS_IMPORTAR,
  TESTIDS_INVENTARIO,
  TESTIDS_SIN_FORMULARIO,
  TEXTO_SIN_IVA,
} from "../../e2e/mapaal/d7-guion";
import { importActivosPath } from "@/lib/dealer-management/import-activos";

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

  it("los estados sin formulario que el spec diagnostica existen en la pagina", () => {
    const pagina = fuente(`app${RUTA_IMPORTAR}/page.tsx`);
    for (const id of Object.values(TESTIDS_SIN_FORMULARIO)) expect(pagina).toContain(`"${id}"`);
  });

  it("la pantalla declara la plantilla y la regla sin IVA del guion", () => {
    const pagina = fuente(`app${RUTA_IMPORTAR}/page.tsx`);
    expect(pagina).toContain(`"${PLANTILLA}"`);
    expect(pagina).toContain(TEXTO_SIN_IVA);
  });
});

describe("D7 guion: el filtro de peticiones reconoce lo que manda el cliente", () => {
  // Regresion: el spec filtraba `?modo=` y el cliente manda `?aplicar=`, asi que
  // waitForRequest agotaba el tiempo y RESULT_D7 salia FAIL.
  const abs = (modo: "revision" | "aplicar") => `https://x.test${importActivosPath("d-1", modo)}`;

  it("revision y aplicar se distinguen con la URL real de importActivosPath", () => {
    expect(esPeticionImport(abs("revision"), "revision", "POST")).toBe(true);
    expect(esPeticionImport(abs("aplicar"), "aplicar", "POST")).toBe(true);
    expect(esPeticionImport(abs("revision"), "aplicar", "POST")).toBe(false);
    expect(esPeticionImport(abs("aplicar"), "revision", "POST")).toBe(false);
    expect(esPeticionImport(abs("revision"), "revision", "GET")).toBe(false);
  });
});
