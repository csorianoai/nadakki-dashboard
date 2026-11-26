"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listEstudios, pedirEstudio, revisarEstudio, informeEstudio, type Pedido, type Firma } from "@/lib/legal/cases/estudio-genio-api";
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
    return { ...q, request, review };
}
export function useInformeGenio(tenantId: string, caseId: string, studyId?: string) {
    return useQuery({ queryKey: ["legal_estudio_informe", tenantId, caseId, studyId], enabled: Boolean(studyId), retry: false,
        queryFn: async () => (await informeEstudio(tenantId, caseId, studyId!, "html")).text() });
}
