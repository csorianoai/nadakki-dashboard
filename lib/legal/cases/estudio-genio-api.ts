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
    resultado?: unknown;
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
