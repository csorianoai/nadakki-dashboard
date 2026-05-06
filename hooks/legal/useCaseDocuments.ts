"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCaseDetail, ingestDocument } from "@/lib/legal/cases/legal-cases-api";

export function useCaseDocuments(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["legal_case_documents", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => {
      const c = await fetchCaseDetail(tenantId!, caseId!);
      return { documents: c.documents ?? [] };
    },
  });
  const upload = useMutation({
    mutationFn: async (formData: FormData) => ingestDocument(tenantId!, caseId!, formData),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_documents", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
    },
  });
  return { ...q, uploadDocument: upload.mutateAsync, uploading: upload.isPending };
}
