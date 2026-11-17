// CSP estricta: los sitios sirven solo contenido y configuracion; nada de codigo del cliente ni de la IA.
// Sin 'unsafe-inline' ni 'unsafe-eval'. Terceros solo desde la lista fija de abajo, nunca elegida por el cliente.

/** Terceros permitidos (mapas, etiquetas): lista FIJA en codigo. Vacia hasta que una plantilla los necesite. */
export const THIRD_PARTY = { script: [] as string[], img: [] as string[], connect: [] as string[], frame: [] as string[] };

const HOST = /^(?:https:\/\/)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?$/i;

/** SITES_MEDIA_HOSTS = "a.cdn.example,b.cdn.example". Entradas invalidas se descartan (nunca se inyectan en la politica). */
export function mediaHostsFromEnv(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((h) => h.trim().toLowerCase()).filter((h) => HOST.test(h)).map((h) => (h.startsWith('https://') ? h : `https://${h}`));
}

export interface CspOptions {
  /** Hosts de medios de ESTE despliegue (env), no del sitio entrante. */
  mediaHosts: string[];
  /** nonce por peticion: NO se usa en produccion (ver spec/st2-04-render-isr/csp-medicion.md); solo para la medicion. */
  nonce?: string;
  /** hashes sha256-... de scripts inline de build. */
  hashes?: string[];
}

export function buildCsp(o: CspOptions): string {
  const script = ["'self'", ...(o.nonce ? [`'nonce-${o.nonce}'`] : []), ...(o.hashes ?? []).map((h) => `'${h}'`), ...THIRD_PARTY.script];
  const d: [string, string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', script],
    ['style-src', ["'self'"]],
    ['img-src', ["'self'", 'data:', ...o.mediaHosts, ...THIRD_PARTY.img]],
    ['connect-src', ["'self'", ...THIRD_PARTY.connect]],
    ['frame-src', THIRD_PARTY.frame.length ? THIRD_PARTY.frame : ["'none'"]],
    ['frame-ancestors', ["'none'"]],
    ['base-uri', ["'none'"]],
    ['form-action', ["'self'"]],
    ['object-src', ["'none'"]],
  ];
  return d.map(([k, v]) => `${k} ${v.join(' ')}`).join('; ') + '; upgrade-insecure-requests';
}

const HASH = /^sha256-[A-Za-z0-9+/]{43}=$/;

/** SITES_CSP_SCRIPT_HASHES = "sha256-...,sha256-..." (scripts inline CONSTANTES de build). Invalidos se descartan. */
export function hashesFromEnv(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((h) => h.trim()).filter((h) => HASH.test(h));
}

/** Cabecera de este despliegue: hosts y hashes salen del env del despliegue, nunca del sitio ni de la peticion. */
export function cspForDeployment(env: Record<string, string | undefined> = process.env): string {
  return buildCsp({ mediaHosts: mediaHostsFromEnv(env.SITES_MEDIA_HOSTS), hashes: hashesFromEnv(env.SITES_CSP_SCRIPT_HASHES) });
}
