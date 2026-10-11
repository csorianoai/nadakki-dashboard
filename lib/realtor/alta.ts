import { apiFetch } from "@/lib/api/fetch-client";

/** Tipos y rutas de C-RE-ALTA 1.0.0 (congelado). El tenant NUNCA viaja desde aqui. */
export const BASE_ALTA = "/api/v1/realestate/alta";

export type Perfil = { owner_person_id: string; jurisdiction_code: string; default_language: string; kind: "agent" | "brokerage" };
export type Revision = { check: string; passed: boolean };
export type Resultado = { agente_id: string; marca_id: string; revisiones: Revision[]; demo: boolean };
export type Datos = {
  licencia: string;
  nombre: string;
  broker: { usar: boolean; razonSocial: string; nombre: string };
  marca: { nombre: string; slug: string; frase: string };
  idioma: string;
};
export type Errores = Partial<Record<"licencia" | "nombre" | "razonSocial" | "marcaNombre" | "slug", true>>;
export type Enviar = (ruta: string, init?: RequestInit) => Promise<Response>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const DATOS_VACIOS: Datos = {
  licencia: "",
  nombre: "",
  broker: { usar: false, razonSocial: "", nombre: "" },
  marca: { nombre: "", slug: "", frase: "" },
  idioma: "es",
};

export function validar(d: Datos): Errores {
  const e: Errores = {};
  if (!UUID.test(d.licencia.trim())) e.licencia = true;
  if (!d.nombre.trim()) e.nombre = true;
  if (d.broker.usar && (!d.broker.razonSocial.trim() || !d.broker.nombre.trim())) e.razonSocial = true;
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

const clave = (paso: string, base: string) => `${base}:${paso}`;

/** Alta completa: broker (opcional) -> agente -> licencia -> marca -> revision. Un fallo corta todo. */
export async function enviarAlta(d: Datos, perfil: Perfil, base: string, enviar: Enviar = apiFetch): Promise<Resultado> {
  let brokerageId: string | undefined;
  if (d.broker.usar) {
    const b = await llamar<{ id: string }>(
      enviar, "POST", "/brokerage",
      { legal_name: d.broker.razonSocial.trim(), display_name: d.broker.nombre.trim(), jurisdiction_code: perfil.jurisdiction_code },
      clave("broker", base),
    );
    brokerageId = b.id;
  }
  const agente = await llamar<{ id: string }>(
    enviar, "POST", "/agents",
    {
      person_id: perfil.owner_person_id,
      display_name: d.nombre.trim(),
      jurisdiction_code: perfil.jurisdiction_code,
      language: d.idioma,
      ...(brokerageId ? { brokerage_id: brokerageId } : {}),
    },
    clave("agente", base),
  );
  await llamar(enviar, "PUT", `/agents/${encodeURIComponent(agente.id)}/license`, { license_id: d.licencia.trim() }, clave("licencia", base));
  const marca = await llamar<{ id: string }>(
    enviar, "POST", "/brands",
    {
      owner_kind: "agent",
      owner_id: agente.id,
      display_name: d.marca.nombre.trim(),
      public_slug: d.marca.slug,
      languages: [d.idioma],
      ...(d.marca.frase.trim() ? { tagline: d.marca.frase.trim() } : {}),
    },
    clave("marca", base),
  );
  const r = await llamar<{ checks: Revision[] }>(enviar, "GET", `/agents/${encodeURIComponent(agente.id)}/readiness`);
  return { agente_id: agente.id, marca_id: marca.id, revisiones: r.checks, demo: false };
}

/** Sin backend vivo: nada sale de la pantalla y el resultado va marcado DEMO. */
export function altaDemo(): Resultado {
  return { agente_id: "demo", marca_id: "demo", revisiones: REVISIONES_DEMO, demo: true };
}
