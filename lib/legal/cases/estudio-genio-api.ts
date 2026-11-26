import { apiFetch } from "@/lib/api/fetch-client";
import { readLegalJson, throwIfLegalApiError, LegalApiHttpError } from "@/lib/legal/parse-api-error";
import { legalCaughtErrorToSpanish } from "@/lib/legal/api-error-es";
import m from "@/messages/es/legal-estudio-genio.json";
export type Paquete = "completo" | "esencial";
export type Correccion = {
    tema: string;
    texto: string;
};
export type Revision = {
    estado: "aprobado" | "rechazado";
    firmante: string;
    colegiatura?: string;
    fecha?: string;
    correcciones: Correccion[];
    notas?: string;
};
export type Estudio = {
    estudio_id: string;
    estado: "en_curso" | "completado" | "fallido" | "interrumpido";
    paquete: Paquete;
    iniciado: string;
    terminado?: string;
    motivo?: string;
    fases: {
        fase: string;
        cuando: string;
        datos?: unknown;
    }[];
    revision?: Revision;
    revisiones_nadakki?: RevisionesNadakki;
    resultado?: unknown;
};
export type DecisionNadakki = "aprobado" | "con_correcciones" | "rechazado";
export type SolicitudNadakki = {
    solicitud_id: string;
    estado: "pendiente" | "respondida";
    nota?: string | null;
    solicitada?: string;
    respondida?: string;
    decision?: DecisionNadakki;
    firmante?: string;
    colegiatura?: string | null;
    correcciones?: Correccion[];
    notas?: string | null;
};
export type RevisionesNadakki = {
    incluidas: number;
    usadas: number;
    disponibles: number;
    pendiente: boolean;
    solicitudes: SolicitudNadakki[];
};
export type Pedido = {
    paquete: Paquete;
    pedido?: string;
    especialidad?: string;
};
export type Firma = Omit<Revision, "estado" | "fecha"> & {
    decision: Revision["estado"];
};
const base = (caseId: string) => `/api/legal/cases/${encodeURIComponent(caseId)}/estudio-genio`;
const item = (caseId: string, studyId: string) => `${base(caseId)}/${encodeURIComponent(studyId)}`;
const headers = (tenantId: string) => ({ "X-Tenant-ID": tenantId.trim(), Accept: "application/json" });
export const noHabilitado = (e: unknown) => e instanceof LegalApiHttpError && e.status === 403 && e.detail === "ESTUDIO_GENIO_NO_HABILITADO";
export function errorGenio(e: unknown): string {
    const status = typeof (e as {
        status?: number;
    })?.status === "number" ? (e as {
        status: number;
    }).status : 0;
    return noHabilitado(e) ? m.disabled : legalCaughtErrorToSpanish(e, { [String(status)]: m.errors[String(status) as keyof typeof m.errors] ?? m.error });
}
export async function listEstudios(tenantId: string, caseId: string) {
    const res = await apiFetch(base(caseId), { headers: headers(tenantId) });
    const raw = await readLegalJson<{
        habilitado: boolean;
        estudios: Estudio[];
    }>(res, m.error);
    if (typeof raw.habilitado !== "boolean" || !Array.isArray(raw.estudios))
        throw new Error(m.error);
    // The full result and phase data can be large. Only retain list/progress metadata.
    return { habilitado: raw.habilitado, estudios: raw.estudios.map(({ resultado: _result, ...s }) => ({ ...s, fases: (s.fases ?? []).map(({ fase, cuando }) => ({ fase, cuando })) })) };
}
async function post<T>(tenantId: string, path: string, body: unknown): Promise<T> {
    const res = await apiFetch(path, { method: "POST", headers: { ...headers(tenantId), "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return readLegalJson<T>(res, m.error);
}
export const pedirEstudio = (tenantId: string, caseId: string, body: Pedido) => post<{
    estudio_id: string;
    estado: string;
    ya_existia: boolean;
    paquete: Paquete;
}>(tenantId, base(caseId), body);
export const revisarEstudio = (tenantId: string, caseId: string, studyId: string, body: Firma) => post<unknown>(tenantId, `${item(caseId, studyId)}/revision`, body);
export const pedirRevisionNadakki = (tenantId: string, caseId: string, studyId: string, nota?: string) =>
    post<{ solicitud_id: string; estado: string; disponibles: number }>(tenantId, `${item(caseId, studyId)}/revision-nadakki`, nota ? { nota } : {});
/** Explica los rechazos estables de la revisión de Nadakki (409 con código) o cae al error general. */
export function errorRevisionNadakki(e: unknown): string {
    const detail = e instanceof LegalApiHttpError ? String(e.detail ?? "") : "";
    const propios = m.nadakki.errores as Record<string, string>;
    return propios[detail] ?? errorGenio(e);
}

/* Cola del abogado de Nadakki (superadmin). El backend devuelve 403 SOLO_SUPERADMIN_NADAKKI a cualquier otro. */
export type PendienteNadakki = {
    solicitud_id: string;
    estudio_id: string;
    case_id: string;
    tenant_id: string;
    despacho: string;
    despacho_nombre: string;
    nota?: string | null;
    solicitada: string;
};
export type RespuestaNadakki = {
    decision: DecisionNadakki;
    firmante: string;
    colegiatura?: string;
    correcciones: Correccion[];
    notas?: string;
};
const admin = "/api/legal/cases/estudio-genio/admin/revisiones";
export async function listRevisionesPendientes(tenantId: string): Promise<PendienteNadakki[]> {
    const res = await apiFetch(admin, { headers: headers(tenantId) });
    const raw = await readLegalJson<{ revisiones: PendienteNadakki[] }>(res, m.error);
    return Array.isArray(raw.revisiones) ? raw.revisiones : [];
}
export const responderRevisionNadakki = (tenantId: string, p: PendienteNadakki, body: RespuestaNadakki) =>
    post<unknown>(tenantId, `${admin}/${[p.tenant_id, p.case_id, p.estudio_id, p.solicitud_id].map(encodeURIComponent).join("/")}`, body);
/** 403: no es del equipo de Nadakki. 404: el backend aún no tiene la cola. En ambos casos no se muestra nada. */
export const soloNadakki = (e: unknown) => e instanceof LegalApiHttpError && (e.status === 403 || e.status === 404);

export async function informeEstudio(tenantId: string, caseId: string, studyId: string, format: "html" | "pdf") {
    const res = await apiFetch(`${item(caseId, studyId)}/informe?formato=${format}`, { headers: { ...headers(tenantId), Accept: format === "pdf" ? "application/pdf" : "text/html" } });
    await throwIfLegalApiError(res, m.error);
    return res;
}
export async function descargarEstudio(tenantId: string, caseId: string, studyId: string) {
    const res = await informeEstudio(tenantId, caseId, studyId, "pdf");
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudio-genio-${studyId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type Metodo = "stripe" | "transferencia";
export type Saldo = Record<Paquete, { disponible: boolean; disponibles: number | null; comprados: number | null; usados: number | null }>;
export type Compra = {
    compra_id: string;
    paquete: Paquete;
    cantidad: number;
    monto_usd: number;
    metodo: Metodo;
    estado: "pendiente" | "confirmada" | "rechazada" | "cancelada";
    referencia?: string | null;
    motivo?: string | null;
    created_at: string;
};
export type ComprasResp = {
    compras: Compra[];
    saldo: Saldo;
    precios_usd: Record<Paquete, number>;
    datos_transferencia: string;
    metodos_disponibles: Metodo[];
};
export type NuevaCompra = { paquete: Paquete; cantidad: number; metodo: Metodo; referencia?: string; comprobante?: string; url_retorno?: string };
const compras = "/api/legal/cases/estudio-genio/compras";
export async function listCompras(tenantId: string): Promise<ComprasResp> {
    const res = await apiFetch(compras, { headers: headers(tenantId) });
    const raw = await readLegalJson<ComprasResp>(res, m.error);
    return { ...raw, compras: raw.compras ?? [], metodos_disponibles: raw.metodos_disponibles ?? [] };
}
export const comprar = (tenantId: string, body: NuevaCompra) =>
    post<Compra & { url_pago?: string; instrucciones?: string }>(tenantId, compras, body);
export const verificarCompra = (tenantId: string, compraId: string) =>
    post<Compra>(tenantId, `${compras}/${encodeURIComponent(compraId)}/verificar`, {});
