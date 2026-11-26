"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listEstudios, pedirEstudio, revisarEstudio, informeEstudio, pedirRevisionNadakki, listRevisionesPendientes, responderRevisionNadakki, type Pedido, type Firma, type PendienteNadakki, type RespuestaNadakki } from "@/lib/legal/cases/estudio-genio-api";
export function useEstudioGenio(tenantId: string, caseId: string) {
    const client = useQueryClient();
    const queryKey = ["legal_estudio_genio", tenantId, caseId];
    const q = useQuery({ queryKey, queryFn: () => listEstudios(tenantId, caseId), enabled: Boolean(tenantId && caseId), retry: false,
        refetchInterval: (query) => query.state.data?.estudios.some((s) => s.estado === "en_curso") ? 20000 : false });
    const refresh = () => client.invalidateQueries({ queryKey });
    const request = useMutation({ mutationFn: (body: Pedido) => pedirEstudio(tenantId, caseId, body), onSuccess: refresh });
    const review = useMutation({ mutationFn: ({ estudioId, body }: {
            estudioId: string;
            body: Firma;
        }) => revisarEstudio(tenantId, caseId, estudioId, body), onSuccess: refresh });
    const nadakki = useMutation({ mutationFn: ({ estudioId, nota }: {
            estudioId: string;
            nota?: string;
        }) => pedirRevisionNadakki(tenantId, caseId, estudioId, nota), onSuccess: refresh });
    return { ...q, request, review, nadakki };
}
export function useInformeGenio(tenantId: string, caseId: string, studyId?: string) {
    return useQuery({ queryKey: ["legal_estudio_informe", tenantId, caseId, studyId], enabled: Boolean(studyId), retry: false,
        queryFn: async () => (await informeEstudio(tenantId, caseId, studyId!, "html")).text() });
}
/** Cola del abogado de Nadakki: solicitudes de revisión de todos los despachos (solo superadmin). */
export function useColaRevisionesNadakki(tenantId: string) {
    const client = useQueryClient();
    const queryKey = ["legal_estudio_genio_cola", tenantId];
    const q = useQuery({ queryKey, queryFn: () => listRevisionesPendientes(tenantId), enabled: Boolean(tenantId), retry: false });
    const responder = useMutation({ mutationFn: ({ p, body }: {
            p: PendienteNadakki;
            body: RespuestaNadakki;
        }) => responderRevisionNadakki(tenantId, p, body), onSuccess: () => client.invalidateQueries({ queryKey }) });
    return { ...q, responder };
}
