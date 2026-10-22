import { apiFetch } from "@/lib/api/fetch-client";
import { textos, type Idioma } from "@/lib/realtor/textos";

/** Tipos y rutas de C-RE-ALTA 1.0.0 (congelado). El tenant NUNCA viaja desde aqui. */
export const BASE_ALTA = "/api/v1/realestate/alta";

export type Perfil = { owner_person_id: string; jurisdiction_code: string; default_language: string; kind: "agent" | "brokerage" };
export type Revision = { check: string; passed: boolean };
export type Resultado = {
  agente_id: string; marca_id: string; revisiones: Revision[]; demo: boolean;
  licencia_id?: string; licencia_estado?: string;
};
export type Datos = {
  licencia: string;
  tipoLicencia: string;
  nombre: string;
  broker: { usar: boolean; razonSocial: string; nombre: string };
  marca: { nombre: string; slug: string; frase: string };
  idioma: string;
};
export type Errores = Partial<Record<"licencia" | "nombre" | "razonSocial" | "marcaNombre" | "slug", true>>;
export type Enviar = (ruta: string, init?: RequestInit) => Promise<Response>;

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const DATOS_VACIOS: Datos = {
  licencia: "",
  tipoLicencia: "fl-sales",
  nombre: "",
  broker: { usar: false, razonSocial: "", nombre: "" },
  marca: { nombre: "", slug: "", frase: "" },
  idioma: "es",
};

/** Con `kind` ausente se trata como agente: el contrato prohibe la firma en kind=agent. */
export function validar(d: Datos, kind: Perfil["kind"] = "agent"): Errores {
  const e: Errores = {};
  const n = d.licencia.trim();
  if (n.length < 1 || n.length > 64) e.licencia = true;
  if (!d.nombre.trim()) e.nombre = true;
  if (kind === "brokerage" && (!d.broker.razonSocial.trim() || !d.broker.nombre.trim())) e.razonSocial = true;
  if (!d.marca.nombre.trim()) e.marcaNombre = true;
  if (!SLUG.test(d.marca.slug)) e.slug = true;
  return e;
}

/** Ejemplo SINTETICO del contrato; solo se usa rotulado DEMO. */
export const REVISIONES_DEMO: Revision[] = [
  { check: "tenant_active", passed: true },
  { check: "license_linked", passed: true },
  { check: "license_verified", passed: false },
];

export class ErrorAlta extends Error {
  constructor(readonly estado: number) {
    super(`alta_${estado}`);
  }
}

async function llamar<T>(enviar: Enviar, metodo: string, ruta: string, cuerpo?: unknown, clave?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (clave) headers["Idempotency-Key"] = clave;
  const res = await enviar(`${BASE_ALTA}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (!res.ok) throw new ErrorAlta(res.status);
  return (await res.json()) as T;
}

export const leerPerfil = (enviar: Enviar = apiFetch) => llamar<Perfil>(enviar, "GET", "/tenant/profile");

/** La clave depende del cuerpo: corregir un dato tras un 422 no reutiliza la clave con otro cuerpo (409 IDEMPOTENCY_KEY_REUSED). */
function clave(paso: string, base: string, cuerpo: unknown): string {
  const t = JSON.stringify(cuerpo);
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return `${base}:${paso}:${h.toString(36)}`;
}

/** Firma del propio tenant (solo kind=brokerage): solo se lee. Crearla (POST /brokerage) queda fuera del alta P0. */
async function leerFirma(enviar: Enviar): Promise<string> {
  return (await llamar<{ id: string }>(enviar, "GET", "/brokerage")).id;
}

type Agente = { id: string; person_id?: string; license_id?: string | null };
export type Licencia = { id: string; status: string };

/** Recupera el agente del titular (listAgents, tenant del JWT); la lista se pagina por cursor. */
async function buscarAgente(persona: string, enviar: Enviar): Promise<Agente | undefined> {
  let cursor = "";
  for (let i = 0; i < 20; i++) {
    const r = await llamar<{ items: Agente[]; next_cursor?: string | null }>(enviar, "GET", `/agents?limit=200${cursor}`);
    const hallado = r.items.find((a) => a.person_id === persona);
    if (hallado || !r.next_cursor) return hallado;
    cursor = `&cursor=${encodeURIComponent(r.next_cursor)}`;
  }
  return undefined;
}

/** Alta: agente (recupera el existente) -> licencia por numero (pendiente) -> marca -> revision. Un fallo corta todo. */
export async function enviarAlta(d: Datos, perfil: Perfil, base: string, enviar: Enviar = apiFetch): Promise<Resultado> {
  const brokerageId = perfil.kind === "brokerage" ? await leerFirma(enviar) : undefined;
  const cuerpoAgente = {
    person_id: perfil.owner_person_id,
    display_name: d.nombre.trim(),
    jurisdiction_code: perfil.jurisdiction_code,
    language: d.idioma,
    ...(brokerageId ? { brokerage_id: brokerageId } : {}),
  };
  let agente = await buscarAgente(perfil.owner_person_id, enviar);
  if (!agente) {
    try {
      agente = await llamar<Agente>(enviar, "POST", "/agents", cuerpoAgente, clave("agente", base, cuerpoAgente));
    } catch (e) {
      if (!(e instanceof ErrorAlta) || e.estado !== 409) throw e;
      agente = await buscarAgente(perfil.owner_person_id, enviar);   // lo creo otro (runbook, otra pestana)
      if (!agente) throw e;
    }
  }
  let licencia: Licencia | undefined;
  if (!agente.license_id) {
    const cuerpoLicencia = {
      holder_person_id: perfil.owner_person_id,
      jurisdiction_code: perfil.jurisdiction_code,
      license_type: d.tipoLicencia.trim(),
      license_number: d.licencia.trim(),
      ...(brokerageId ? { brokerage_id: brokerageId } : {}),
    };
    licencia = await llamar<Licencia>(enviar, "POST", "/licenses", cuerpoLicencia, clave("licencia", base, cuerpoLicencia));
    const vinculo = { license_id: licencia.id };
    await llamar(enviar, "PUT", `/agents/${encodeURIComponent(agente.id)}/license`, vinculo, clave("vinculo", base, vinculo));
  }
  const cuerpoMarca = {
    owner_kind: "agent",
    owner_id: agente.id,
    display_name: d.marca.nombre.trim(),
    public_slug: d.marca.slug,
    languages: [d.idioma],
    ...(d.marca.frase.trim() ? { tagline: d.marca.frase.trim() } : {}),
  };
  const marca = await llamar<{ id: string }>(enviar, "POST", "/brands", cuerpoMarca, clave("marca", base, cuerpoMarca));
  const r = await llamar<{ checks: Revision[] }>(enviar, "GET", `/agents/${encodeURIComponent(agente.id)}/readiness`);
  return {
    agente_id: agente.id, marca_id: marca.id, revisiones: r.checks, demo: false,
    licencia_id: licencia?.id ?? agente.license_id ?? undefined, licencia_estado: licencia?.status,
  };
}

/** Solo el broker supervisor o el propietario pueden (el servidor lo decide: 403 para el resto). Nunca automatica. */
export const verificarLicencia = (id: string, outcome: "verified" | "rejected", enviar: Enviar = apiFetch) =>
  llamar<Licencia>(enviar, "PUT", `/licenses/${encodeURIComponent(id)}/verification`, { outcome });

const MENSAJES: Record<Idioma, Record<number, string>> = {
  es: {
    403: "No tienes permiso para esta acción. Pide acceso al propietario o al broker supervisor.",
    404: "No encontramos ese registro en tu cuenta.",
    409: "Ya existe un registro igual (agente o licencia). Revisa lo registrado antes de repetir.",
    422: "Algún dato no es válido. Corrígelo y vuelve a enviar.",
  },
  en: {
    403: "You do not have permission for this action. Ask the owner or the supervising broker for access.",
    404: "We could not find that record in your account.",
    409: "An identical record (agent or license) already exists. Review what is registered before retrying.",
    422: "Some data is not valid. Fix it and submit again.",
  },
};

/** Mensaje propio para 403, 404, 409 y 422; cualquier otro estado, el generico. */
export function mensajeError(estado: number, idioma: Idioma): string {
  return MENSAJES[idioma][estado] ?? textos(idioma).errorGeneral;
}

/** Sin backend vivo: nada sale de la pantalla y el resultado va marcado DEMO. */
export function altaDemo(): Resultado {
  return { agente_id: "demo", marca_id: "demo", revisiones: REVISIONES_DEMO, demo: true };
}
