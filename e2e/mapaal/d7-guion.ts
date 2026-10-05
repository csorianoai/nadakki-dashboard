/**
 * D7 — lo que el guion exige, sin Playwright: rutas, testids y textos.
 * `D7.spec.ts` lo usa contra el tenant QA y `tests/e2e-mapaal/d7-guion.test.ts`
 * lo compara con el codigo de la app, para que un testid renombrado rompa en
 * Jest y no en el loop.
 *
 * Sin imports: Playwright y Jest lo cargan igual.
 */

export const RUTA_INVENTARIO = "/autos/dealer/inventario";
export const RUTA_IMPORTAR = "/autos/dealer/inventario/importar";

export const TESTIDS_INVENTARIO = ["inventario-importar"] as const;

export const TESTIDS_IMPORTAR = {
  reglas: "import-reglas",
  formulario: "import-formulario",
  denegado: "import-denegado",
  aplicar: "import-aplicar",
  archivo: "import-archivo",
  revisar: "import-revisar",
  revision: "import-revision",
  errores: "import-errores",
  aplicado: "import-aplicado",
  aplicadoDetalle: "import-aplicado-detalle",
  aplicarRechazado: "import-aplicar-rechazado",
  aplicarError: "import-aplicar-error",
} as const;

/** `data-testid` de cada hoja: `import-hoja-<hoja>`. */
export const PREFIJO_HOJA = "import-hoja-";

export const PLANTILLA = "PLANTILLA_ACTIVOS_v4";
export const TEXTO_SIN_IVA = "SIN IVA recuperable";

/**
 * Es la peticion del importador en ese modo? El cliente (`importActivosPath`)
 * distingue revision de aplicar con `?aplicar=false|true`, no con `?modo=`.
 */
export function esPeticionImport(url: string, modo: "revision" | "aplicar", method: string): boolean {
  const u = new URL(url);
  return (
    method === "POST" &&
    /\/dealers\/[^/]+\/import-activos\/?$/.test(u.pathname) &&
    u.searchParams.get("aplicar") === String(modo === "aplicar")
  );
}
