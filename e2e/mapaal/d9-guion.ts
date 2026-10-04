/**
 * D9 — lo que el guion del Centro Operativo exige, sin Playwright: rutas,
 * testids, nombres de las navegaciones y la lectura de las respuestas.
 * `D9.spec.ts` lo usa contra el tenant QA y `tests/e2e-mapaal/d9-guion.test.ts`
 * lo compara con el codigo de la app, para que un testid o un texto renombrado
 * rompa en Jest y no en el RESULT_D9.
 *
 * Sin imports: Playwright y Jest lo cargan igual.
 */

/** superloop/config/fase2.json: ids.tenant_qa. Nunca el tenant real de Mapaal. */
export const TENANT_QA = "9a9a0001-0000-4000-8000-000000000001";

/**
 * Slug del tenant QA ("Mapaal QA / mapaal-qa", creado en P8, tablero #1501).
 * No tiene subdominio propio: `mapaal-qa.nadakki.com` no resuelve.
 */
export const SLUG_QA = "mapaal-qa";

/** Host sin tenant fijo (`resolveDealerAdminHost` -> "universal"): el login pide el tenant. */
export const ORIGEN_UNIVERSAL = "https://dashboard.nadakki.com";

/** Placeholder del campo de tenant del login; el del email lo contiene, de ahi el `exact`. */
export const PLACEHOLDER_TENANT = "tu-institucion";

/** Lo que `resolveDealerAdminHost` devuelve; aqui sin import, ver arriba. */
export type HostResuelto = { mode: string; tenantSlug?: string };

/**
 * Donde inicia sesion el usuario QA.
 *
 * En un subdominio de dealer el login NO deja elegir tenant: manda el slug del
 * host (`mapaal.nadakki.com` -> `mapaal`) y el backend busca el email solo en
 * ese tenant, asi que el usuario de `mapaal-qa` recibe 401 "Credenciales
 * invalidas". Si BASE_URL es un subdominio de otro tenant, el login va por el
 * host universal (mismo despliegue) y la sesion se lleva luego a BASE_URL.
 */
export function origenDeLogin(baseUrl: string, host: HostResuelto): string {
  const base = baseUrl.replace(/\/$/, "");
  if (host.mode === "dealer_subdomain" && host.tenantSlug !== SLUG_QA) return ORIGEN_UNIVERSAL;
  return base;
}

/**
 * Huella del despliegue en el HTML de `/login`: el `dpl_` de Vercel, o si no
 * esta, las rutas de los chunks de Next. Dos hosts con la misma huella sirven
 * el mismo build.
 */
export function huellaDespliegue(html: string): string | null {
  const dpl = html.match(/dpl=(dpl_[A-Za-z0-9]+)/);
  if (dpl) return dpl[1];
  const chunks = Array.from(new Set(html.match(/\/_next\/static\/chunks\/[^"'\s]+\.js/g) ?? [])).sort();
  return chunks.length ? chunks.join(",") : null;
}

export const RUTAS = {
  inicio: "/autos/dealer",
  centro: "/centro-operativo",
} as const;

/** `PRIMEROS_PASOS_HREF` y `PRIMEROS_PASOS_BOTON` de `PrimerosPasosInicio.tsx`. */
export const ANCLA_PRIMEROS_PASOS = "primeros-pasos";
export const CTA_PRIMEROS_PASOS = "Empezar: cargar mi stock";

/** Grupo y etiqueta del enlace en `dealer-nav.ts`. */
export const GRUPO_MENU = "Operación";
export const ENLACE_MENU = "Centro Operativo";

/** El `aria-label` de cada navegacion. Solo la del dealer puede estar en el Centro Operativo. */
export const NAV = {
  dealer: "Navegación del dealer",
  /** `ForgeGlobalCoresSidebar.tsx`: el chrome de la Suite. */
  suite: "Navegación principal",
  suiteModulos: "Navegación por módulos",
  /** `TopNav.tsx`: la barra del marketplace. */
  marketplace: "Principal",
} as const;
export const SUITE_OPERATIVA = "Suite operativa";

export const TESTIDS = {
  sidebar: "dealer-sidebar",
  primerosPasosInicio: "dealer-primeros-pasos",
  primerosPasosCta: "dealer-primeros-pasos-cta",
  accesoLibre: "open-quick-link",
  bloque: (id: string) => `centro-bloque-${id}`,
  advertencia: (id: string) => `centro-advertencia-${id}`,
  plantilla: "centro-plantilla-descargar",
  tiposCosto: "centro-tipos-costo",
  cuentas: "centro-cuentas",
  reglaFinal: "centro-regla-final",
} as const;

/** El GET del inventario privado del dealer (`fetchDealerInventory`). */
export const VEHICLES = /\/api\/v1\/autos\/dealers\/([^/?]+)\/vehicles(\?|$)/;

export function esInventario(url: string, metodo: string): boolean {
  if (metodo.toUpperCase() !== "GET") return false;
  try {
    return VEHICLES.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** Vehiculos con `id`, leidos como `fetchDealerInventory`; `null` si no es un inventario. */
export function vehiculosEnRespuesta(body: unknown): number | null {
  const filas = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { vehicles?: unknown }).vehicles)
      ? ((body as { vehicles: unknown[] }).vehicles)
      : null;
  if (!filas) return null;
  return filas.filter((fila) => {
    if (!fila || typeof fila !== "object" || Array.isArray(fila)) return false;
    const id = (fila as { id?: unknown }).id;
    return (typeof id === "string" && id.trim() !== "") || (typeof id === "number" && Number.isFinite(id));
  }).length;
}

/** #575: "Primeros pasos" SOLO con respuesta buena y cero vehiculos; sin peticion, no. */
export function primerosPasosEsperado(
  respuestas: { status: number; vehiculos: number | null }[],
): boolean {
  if (respuestas.length === 0) return false;
  return respuestas.every((r) => r.status >= 200 && r.status < 300 && r.vehiculos === 0);
}

/** Un .xlsx es un zip: empieza por "PK\x03\x04". */
export function esXlsx(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/** Los motivos por los que la plantilla servida no vale; vacio = vale (#577 §3). */
export function fallosDePlantilla(
  plantilla: { ruta: string; version: string },
  servida: { status: number; bytes: Uint8Array },
): string[] {
  const fallos: string[] = [];
  const nombre = plantilla.ruta.split("/").pop() ?? "";
  if (!nombre.toLowerCase().endsWith(".xlsx")) fallos.push(`la ruta no es un .xlsx: ${plantilla.ruta}`);
  if (!nombre.includes(plantilla.version)) fallos.push(`el nombre no lleva la version ${plantilla.version}: ${nombre}`);
  if (servida.status !== 200) fallos.push(`la plantilla responde ${servida.status}`);
  else if (servida.bytes.length === 0) fallos.push("la plantilla pesa 0 bytes");
  else if (!esXlsx(servida.bytes)) fallos.push("lo servido no es un .xlsx (no empieza por PK)");
  return fallos;
}
